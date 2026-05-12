export default async (clients, m, { isOwner, isGroup }) => {
    if (!isGroup) return m.reply('Perintah ini hanya untuk grup.')
    if (!isOwner) return m.reply('Hanya owner yang bisa menggunakan ini.')

    try {
        let link = await clients.groupInviteCode(m.chat)
        await m.reply('https://chat.whatsapp.com/' + link)
    } catch (e) {
        m.reply('Gagal: ' + (e.message || 'Error'))
    }
}
