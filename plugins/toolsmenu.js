import fs from 'fs'

export default async (clients, m, { prefix }) => {
    let img
    try { img = fs.readFileSync(process.cwd() + '/media/menu.jpeg') } catch { img = null }

    let teks = ''
    teks += '┌─ ❖ *Tools Menu* ❖ ─┐\n'
    teks += '│\n'
    teks += '│ ◦ ' + prefix + 'binary encode [teks]\n'
    teks += '│ ◦ ' + prefix + 'binary decode [binary]\n'
    teks += '│ ◦ ' + prefix + 'tourl (reply/kirim media)\n'
    teks += '│ ◦ ' + prefix + 'removebg (reply gambar)\n'
    teks += '│ ◦ ' + prefix + 'hd (reply video) — upscale 2K\n'
    teks += '│ ◦ ' + prefix + 'lirik [judul lagu]\n'
    teks += '│ ◦ ' + prefix + 'npmstalk [package]\n'
    teks += '│ ◦ ' + prefix + 'githubstalk [username]\n'
    teks += '│ ◦ ' + prefix + 'getpl [nama plugin]\n'
    teks += '│ ◦ ' + prefix + 'getscrape [nama scraper]\n'
    teks += '│\n'
    teks += '└───\n'

    await clients.sendMessage(m.chat, {
        text: teks,
        contextInfo: {
            externalAdReply: {
                title: 'Epistemeus Bot',
                body: 'Tools Menu',
                mediaType: 1,
                thumbnail: img || undefined,
                showAdAttribution: false,
                renderLargerThumbnail: true
            }
        }
    })
}
