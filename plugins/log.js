export default async (clients, m, { isOwner }) => {
    if (!isOwner) return
    if (!db.history || db.history.length === 0) return m.reply('Belum ada riwayat.')

    let text = `*Riwayat Anggota* (${db.history.length})\n\n`
    let recent = db.history.slice(-20).reverse()
    for (let h of recent) {
        let icon = h.status === 'approved' ? '✅' : '❌'
        let waktu = new Date(h.time).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
        text += `${icon} ${h.name} (${h.number})\n   ${h.group} • ${waktu}\n`
    }
    m.reply(text)
}
