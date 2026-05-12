export default async (clients, m, { isOwner, isGroup }) => {
    if (!isOwner) return

    if (isGroup) {
        let meta = await clients.groupMetadata(m.chat).catch(() => null)
        let targetName = meta?.subject || m.chat

        let exists = db.groups?.find(g => g.id === m.chat)
        if (exists) {
            exists.name = targetName
            saveDb()
            await m.reply(`Grup ${targetName} sudah terdaftar, nama diperbarui`)
            return
        }

        if (!db.groups) db.groups = []
        db.groups.push({ id: m.chat, name: targetName })
        saveDb()

        await clients.sendMessage(m.chat, {
            text: `Grup *${targetName}* berhasil didaftarkan!\nPermintaan bergabung untuk grup ini sekarang akan diproses.`,
            contextInfo: { externalAdReply: AD_REPLY }
        })
        logger.info(`Grup terdaftar: ${m.chat} (${targetName})`)
        return
    }

    // PRIVATE CHAT - show unregistered groups to select
    let allGroups = Object.entries(clients.chats || {})
        .filter(([id]) => id.endsWith('@g.us'))
        .sort(([, a], [, b]) => (a.subject || '').localeCompare(b.subject || ''))

    let unregistered = allGroups.filter(([id]) => !db.groups?.some(g => g.id === id))

    if (unregistered.length === 0) {
        return m.reply('Semua grup sudah terdaftar.')
    }

    let sections = []
    let rows = []
    for (let [i, [jid, meta]] of unregistered.entries()) {
        let name = meta.subject || jid
        let shortName = name.length > 25 ? name.slice(0, 22) + '...' : name
        let encoded = jid.replace(/@g\.us$/, '_g')
        rows.push({
            title: shortName,
            id: `setgrp_${encoded}`,
            description: `${jid.split('@')[0]}`
        })
    }
    sections.push({ title: `Grup Belum Terdaftar (${unregistered.length})`, rows })

    await clients.sendMessage(m.chat, {
        text: `Pilih grup yang ingin didaftarkan:`,
        contextInfo: { externalAdReply: AD_REPLY },
        interactiveMessage: {
            title: 'Daftarkan Grup',
            footer: 'Epistemeia Bot',
            header: 'Pilih Grup',
            buttons: [
                {
                    name: 'single_select',
                    buttonParamsJson: JSON.stringify({ title: 'Pilih Grup', sections })
                }
            ]
        }
    })
}
