export default async (clients, m, { isOwner }) => {
    if (!isOwner) return

    let text = '*Daftar Blokir dan Peringatan*\n\n'

    if (db.banned?.length) {
        text += '*Diblokir:*\n'
        text += db.banned.map((n, i) => `${i + 1}. ${n}`).join('\n')
    } else {
        text += '*Diblokir:* (kosong)\n'
    }

    text += '\n\n*Peringatan:*\n'
    if (db.warns && Object.keys(db.warns).length) {
        text += Object.entries(db.warns).map(([num, count]) => `${num}: ${count}x`).join('\n')
    } else {
        text += '(kosong)'
    }

    m.reply(text)
}
