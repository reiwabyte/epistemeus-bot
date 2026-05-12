import { playAudio } from '../scrape/playch.js'

export default async (clients, m, { isOwner, prefix }) => {
    if (!isOwner) return

    let input = m.body.slice(m.body.indexOf(' ') + 1).trim()
    if (!input) return m.reply('Gunakan: ' + prefix + 'play [judul lagu]')

    await m.react('🔎')
    try {
        let res = await playAudio(input)

        await clients.sendMessage(m.chat, {
            audio: res.audioBuffer,
            mimetype: 'audio/mpeg',
            ptt: false,
            contextInfo: {
                externalAdReply: {
                    title: res.title,
                    body: res.channel,
                    thumbnail: res.thumbnail,
                    mediaType: 1,
                    sourceUrl: res.url,
                    showAdAttribution: false,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: m })

        await m.react('✅')
    } catch (e) {
        await m.react('❌')
        m.reply('Gagal: ' + (e.message || 'Error'))
    }
}
