import * as bail from 'ourin-baileys'

export default async (clients, m, { isOwner, isGroup }) => {
    if (!isGroup) return m.reply('Perintah ini hanya untuk grup.')
    if (!isOwner) return m.reply('Hanya owner yang bisa menggunakan ini.')

    let meta = await clients.groupMetadata(m.chat).catch(() => null)
    if (!meta) return m.reply('Gagal mendapatkan info grup.')

    let body = m.body || ''
    let input = body.slice(body.indexOf(' ') + 1).trim() || ' '
    let members = meta.participants?.map(p => p.id) || []

    await clients.sendMessage(m.chat, {
        text: input,
        contextInfo: { mentionedJid: members }
    })
}
