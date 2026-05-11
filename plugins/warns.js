export default async (clients, m, { isOwner }) => {
    if (!isOwner) return

    let text = '*Daftar Banned & Peringatan*\n\n'

    if (db.banned?.length) {
        text += '*Banned:*\n'
        text += db.banned.map((n, i) => `${i + 1}. ${n}`).join('\n')
    } else {
        text += '*Banned:* (kosong)\n'
    }

    text += '\n\n*Peringatan:*\n'
    if (db.warns && Object.keys(db.warns).length) {
        text += Object.entries(db.warns).map(([num, count]) => `${num}: ${count}x`).join('\n')
    } else {
        text += '(kosong)'
    }

    m.reply(text)
}
