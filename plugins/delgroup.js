export default async (clients, m, { isOwner, isGroup, body, prefix, cmd }) => {
    if (!isOwner) return

    if (isGroup) {
        let targetJid = m.chat
        let idx = db.groups?.findIndex(g => g.id === targetJid)
        if (idx === undefined || idx === -1) return m.reply('Grup tidak ditemukan dalam daftar')

        let name = db.groups[idx].name
        db.groups.splice(idx, 1)
        saveDb()
        await clients.sendMessage(m.chat, { text: `Grup *${name}* berhasil dihapus dari daftar.` })
        logger.info(`Grup dihapus: ${targetJid}`)
        return
    }

    // PRIVATE CHAT - show registered groups to select
    if (!db.groups || db.groups.length === 0) {
        return m.reply('Belum ada grup terdaftar.')
    }

    let sections = []
    let rows = []
    for (let [i, g] of db.groups.entries()) {
        let name = g.name || g.id
        let shortName = name.length > 25 ? name.slice(0, 22) + '...' : name
        let encoded = g.id.replace(/@g\.us$/, '_g')
        rows.push({
            title: shortName,
            id: `delgrp_${encoded}`,
            description: `${g.id.split('@')[0]}`
        })
    }
    sections.push({ title: `Grup Terdaftar (${db.groups.length})`, rows })

    await clients.sendMessage(m.chat, {
        text: `Pilih grup yang ingin dihapus dari daftar:`,
        contextInfo: { externalAdReply: AD_REPLY },
        interactiveMessage: {
            title: 'Hapus Grup',
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
