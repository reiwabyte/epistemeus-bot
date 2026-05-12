export default async (clients, m, { isOwner, isGroup }) => {
    if (!isGroup) return m.reply('Perintah ini hanya untuk grup.')
    if (!isOwner) return m.reply('Hanya owner yang bisa menggunakan ini.')

    let body = m.body || ''
    let input = body.slice(body.indexOf(' ') + 1).trim()
    if (!input) return m.reply('Masukkan nomor anggota.\nContoh: .add 628xxx')

    let nums = input.split(',').map(v => v.trim().replace(/[^0-9]/g, ''))
    let jids = nums.map(n => n + '@s.whatsapp.net')

    try {
        let res = await clients.groupParticipantsUpdate(m.chat, jids, 'add')
        let teks = res.map((r, i) => {
            let status = r.status === '200' ? 'Berhasil' : 'Gagal'
            return nums[i] + ' : ' + status
        }).join('\n')
        await m.reply('Hasil undangan:\n' + teks)
    } catch (e) {
        m.reply('Gagal: ' + (e.message || 'Error'))
    }
}
