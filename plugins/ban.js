export default async (clients, m, { isOwner, isGroup, prefix }) => {
    if (!isOwner) return
    if (!isGroup) return m.reply('Perintah ini hanya bisa digunakan di grup')

    let target = m.mentionedJid?.[0] || m.quoted?.sender
    if (!target) return m.reply(`Gunakan: ${prefix}ban @user`)

    let targetNum = target.split('@')[0]
    if (!db.banned) db.banned = []
    if (!db.banned.includes(targetNum)) {
        db.banned.push(targetNum)
        saveDb()
    }

    try {
        await clients.groupParticipantsUpdate(m.chat, [target], 'remove')
    } catch (e) {
        logger.warn(`Failed to kick ${target}: ${e.message}`)
    }

    await m.reply(`@${targetNum} telah di-ban. Nomor ini tidak bisa bergabung ke grup yang dikelola.`, { contextInfo: { mentionedJid: [target] } })
    logger.info(`Banned ${target}`)
}
