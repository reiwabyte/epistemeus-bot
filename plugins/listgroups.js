export default async (clients, m, { isOwner }) => {
    if (!isOwner) return
    if (!db.groups || db.groups.length === 0) return m.reply('Belum ada grup terdaftar')
    let text = `Daftar Grup Terdaftar (${db.groups.length})\n\n`
    text += db.groups.map((g, i) => `${i + 1}. ${g.name}\n   ${g.id}`).join('\n')
    m.reply(text)
}
