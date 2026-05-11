export default async (clients, m, { isOwner, isGroup }) => {
    if (!isOwner) return
    if (!isGroup) return m.reply('Perintah ini hanya bisa digunakan di dalam grup')

    let meta = await clients.groupMetadata(m.chat).catch(() => null)
    let targetName = meta?.subject || m.chat

    let exists = db.groups?.find(g => g.id === m.chat)
    if (exists) {
        exists.name = targetName
        saveDb()
        await m.reply(`Grup ${targetName} sudah terdaftar, nama diupdate`)
        return
    }

    if (!db.groups) db.groups = []
    db.groups.push({ id: m.chat, name: targetName })
    saveDb()

    await clients.sendMessage(m.chat, {
        text: `Grup *${targetName}* berhasil didaftarkan!\nJoin request untuk grup ini sekarang akan diproses.\n\nBot akan restart...`,
        contextInfo: { externalAdReply: AD_REPLY }
    })
    logger.info(`Group registered: ${m.chat} (${targetName})`)

    await bail.delay(2000)
    process.exit(0)
}
