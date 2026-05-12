import axios from 'axios'

export default async (clients, m, { isOwner, body, prefix, cmd }) => {
    if (!isOwner) return

    let url = body.slice(prefix.length + cmd.length).trim()
    if (!url) return m.reply('Masukkan URL.\nContoh: ' + prefix + 'get https://google.com')
    if (!url.startsWith('http')) url = 'https://' + url

    try {
        let { data } = await axios.get(url, {
            timeout: 15000,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        })
        let html = typeof data === 'string' ? data : JSON.stringify(data, null, 2)
        let truncated = html.length > 40000 ? html.slice(0, 40000) + '\n\n... (truncated)' : html
        await m.reply(truncated)
    } catch (e) {
        await m.reply('Gagal mengambil halaman: ' + e.message)
    }
}