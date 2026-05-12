import fs from 'fs'
import path from 'path'

export default async (clients, m, { isOwner, prefix }) => {
    if (!isOwner) return

    let input = m.body.split(/ (.+)/)[1]?.trim() || ''
    if (!input) {
        let files = fs.readdirSync(process.cwd() + '/scrape/').filter(f => f.endsWith('.js')).sort()
        let list = files.map((f, i) => `${i + 1}. ${f.replace('.js', '')}`).join('\n')
        return m.reply('*Daftar Scraper:*\n\n' + list + '\n\nGunakan: ' + prefix + 'getscrape [nama]\nContoh: ' + prefix + 'getscrape spotify')
    }

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