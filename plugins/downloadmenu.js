import fs from 'fs'

export default async (clients, m, { prefix }) => {
    let img
    try { img = fs.readFileSync(process.cwd() + '/media/menu.jpeg') } catch { img = null }

    let teks = ''
    teks += '┌─ ❖ *Download Menu* ❖ ─┐\n'
    teks += '│\n'
    teks += '│ ◦ ' + prefix + 'tiktok [url]\n'
    teks += '│ ◦ ' + prefix + 'spotify [url | judul]\n'
    teks += '│ ◦ ' + prefix + 'play [judul lagu]\n'
    teks += '│\n'
    teks += '└───\n'

    await clients.sendMessage(m.chat, {
        text: teks,
        contextInfo: {
            externalAdReply: {
                title: 'Epistemeus Bot',
                body: 'Download Menu',
                mediaType: 1,
                thumbnail: img || undefined,
                showAdAttribution: false,
                renderLargerThumbnail: true
            }
        }
    })
}
