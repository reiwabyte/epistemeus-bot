export default async (clients, m, { isOwner, isGroup }) => {
    if (!isGroup) return m.reply('Perintah ini hanya untuk grup.')
    if (!isOwner) return m.reply('Hanya owner yang bisa menggunakan ini.')

    let target = m.quoted?.sender || m.mentionedJid?.[0]
    if (!target) return m.reply('Tag atau reply pesan anggota yang ingin dikick.')

    try {
        await clients.groupParticipantsUpdate(m.chat, [target], 'remove')
        await clients.sendMessage(m.chat, {
            text: '@' + target.split('@')[0] + ' dikeluarkan dari grup.',
            contextInfo: { mentionedJid: [target] }
        })
    } catch (e) {
        m.reply('Gagal: ' + (e.message || 'Error'))
    }
}
