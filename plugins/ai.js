import { askGemini, askGeminiWithImage } from '../src/utils/gemini.js'

async function downloadImage(clients, msg) {
    if (msg.download) return msg.download()
    let mime = msg.msg?.mimetype || msg.mimetype || 'image/jpeg'
    let msgType = mime.split('/')[0]
    let stream = await bail.downloadContentFromMessage(msg.msg || msg, msgType)
    let buffer = Buffer.from([])
    for await (let chunk of stream) buffer = Buffer.concat([buffer, chunk])
    return buffer
}

function sendAsText(clients, jid, answer, m) {
    return clients.sendMessage(jid, {
        text: answer,
        contextInfo: {
            externalAdReply: {
                title: '🤖 Epistemeia AI',
                body: `Google Gemini • ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`,
                showAdAttribution: false,
                mediaType: 1,
                mediaUrl: '',
                sourceUrl: ''
            },
            mentionedJid: [m.sender]
        }
    }, { quoted: m })
}

function parseTable(md) {
    let lines = md.trim().split('\n').filter(l => l.trim())
    if (lines.length < 2) return null
    let headers = lines[0].split('|').map(s => s.trim()).filter(Boolean)
    let sep = lines[1]
    if (!/^[\s:|:-]+$/.test(sep)) return null
    let rows = []
    for (let i = 2; i < lines.length; i++) {
        let cols = lines[i].split('|').map(s => s.trim()).filter(Boolean)
        if (cols.length > 0) rows.push(cols)
    }
    if (rows.length === 0) return null
    return { headers, rows }
}

function detectContent(answer) {
    let codeRegex = /```(\w*)\n([\s\S]*?)```/g
    let match
    let codeBlocks = []
    let lastEnd = 0
    let parts = []

    while ((match = codeRegex.exec(answer)) !== null) {
        if (match.index > lastEnd) {
            parts.push({ type: 'text', text: answer.slice(lastEnd, match.index).trim() })
        }
        let lang = match[1].toLowerCase() || 'javascript'
        let langMap = { js: 'javascript', ts: 'typescript', py: 'python', go: 'go', sh: 'bash', bash: 'bash', lua: 'lua', rs: 'javascript', rb: 'javascript', java: 'javascript', cpp: 'javascript', c: 'javascript', cs: 'javascript', swift: 'javascript', kotlin: 'javascript', php: 'javascript', pl: 'javascript' }
        let detected = langMap[lang] || (['javascript', 'typescript', 'python', 'go', 'bash', 'lua'].includes(lang) ? lang : 'javascript')
        codeBlocks.push({ language: detected, code: match[2].trim(), codeIndex: match.index })
        parts.push({ type: 'code', language: detected, code: match[2].trim() })
        lastEnd = match.index + match[0].length
    }

    if (lastEnd < answer.length) {
        parts.push({ type: 'text', text: answer.slice(lastEnd).trim() })
    }

    if (codeBlocks.length > 0) return { type: 'mixed', parts, codeBlocks, hasCode: true }

    let tableMatch = answer.match(/(?:\|.+\|(?:\r?\n))(?:\|[\s:|:-]+\|(?:\r?\n))(?:\|.+\|(?:\r?\n|$))+/)
    if (tableMatch) {
        let table = parseTable(tableMatch[0])
        if (table) {
            return { type: 'table', table, tableStr: tableMatch[0], before: answer.slice(0, tableMatch.index).trim(), after: answer.slice(tableMatch.index + tableMatch[0].length).trim() }
        }
    }

    return { type: 'text', text: answer }
}

export default async (clients, m, { body, prefix, cmd }) => {
    let input = body.slice(prefix.length + cmd.length).trim()
    let quoted = m.quoted

    if (!input && !quoted && m.mtype !== 'imageMessage') {
        return m.reply(`Gunakan: ${prefix}ai [pertanyaan]\nAtau kirim foto dengan ${prefix}ai [pertanyaan]`)
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
            result = await askGeminiWithImage(prompt, media, mime)
        } catch (e) {
            await m.react('❌')
            return m.reply('Gagal memproses gambar: ' + e.message)
        }
    } else {
        result = await askGemini(prompt)
    }

    await m.react('✅')
    if (result.error) return m.reply('⚠️ ' + result.error)

    let answer = result.text.trim()
    if (!answer) return m.reply('Tidak ada respons dari AI.')

    let content = detectContent(answer)
    let adFooter = `Google Gemini • ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`

    if (content.type === 'text') {
        return sendAsText(clients, m.chat, answer, m)
    }

    if (content.type === 'table' && content.table) {
        let t = content.table
        let headerRow = t.headers.join(' | ')
        let dataRows = t.rows.map(r => r.join(' | ')).join(';;')
        try {
            await clients.sendTableV2(m.chat, ['', headerRow, dataRows], m, {
                headerText: content.before || '',
                text: '',
                footer: adFooter
            })
        } catch {
            let md = '| ' + t.headers.join(' | ') + ' |\n'
            md += '|' + t.headers.map(() => '---').join('|') + '|\n'
            for (let row of t.rows) md += '| ' + row.join(' | ') + ' |\n'
            if (content.before) md = content.before + '\n\n' + md
            if (content.after) md += '\n\n' + content.after
            await sendAsText(clients, m.chat, md, m)
        }
        if (content.after) await sendAsText(clients, m.chat, content.after, m)
        return
    }

    let textBefore = ''
    let codeBlock = null
    let textAfter = ''

    for (let part of content.parts || []) {
        if (part.type === 'code' && !codeBlock) {
            codeBlock = part
        } else if (part.type === 'code' && codeBlock) {
            textAfter += '\n```' + part.language + '\n' + part.code + '\n```\n'
        } else if (!codeBlock) {
            textBefore += (textBefore ? '\n\n' : '') + part.text
        } else {
            textAfter += (textAfter ? '\n\n' : '') + part.text
        }
    }

    if (codeBlock) {
        let title = `💻 ${codeBlock.language.charAt(0).toUpperCase() + codeBlock.language.slice(1)}`
        let bodyText = textBefore || ''
        if (textAfter) bodyText += (bodyText ? '\n\n' : '') + textAfter
        try {
            await clients.sendCodeBlockV2(m.chat, codeBlock.code, m, {
                language: codeBlock.language,
                title,
                text: bodyText,
                footer: adFooter
            })
        } catch {
            let md = ''
            if (textBefore) md += textBefore + '\n\n'
            md += '```' + codeBlock.language + '\n' + codeBlock.code + '\n```'
            if (textAfter) md += '\n\n' + textAfter
            await sendAsText(clients, m.chat, md, m)
        }
        return
    }

    return sendAsText(clients, m.chat, answer, m)
}
