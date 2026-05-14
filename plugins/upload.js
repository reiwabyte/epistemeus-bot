import { uploadFile } from '../scrape/upload.js'
import fs from 'fs'
import path from 'path'

async function downloadMsg(message, messageType) {
    const stream = await bail.downloadContentFromMessage(message, messageType)
    let buffer = Buffer.from([])
    for await (let chunk of stream) buffer = Buffer.concat([buffer, chunk])
    return buffer
}

export default async (clients, m, { prefix }) => {
    let isQuoted = !!m.quoted
    let mediaType = isQuoted ? m.quoted.mtype : m.mtype

    if (!['imageMessage', 'videoMessage', 'documentMessage', 'audioMessage'].includes(mediaType)) {
        return m.reply('Reply/send media dengan caption ' + prefix + 'tourl')
    }

    await m.react('⏳')
    try {
        let buffer = isQuoted
            ? await m.quoted.download()
            : await downloadMsg(m.msg, mediaType.replace(/Message/gi, ''))

        let ext = mediaType === 'imageMessage' ? 'jpg' : mediaType === 'videoMessage' ? 'mp4' : mediaType === 'audioMessage' ? 'mp3' : 'bin'
        let tmpPath = path.join(process.cwd(), 'tmp', 'tourl_' + Date.now() + '.' + ext)

        fs.writeFileSync(tmpPath, buffer)
        let url = await uploadFile(tmpPath)
        fs.unlinkSync(tmpPath)

        await m.reply('URL: ' + url)
        await m.react('✅')
    } catch (e) {
        await m.react('❌')
        m.reply('Gagal: ' + (e.message || 'Error'))
    }
}
