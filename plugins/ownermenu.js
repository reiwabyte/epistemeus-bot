import fs from 'fs'

export default async (clients, m, { prefix }) => {
    let img
    try { img = fs.readFileSync(process.cwd() + '/media/menu.jpeg') } catch { img = null }

    let teks = ''
    teks += '*Owner Menu*\n\n'
    teks += '*Mode*\n'
    teks += '-' + prefix + 'self\n'
    teks += '-' + prefix + 'public\n\n'
    teks += '*Manajemen Grup*\n'
    teks += '-' + prefix + 'setgroup\n'
    teks += '-' + prefix + 'delgroup\n'
    teks += '-' + prefix + 'listgroups\n'
    teks += '-' + prefix + 'kick @user\n'
    teks += '-' + prefix + 'add 628xx\n'
    teks += '-' + prefix + 'promote @user\n'
    teks += '-' + prefix + 'demote @user\n'
    teks += '-' + prefix + 'group open/close\n'
    teks += '-' + prefix + 'link\n'
    teks += '-' + prefix + 'revoke\n'
    teks += '-' + prefix + 'setname [nama]\n'
    teks += '-' + prefix + 'setdesc [deskripsi]\n'
    teks += '-' + prefix + 'tagall\n'
    teks += '-' + prefix + 'hidetag [pesan]\n\n'
    teks += '*Verifikasi & Moderasi*\n'
    teks += '-' + prefix + 'approve\n'
    teks += '-' + prefix + 'reject\n'
    teks += '-' + prefix + 'cekpending\n'
    teks += '-' + prefix + 'cancel\n'
    teks += '-' + prefix + 'ban @user\n'
    teks += '-' + prefix + 'unban @user\n'
    teks += '-' + prefix + 'warns\n'
    teks += '-' + prefix + 'banlist\n'
    teks += '-' + prefix + 'approvedlist\n'
    teks += '-' + prefix + 'log\n\n'
    teks += '*Download*\n'
    teks += '-' + prefix + 'tiktok [url]\n'
    teks += '-' + prefix + 'tiktoksearch [kata kunci]\n'
    teks += '-' + prefix + 'spotify [url | judul]\n'
    teks += '-' + prefix + 'play [judul lagu]\n'
    teks += '-' + prefix + 'yt [url]\n'
    teks += '-' + prefix + 'fb [url]\n'
    teks += '-' + prefix + 'twitter [url]\n'
    teks += '-' + prefix + 'ig [url]\n'
    teks += '-' + prefix + 'mediafire [url]\n\n'
    teks += '*Tools & Utility*\n'
    teks += '-' + prefix + 'hf [pertanyaan]\n'
    teks += '-' + prefix + 'groq [pertanyaan | list | setmodel]\n'
    teks += '-' + prefix + 'binary encode/decode\n'
    teks += '-' + prefix + 'tourl (reply media)\n'
    teks += '-' + prefix + 'removebg (reply gambar)\n'
    teks += '-' + prefix + 'hd (reply video)\n'
    teks += '-' + prefix + 'lirik [judul]\n'
    teks += '-' + prefix + 'npmstalk [package]\n'
    teks += '-' + prefix + 'githubstalk [username]\n'
    teks += '-' + prefix + 'getpl [nama plugin]\n'
    teks += '-' + prefix + 'getscrape [nama scraper]'

    await clients.sendMessage(m.chat, {
        text: teks,
        contextInfo: {
            externalAdReply: {
                title: 'Epistemeus Bot',
                body: 'Owner Menu',
                mediaType: 1,
                thumbnail: img || undefined,
                showAdAttribution: false,
                renderLargerThumbnail: true
            }
        }
    })
}