import { askHF, askHFWithImage } from '../src/utils/huggingface.js'

async function downloadImage(clients, msg) {
    if (msg.download) return msg.download()
    let mime = msg.msg?.mimetype || msg.mimetype || 'image/jpeg'
    let msgType = mime.split('/')[0]
    let stream = await bail.downloadContentFromMessage(msg.msg || msg, msgType)
    let buffer = Buffer.from([])
    for await (let chunk of stream) buffer = Buffer.concat([buffer, chunk])
    return buffer
}

function parseTable(md) {
    let lines = md.trim().split('\n').filter(l => l.trim())
    if (lines.length < 2) return null
    let sep = lines[1]
    if (!/^[\s:|:-]+$/.test(sep)) return null
    let headers = lines[0].split('|').map(s => s.trim()).filter(Boolean)
    let rows = []
    for (let i = 2; i < lines.length; i++) {
        let cols = lines[i].split('|').map(s => s.trim()).filter(Boolean)
        if (cols.length > 0) rows.push(cols)
    }
    if (rows.length === 0) return null
    return {
        rows: [
            { items: headers, isHeading: true },
            ...rows.map(r => ({ items: r }))
        ]
    }
}

function buildSubMessages(answer) {
    let codeRegex = /```(\w*)\n([\s\S]*?)```/g
    let submessages = []
    let lastEnd = 0
    let match

    while ((match = codeRegex.exec(answer)) !== null) {
        if (match.index > lastEnd) {
            submessages.push({ messageType: 2, messageText: answer.slice(lastEnd, match.index).trim() })
        }
        let lang = match[1].toLowerCase() || 'javascript'
        let langMap = { js: 'javascript', ts: 'typescript', py: 'python', go: 'go', sh: 'bash', bash: 'bash', lua: 'lua' }
        let language = langMap[lang] || (['javascript', 'typescript', 'python', 'go', 'bash', 'lua'].includes(lang) ? lang : 'javascript')
        submessages.push({
            messageType: 5,
            codeMetadata: {
                codeLanguage: language,
                codeBlocks: [{ highlightType: 0, codeContent: match[2].trim() }]
            }
        })
        lastEnd = match.index + match[0].length
    }

    let hasCode = submessages.some(s => s.messageType === 5)

    if (!hasCode) {
        let remaining = answer.slice(lastEnd).trim()
        let tableMatch = (remaining || answer).match(/(?:\|.+\|(?:\r?\n))(?:\|[\s:|:-]+\|(?:\r?\n))(?:\|.+\|(?:\r?\n|$))+/)
        if (tableMatch) {
            let src = remaining || answer
            let table = parseTable(tableMatch[0])
            if (table) {
                let before = src.slice(0, tableMatch.index).trim()
                let after = src.slice(tableMatch.index + tableMatch[0].length).trim()
                if (before) submessages.push({ messageType: 2, messageText: before })
                submessages.push({ messageType: 4, tableMetadata: { title: '', rows: table.rows } })
                if (after) submessages.push({ messageType: 2, messageText: after })
                return submessages
            }
        }
        if (remaining) {
            submessages.push({ messageType: 2, messageText: remaining })
        }
    } else if (lastEnd < answer.length) {
        submessages.push({ messageType: 2, messageText: answer.slice(lastEnd).trim() })
    }

    if (submessages.length === 0) {
        submessages.push({ messageType: 2, messageText: answer })
    }

    return submessages
}

export default async (clients, m, { body, prefix, cmd }) => {
    let input = body.slice(prefix.length + cmd.length).trim()
    let quoted = m.quoted

    if (!input && !quoted && m.mtype !== 'imageMessage') {
        return m.reply(`Gunakan: ${prefix}hf [pertanyaan]\nAtau kirim foto dengan ${prefix}hf [pertanyaan]`)
    }

    let prompt = input || 'Analisis gambar ini'
    await m.react('⏳')

    let imageMsg = null
    if (quoted && (quoted.mtype === 'imageMessage' || quoted.mtype?.includes('image'))) {
        imageMsg = quoted
    } else if (m.mtype === 'imageMessage') {
        imageMsg = m
    }

    let result
    if (imageMsg) {
        try {
            let media = await downloadImage(clients, imageMsg)
            let mime = imageMsg.msg?.mimetype || imageMsg.mimetype || 'image/jpeg'
            result = await askHFWithImage(prompt, media, mime)
        } catch (e) {
            await m.react('❌')
            return m.reply('Gagal memproses gambar: ' + e.message)
        }
    } else {
        result = await askHF(prompt)
    }

    await m.react('✅')
    if (result.error) return m.reply('⚠️ ' + result.error)

    let answer = result.text.trim()
    if (!answer) return m.reply('Tidak ada respons dari AI.')

    let submessages = buildSubMessages(answer)

    try {
        await clients.sendRichMessage(m.chat, submessages, m)
    } catch {
        await clients.sendMessage(m.chat, { text: answer }, { quoted: m })
    }
}