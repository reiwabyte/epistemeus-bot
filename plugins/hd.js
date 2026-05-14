import axios from 'axios'
import { hdvideo } from '../scrape/hdvid.js'

async function downloadMsg(message, messageType) {
    const stream = await bail.downloadContentFromMessage(message, messageType)
    let buffer = Buffer.from([])
    for await (let chunk of stream) buffer = Buffer.concat([buffer, chunk])
    return buffer
}

export default async (clients, m, { prefix }) => {
    let isQuoted = !!m.quoted
    let mediaType = isQuoted ? m.quoted.mtype : m.mtype

    if (mediaType !== 'videoMessage') {
        return m.reply('Reply/send video dengan caption ' + prefix + 'hd')
    }

    await m.react('⏳')
    try {
        let buffer = isQuoted
            ? await m.quoted.download()
            : await downloadMsg(m.msg, 'video')

        m.reply('Mengupload video ke server HD...')

        let url = await hdvideo(buffer)

        await m.reply('HD Video selesai!\n\nURL: ' + url)
        await m.react('✅')
    } catch (e) {
        await m.react('❌')
        m.reply('Gagal: ' + (e.message || 'Error'))
    }
}