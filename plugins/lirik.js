import { lirikSearch } from '../scrape/lirik.js'

export default async (clients, m, { isOwner, prefix }) => {
    if (!isOwner) return

    let input = m.body.slice(m.body.indexOf(' ') + 1).trim()
    if (!input) return m.reply('Gunakan: ' + prefix + 'lirik [judul lagu]')

    await m.react('🔎')
    try {
        let res = await lirikSearch(input)

        let teks = ''
        teks += 'Lirik Lagu\n'
        teks += '\n'
        teks += 'Judul: ' + res.trackName + '\n'
        teks += 'Artis: ' + res.artistName + '\n'
        teks += 'Album: ' + (res.albumName || '-') + '\n'
        teks += '\n'
        teks += res.lyrics

        await m.reply(teks)
        await m.react('✅')
    } catch (e) {
        await m.react('❌')
        m.reply('Gagal: ' + (e.message || 'Error'))
    }
}