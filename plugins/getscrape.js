import fs from 'fs'
import path from 'path'

export default async (clients, m, { isOwner, prefix }) => {
    if (!isOwner) return

    let input = m.body.slice(m.body.indexOf(' ') + 1).trim()
    if (!input) return m.reply('Gunakan: ' + prefix + 'getscrape [nama scraper]\nContoh: ' + prefix + 'getscrape spotify')

    let filePath = path.join(process.cwd(), 'scrape', input + '.js')
    if (!fs.existsSync(filePath)) return m.reply('Scraper "' + input + '.js" tidak ditemukan di folder scrape/')

    let code = fs.readFileSync(filePath, 'utf-8')

    try {
        await clients.sendRichMessage(m.chat, [{
            messageType: 5,
            codeMetadata: {
                codeLanguage: 'javascript',
                codeBlocks: [{ highlightType: 0, codeContent: code }]
            }
        }], m)
    } catch {
        await m.reply('```' + code + '```')
    }
}