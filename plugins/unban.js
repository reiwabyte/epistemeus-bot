export default async (clients, m, { isOwner, body, prefix, cmd }) => {
    if (!isOwner) return

    let target = m.mentionedJid?.[0] || m.quoted?.sender || null
    if (!target) {
        let args = body.slice(prefix.length + cmd.length).trim().split(/ +/)
        let num = args[0]?.replace(/[^0-9]/g, '')
        if (num) target = num
    }

    if (!target) return m.reply(`Gunakan: ${prefix}unban @pengguna`)

    let targetNum = target.includes('@') ? target.split('@')[0] : target
    if (!db.banned) db.banned = []
    let idx = db.banned.indexOf(targetNum)
    if (idx === -1) return m.reply(`${targetNum} tidak ada dalam daftar blokir`)

    db.banned.splice(idx, 1)
    saveDb()

    await m.reply(`${targetNum} telah dibuka blokirnya.`)
    logger.info(`Membuka blokir ${targetNum}`)
}
