export default async (clients, m, { isOwner }) => {
    if (!isOwner) return
    let list = []
    for (let [jid, data] of pendingVerification) {
        let gd = db.groups?.find(g => g.id === data.groupJid)
        let gName = gd?.name || data.groupJid
        if (data.isTest) gName += ' [TEST]'
        let stepInfo = data.status === 'waiting_answer' ? `(step ${data.step + 1}/6)` : '(menunggu approve)'
        list.push(`${jid.split('@')[0]} - ${gName} ${stepInfo}`)
    }
    if (list.length === 0) return m.reply('Tidak ada pending verification')
    m.reply(`Pending (${list.length})\n\n${list.join('\n')}`)
}
