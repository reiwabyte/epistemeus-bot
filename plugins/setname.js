export default async (clients, m, { isOwner, isGroup }) => {
    if (!isGroup) return m.reply('Perintah ini hanya untuk grup.')
    if (!isOwner) return m.reply('Hanya owner yang bisa menggunakan ini.')

    let body = m.body || ''
    let input = body.slice(body.indexOf(' ') + 1).trim()
    if (!input) return m.reply('Masukkan nama grup baru.')

    await clients.groupUpdateSubject(m.chat, input)
    await m.reply('Nama grup berhasil diubah menjadi: ' + input)
}
