export default async (clients, m, { isOwner, isGroup, prefix }) => {
    if (!isOwner) return
    if (!isGroup) return m.reply('Perintah ini hanya bisa digunakan di dalam grup')

    let target = m.mentionedJid?.[0] || m.quoted?.sender
    if (!target) return m.reply(`Gunakan: ${prefix}ban @pengguna`)

    let targetNum = target.split('@')[0]
    if (!db.banned) db.banned = []
    if (!db.banned.includes(targetNum)) {
        db.banned.push(targetNum)
        saveDb()
    }

    try {
        await clients.groupParticipantsUpdate(m.chat, [target], 'remove')
    } catch (e) {
        logger.warn(`Gagal mengeluarkan ${target}: ${e.message}`)
    }

    await m.reply(`@${targetNum} telah diblokir. Nomor ini tidak bisa bergabung ke grup yang dikelola.`, { contextInfo: { mentionedJid: [target] } })
    logger.info(`Memblokir ${target}`)
}
