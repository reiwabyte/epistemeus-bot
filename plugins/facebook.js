import { savefromDl } from '../scrape/savefrom.js'

export default async (clients, m, { isOwner, prefix }) => {
    if (!isOwner) return

    let input = m.body.slice(m.body.indexOf(' ') + 1).trim()
    if (!input) return m.reply('Gunakan: ' + prefix + 'fb [url Facebook]')

    await m.react('⏳')
    try {
        let res = await savefromDl(input, 'Facebook')
        let videoUrl = res.urls[0] || res.sd || res.hd
        if (!videoUrl) throw new Error('Tidak ada video ditemukan')

        await clients.sendMessage(m.chat, {
            video: { url: videoUrl },
            caption: res.title || 'Facebook Video'
        }, { quoted: m })

        await m.react('✅')
    } catch (e) {
        await m.react('❌')
        m.reply('Gagal: ' + (e.message || 'Error'))
    }
}
