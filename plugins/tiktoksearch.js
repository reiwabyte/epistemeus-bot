import { tiktokSearch } from '../scrape/tiktoksearch.js'

export default async (clients, m, { isOwner, prefix }) => {
    if (!isOwner) return

    let input = m.body.slice(m.body.indexOf(' ') + 1).trim()
    if (!input) return m.reply('Gunakan: ' + prefix + 'tiktoksearch [kata kunci]')

    await m.react('🔎')
    try {
        let results = await tiktokSearch(input, 5)

        let teks = 'TikTok Search: ' + input + '\n\n'
        for (let r of results) {
            teks += '▸ ' + r.title + '\n'
            teks += '  👤 ' + r.author.nickname + ' (@' + r.author.unique_id + ')\n'
            teks += '  ❤️ ' + (r.stats?.digg_count || 0) + '  💬 ' + (r.stats?.comment_count || 0) + '\n'
            teks += '  🎬 ' + r.media.no_watermark + '\n\n'
        }

        await clients.sendMessage(m.chat, { text: teks }, { quoted: m })
        await m.react('✅')
    } catch (e) {
        await m.react('❌')
        m.reply('Gagal: ' + (e.message || 'Error'))
    }
}
