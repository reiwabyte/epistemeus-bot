export async function downloadImage(clients, msg) {
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

function toWhatsApp(text) {
    let result = ''
    let i = 0
    while (i < text.length) {
        if (text[i] === '`' && text[i + 1] === '`' && text[i + 2] === '`') {
            let end = text.indexOf('```', i + 3)
            if (end === -1) { result += text.slice(i); break }
            result += text.slice(i, end + 3)
            i = end + 3
            continue
        }
        if (text[i] === '`') {
            let end = text.indexOf('`', i + 1)
            if (end !== -1) { result += text.slice(i, end + 1); i = end + 1; continue }
        }
        if (text[i] === '#' && (i === 0 || text[i - 1] === '\n')) {
            let end = text.indexOf('\n', i)
            let line = text.slice(i, end === -1 ? undefined : end).trim()
            let content = line.replace(/^#{1,6}\s+/, '')
            if (content) result += '*' + content + '*'
            if (end !== -1) result += '\n'
            i = end === -1 ? text.length : end + 1
            continue
        }
        if (text.slice(i, i + 3) === '***') {
            let end = text.indexOf('***', i + 3)
            if (end !== -1) {
                let inner = toWhatsApp(text.slice(i + 3, end))
                result += '_*' + inner + '*_'
                i = end + 3
                continue
            }
        }
        if (text.slice(i, i + 3) === '___') {
            let end = text.indexOf('___', i + 3)
            if (end !== -1) {
                let inner = toWhatsApp(text.slice(i + 3, end))
                result += '_' + inner + '_'
                i = end + 3
                continue
            }
        }
        if (text.slice(i, i + 2) === '**') {
            let end = text.indexOf('**', i + 2)
            if (end !== -1 && end + 2 <= text.length) {
                result += '*' + text.slice(i + 2, end) + '*'
                i = end + 2
                continue
            }
        }
        if (text.slice(i, i + 2) === '__') {
            let end = text.indexOf('__', i + 2)
            if (end !== -1 && end + 2 <= text.length) {
                result += '_' + text.slice(i + 2, end) + '_'
                i = end + 2
                continue
            }
        }
        if (text.slice(i, i + 2) === '~~') {
            let end = text.indexOf('~~', i + 2)
            if (end !== -1 && end + 2 <= text.length) {
                result += '~' + text.slice(i + 2, end) + '~'
                i = end + 2
                continue
            }
        }
        result += text[i]
        i++
    }
    return result
}

export function buildSubMessages(answer) {
    let converted = toWhatsApp(answer)
    let codeRegex = /```(\w*)\n([\s\S]*?)```/g
    let submessages = []
    let lastEnd = 0
    let match

    while ((match = codeRegex.exec(converted)) !== null) {
        if (match.index > lastEnd) {
            submessages.push({ messageType: 2, messageText: converted.slice(lastEnd, match.index).trim() })
        }
        let lang = match[1].toLowerCase() || ''
        if (!lang) lang = match[1] || ''
        let langMap = {
            js: 'javascript', ts: 'typescript', py: 'python', go: 'go', sh: 'bash', bash: 'bash',
            lua: 'lua', rb: 'ruby', rs: 'rust', java: 'java', cpp: 'cpp', c: 'c',
            cs: 'csharp', php: 'php', swift: 'swift', kt: 'kotlin', dart: 'dart',
            scala: 'scala', r: 'r', pl: 'perl', html: 'html', css: 'css',
            json: 'json', xml: 'xml', yml: 'yaml', yaml: 'yaml', sql: 'sql',
            md: 'markdown', dockerfile: 'dockerfile', makefile: 'makefile'
        }
        let language = langMap[lang] || lang || 'javascript'
        submessages.push({
            messageType: 5,
            codeMetadata: {
                codeLanguage: language,
                codeBlocks: [{ highlightType: 2, codeContent: match[2].trim() }]
            }
        })
        lastEnd = match.index + match[0].length
    }

    let hasCode = submessages.some(s => s.messageType === 5)

    if (!hasCode) {
        let remaining = converted.slice(lastEnd).trim()
        let tableMatch = (remaining || converted).match(/(?:\|.+\|(?:\r?\n))(?:\|[\s:|:-]+\|(?:\r?\n))(?:\|.+\|(?:\r?\n|$))+/)
        if (tableMatch) {
            let src = remaining || converted
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
    } else if (lastEnd < converted.length) {
        submessages.push({ messageType: 2, messageText: converted.slice(lastEnd).trim() })
    }

    if (submessages.length === 0) {
        submessages.push({ messageType: 2, messageText: converted })
    }

    return submessages
}

export async function sendRichOrPlain(clients, m, text) {
    let submessages = buildSubMessages(text)
    try {
        await clients.sendRichMessage(m.chat, submessages, m)
    } catch {
        let plain = toWhatsApp(text)
        await clients.sendMessage(m.chat, { text: plain }, { quoted: m })
    }
}