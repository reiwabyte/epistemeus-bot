import { ytdlV1, ytdlV2, ytdlV4 } from '../scrape/youtube.js'

export default async (clients, m, { isOwner, prefix }) => {
    if (!isOwner) return

    let input = m.body.slice(m.body.indexOf(' ') + 1).trim()
    if (!input) return m.reply('Gunakan: ' + prefix + 'yt [url YouTube]')

    await m.react('⏳')
    try {
        let res
        try {
            res = await ytdlV1(input, '360')
        } catch {
            try { res = await ytdlV2(input, 'mp4') } catch { res = await ytdlV4(input, '360') }
        }

        await clients.sendMessage(m.chat, {
            video: { url: res.download_url },
            caption: res.title || 'YouTube Video'
        }, { quoted: m })

        await m.react('✅')
    } catch (e) {
        await m.react('❌')
        m.reply('Gagal: ' + (e.message || 'Error'))
    }
}
