import { eBinary, dBinary } from '../scrape/binary.js'

export default async (clients, m, { prefix }) => {
    let input = m.body.slice(m.body.indexOf(' ') + 1).trim()
    if (!input) return m.reply('Gunakan: ' + prefix + 'binary encode/decode [teks]\nContoh: ' + prefix + 'binary encode hello')

    let parts = input.split(/ +/)
    let mode = parts[0]?.toLowerCase()
    let text = parts.slice(1).join(' ')

    if (!['encode', 'decode'].includes(mode) || !text) {
        return m.reply('Gunakan: ' + prefix + 'binary encode [teks] atau ' + prefix + 'binary decode [binary]')
    }

    try {
        let result = mode === 'encode' ? eBinary(text) : dBinary(text)
        await m.reply('```' + result + '```')
    } catch (e) {
        m.reply('Gagal: ' + (e.message || 'Error'))
    }
}
