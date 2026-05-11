export default async (clients, m, { isOwner, isGroup, prefix }) => {
    if (!isOwner) return
    if (!isGroup) return m.reply('Perintah ini hanya bisa digunakan di dalam grup')

    let target = m.mentionedJid?.[0] || m.quoted?.sender
    if (!target) return m.reply(`Gunakan: ${prefix}warn @pengguna`)

    let targetNum = target.split('@')[0]
    let warnCount = (db.warns?.[targetNum] || 0) + 1
    if (!db.warns) db.warns = {}
    db.warns[targetNum] = warnCount
    saveDb()

    await clients.sendMessage(m.chat, {
        text: `@${targetNum} kamu mendapat peringatan dari admin. Peringatan ke-${warnCount}`,
        contextInfo: { mentionedJid: [target] }
    })
    logger.info(`Peringatan untuk ${target} (ke-${warnCount})`)
}
