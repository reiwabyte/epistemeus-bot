export default async (clients, m, { isOwner, isGroup }) => {
    if (!isGroup) return m.reply('Perintah ini hanya untuk grup.')
    if (!isOwner) return m.reply('Hanya owner yang bisa menggunakan ini.')

    let body = m.body || ''
    let input = body.slice(body.indexOf(' ') + 1).trim().toLowerCase()
    if (!input || (input !== 'open' && input !== 'close')) return m.reply('Gunakan: .group open atau .group close')

    let setting = input === 'open' ? 'unlocked' : 'locked'
    await clients.groupSettingUpdate(m.chat, setting)
    await m.reply('Grup berhasil di-' + (input === 'open' ? 'buka.' : 'tutup.'))
}
