import { npmstalk } from '../scrape/npmstalk.js'

export default async (clients, m, { isOwner, prefix }) => {
    if (!isOwner) return

    let input = m.body.slice(m.body.indexOf(' ') + 1).trim()
    if (!input) return m.reply('Gunakan: ' + prefix + 'npmstalk [nama package]')

    await m.react('🔎')
    try {
        let res = await npmstalk(input)

        let teks = ''
        teks += 'NPM Package Info\n'
        teks += '\n'
        teks += 'Package: ' + res.name + '\n'
        teks += 'Versi Terbaru: ' + res.versionLatest + '\n'
        teks += 'Versi Pertama: ' + res.versionPublish + '\n'
        teks += 'Total Update: ' + res.versionUpdate + '\n'
        teks += 'Dependencies (terbaru): ' + res.latestDependencies + '\n'
        teks += 'Dependencies (pertama): ' + res.publishDependencies + '\n'
        teks += 'Dibuat: ' + res.publishTime + '\n'
        teks += 'Update terakhir: ' + res.latestPublishTime

        await m.reply(teks)
        await m.react('✅')
    } catch (e) {
        await m.react('❌')
        m.reply('Gagal: ' + (e.message || 'Error'))
    }
}