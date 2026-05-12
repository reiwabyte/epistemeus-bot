export default async (clients, m, { isOwner }) => {
    if (!isOwner) return

    if (!db.banned || db.banned.length === 0) {
        return m.reply('Belum ada pengguna yang diblokir.')
    }

    let text = `*Daftar Blokir* (${db.banned.length})\n\n`
    db.banned.forEach((num, i) => {
        text += `${i + 1}. ${num}\n`
    })

    m.reply(text)
}
