export default async (clients, m, { isOwner }) => {
    if (!isOwner) return
    let list = []
    for (let [phone, data] of pendingVerification) {
        let gd = db.groups?.find(g => g.id === data.groupJid)
        let gName = gd?.name || data.groupJid
        if (data.isTest) gName += ' [UJI COBA]'
        let stepInfo = data.status === 'waiting_answer' ? `(langkah ${data.step + 1}/6)` : data.status === 'waiting_karya' ? '(menunggu karya)' : '(menunggu persetujuan)'
        list.push(`${phone} - ${gName} ${stepInfo}`)
    }
    if (list.length === 0) return m.reply('Tidak ada proses formulir yang tertunda')
    m.reply(`Tertunda (${list.length})\n\n${list.join('\n')}`)
}
