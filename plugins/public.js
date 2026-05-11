export default async (clients, m, { isOwner }) => {
    if (!isOwner) return
    set.self = false
    await m.reply('Mode publik diaktifkan. Semua orang bisa menggunakan bot.')
}
