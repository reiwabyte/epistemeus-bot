export default async (clients, m, { isOwner }) => {
    if (!isOwner) return
    set.self = true
    await m.reply('Mode sendiri diaktifkan. Hanya owner yang bisa menggunakan bot.')
}
