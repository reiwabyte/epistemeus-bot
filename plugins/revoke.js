export default async (clients, m, { isOwner, isGroup }) => {
    if (!isGroup) return m.reply('Perintah ini hanya untuk grup.')
    if (!isOwner) return m.reply('Hanya owner yang bisa menggunakan ini.')

    try {
        await clients.groupRevokeInvite(m.chat)
        let link = await clients.groupInviteCode(m.chat)
        await m.reply('Link grup berhasil direset.\nLink baru: https://chat.whatsapp.com/' + link)
    } catch (e) {
        m.reply('Gagal: ' + (e.message || 'Error'))
    }
}
