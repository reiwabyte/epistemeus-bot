import { githubstalk } from '../scrape/githubstalk.js'

export default async (clients, m, { isOwner, prefix }) => {
    if (!isOwner) return

    let input = m.body.slice(m.body.indexOf(' ') + 1).trim()
    if (!input) return m.reply('Gunakan: ' + prefix + 'githubstalk [username]')

    await m.react('🔎')
    try {
        let res = await githubstalk(input)

        let teks = ''
        teks += 'GitHub Stalk\n'
        teks += '\n'
        teks += 'Username: ' + res.username + '\n'
        teks += 'Nama: ' + (res.nickname || '-') + '\n'
        teks += 'Bio: ' + (res.bio || '-') + '\n'
        teks += 'URL: ' + res.url + '\n'
        teks += 'Tipe: ' + res.type + '\n'
        teks += 'Company: ' + (res.company || '-') + '\n'
        teks += 'Lokasi: ' + (res.location || '-') + '\n'
        teks += 'Email: ' + (res.email || '-') + '\n'
        teks += 'Public Repo: ' + res.public_repo + '\n'
        teks += 'Public Gists: ' + res.public_gists + '\n'
        teks += 'Followers: ' + res.followers + '\n'
        teks += 'Following: ' + res.following + '\n'
        teks += 'Dibuat: ' + res.created_at + '\n'
        teks += 'Update: ' + res.updated_at

        await clients.sendMessage(m.chat, {
            image: { url: res.profile_pic },
            caption: teks
        }, { quoted: m })

        await m.react('✅')
    } catch (e) {
        await m.react('❌')
        m.reply('Gagal: ' + (e.message || 'Error'))
    }
}