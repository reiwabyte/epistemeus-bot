import { mediafireDl } from '../scrape/mediafire.js'

export default async (clients, m, { isOwner, prefix }) => {
    if (!isOwner) return

    let input = m.body.slice(m.body.indexOf(' ') + 1).trim()
    if (!input) return m.reply('Gunakan: ' + prefix + 'mediafire [url MediaFire]')

    await m.react('⏳')
    try {
        let res = await mediafireDl(input)

        let teks = ''
        teks += 'MediaFire Download\n'
        teks += 'Nama: ' + res.name + '\n'
        teks += 'Ukuran: ' + res.size + '\n'
        teks += 'Tipe: ' + res.type + '\n'
        teks += 'Link: ' + res.download

        await clients.sendMessage(m.chat, { text: teks }, { quoted: m })
        await m.react('✅')
    } catch (e) {
        await m.react('❌')
        m.reply('Gagal: ' + (e.message || 'Error'))
    }
}
