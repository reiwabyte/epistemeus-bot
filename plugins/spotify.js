import { spotifyDl, spotifyDlByName } from '../scrape/spotify.js'

export default async (clients, m, { isOwner, prefix }) => {
    if (!isOwner) return

    let input = m.body.slice(m.body.indexOf(' ') + 1).trim()
    if (!input) return m.reply('Gunakan: ' + prefix + 'spotify [url | judul lagu]')

    await m.react('⏳')
    try {
        let isUrl = /spotify\.com\/track\//i.test(input) || /^[a-zA-Z0-9]{22}$/.test(input)
        let res = isUrl ? await spotifyDl(input) : await spotifyDlByName(input)

        let teks = ''
        teks += res.title + ' - ' + res.artist + '\n'
        teks += 'Durasi: ' + res.duration

        await clients.sendMessage(m.chat, {
            audio: res.audioBuffer,
            mimetype: 'audio/mpeg',
            ptt: false,
            contextInfo: {
                externalAdReply: {
                    title: res.title,
                    body: res.artist,
                    thumbnailUrl: res.thumbnail || undefined,
                    mediaType: 1,
                    showAdAttribution: false
                }
            }
        }, { quoted: m })

        await m.react('✅')
    } catch (e) {
        await m.react('❌')
        m.reply('Gagal: ' + (e.message || 'Error'))
    }
}
