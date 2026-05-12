import fs from 'fs'
import path from 'path'

export default async (clients, m, { isOwner, prefix }) => {
    if (!isOwner) return

    let input = m.body.slice(m.body.indexOf(' ') + 1).trim()
    if (!input) {
        let files = fs.readdirSync(process.cwd() + '/plugins/').filter(f => f.endsWith('.js')).sort()
        let list = files.map((f, i) => `${i + 1}. ${f.replace('.js', '')}`).join('\n')
        return m.reply('*Daftar Plugin:*\n\n' + list + '\n\nGunakan: ' + prefix + 'getpl [nama]\nContoh: ' + prefix + 'getpl spotify')
    }

    let filePath = path.join(process.cwd(), 'plugins', input + '.js')
    if (!fs.existsSync(filePath)) return m.reply('Plugin "' + input + '.js" tidak ditemukan di folder plugins/')

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