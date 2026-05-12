import { tiktokDl } from '../scrape/tiktok.js'

export default async (clients, m, { isOwner, prefix }) => {
    if (!isOwner) return

    let input = m.body.slice(m.body.indexOf(' ') + 1).trim()
    if (!input) return m.reply('Gunakan: ' + prefix + 'tiktok [url TikTok]')

    await m.react('⏳')
    let res = await tiktokDl(input)
    if (!res) return m.reply('Gagal mendownload. Coba link lain.')

    let teks = ''
    teks += 'TikTok Download\n'
    teks += '\n'
    teks += 'Judul: ' + (res.title || '-') + '\n'
    teks += 'Author: ' + (res.author?.nickname || '-') + '\n'
    teks += 'Views: ' + (res.stats?.views || '0') + '\n'
    teks += 'Likes: ' + (res.stats?.likes || '0') + '\n'

    let media = res.data?.[0]
    if (!media) return m.reply('Tidak ada media ditemukan.')

    await m.react('✅')

    try {
        if (media.type === 'photo') {
            await clients.sendMessage(m.chat, { image: { url: media.url }, caption: teks })
        } else {
            await clients.sendMessage(m.chat, { video: { url: media.url }, caption: teks })
        }
    } catch (e) {
        m.reply(teks + '\n\nLink: ' + media.url)
    }
}
