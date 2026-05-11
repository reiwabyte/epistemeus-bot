export default async (clients, m, { isOwner }) => {
    if (!isOwner) return
    set.stealth = !set.stealth
    let status = set.stealth ? 'aktif' : 'nonaktif'
    await m.reply(`Mode siluman ${status}. Perintah admin tidak akan muncul di menu.`)
}
