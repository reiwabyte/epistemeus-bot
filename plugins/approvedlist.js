export default async (clients, m, { isOwner }) => {
    if (!isOwner) return

    if (!db.communityApproved || Object.keys(db.communityApproved).length === 0) {
        return m.reply('Belum ada pengguna yang terverifikasi per komunitas.')
    }

    let total = 0
    let text = '*Pengguna Terverifikasi per Komunitas*\n\n'
    for (let cid in db.communityApproved) {
        let users = db.communityApproved[cid]
        if (!users.length) continue
        total += users.length
        text += `◈ *${cid}*\n`
        users.forEach((num, i) => {
            text += `  ${i + 1}. ${num}\n`
        })
        text += '\n'
    }

    if (!total) return m.reply('Belum ada pengguna yang terverifikasi per komunitas.')

    text += `Total: ${total}`
    m.reply(text)
}