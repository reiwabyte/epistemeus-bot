import { getWarningCount } from '../src/utils/moderation.js'

export default async (clients, m, { isOwner, isGroup, prefix }) => {
    if (!isOwner) return

    if (!db.warnings || typeof db.warnings !== 'object' || Object.keys(db.warnings).length === 0) {
        return m.reply('Belum ada data peringatan.')
    }

    let target = m.mentionedJid?.[0] || m.quoted?.sender || null
    let targetNum = target ? target.split('@')[0] : null

    if (targetNum) {
        let result = `*Peringatan untuk ${targetNum}*\n\n`
        let anyData = false
        for (let [gid, users] of Object.entries(db.warnings)) {
            if (users[targetNum]) {
                let gName = db.groups?.find(g => g.id === gid)?.name || gid
                result += `• *${gName}*: ${users[targetNum].count}x\n`
                let reasons = users[targetNum].reasons?.slice(-5).join(', ')
                if (reasons) result += `  Alasan: ${reasons}\n`
                anyData = true
            }
        }
        if (!anyData) return m.reply(`${targetNum} tidak memiliki peringatan.`)
        return m.reply(result)
    }

    let text = '*Laporan Peringatan Semua Grup*\n\n'
    for (let [gid, users] of Object.entries(db.warnings)) {
        let gName = db.groups?.find(g => g.id === gid)?.name || gid
        let userList = Object.entries(users)
            .filter(([_, v]) => v.count > 0)
            .sort(([_, a], [__, b]) => b.count - a.count)

        if (userList.length === 0) continue
        text += `📋 *${gName}*\n`
        userList.forEach(([num, data]) => {
            text += `  ${num}: ${data.count}x peringatan\n`
        })
        text += '\n'
    }

    let totalBanned = db.banned?.length || 0
    text += '\n*Total terblokir:* ' + totalBanned
    m.reply(text)
}
