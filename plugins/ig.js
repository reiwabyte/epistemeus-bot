import { igDl } from '../scrape/instagram.js'

export default async (clients, m, { isOwner, prefix }) => {
    if (!isOwner) return

    let input = m.body.slice(m.body.indexOf(' ') + 1).trim()
    if (!input) return m.reply('Gunakan: ' + prefix + 'ig [url Instagram]')

    await m.react('⏳')
    try {
        let res = await igDl(input)

        for (let url of res.urls) {
            await clients.sendMessage(m.chat, { video: { url } }, { quoted: m })
        }

        await m.react('✅')
    } catch (e) {
        await m.react('❌')
        m.reply('Gagal: ' + (e.message || 'Error'))
    }
}
