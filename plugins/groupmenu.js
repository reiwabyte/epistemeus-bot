import fs from 'fs'

export default async (clients, m, { prefix }) => {
    let img
    try { img = fs.readFileSync(process.cwd() + '/media/menu.jpeg') } catch { img = null }

    let teks = ''
    teks += '*Fitur Grup*\n\n'
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
    teks += '-' + prefix + 'hidetag [pesan]\n'
    teks += '-' + prefix + 'swgc (reply media/teks)'

    await clients.sendMessage(m.chat, {
        text: teks,
        contextInfo: {
            externalAdReply: {
                title: 'Epistemeus Bot',
                body: 'Fitur Grup',
                mediaType: 1,
                thumbnail: img || undefined,
                showAdAttribution: false,
                renderLargerThumbnail: true
            }
        }
    })
}