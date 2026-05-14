import { removeBg } from '../scrape/removebg.js'

async function downloadImg(message, messageType) {
    const stream = await bail.downloadContentFromMessage(message, messageType)
    let buffer = Buffer.from([])
    for await (let chunk of stream) buffer = Buffer.concat([buffer, chunk])
    return buffer
}

export default async (clients, m, { prefix }) => {
    let isQuoted = !!m.quoted
    let media = isQuoted ? m.quoted : m
    let mediaType = isQuoted ? m.quoted.mtype : m.mtype

    if (mediaType !== 'imageMessage') {
        return m.reply('Reply/send gambar dengan caption ' + prefix + 'removebg')
    }

    await m.react('⏳')
    try {
        let buffer = isQuoted
            ? await m.quoted.download()
            : await downloadImg(m.msg, 'image')

        let result = await removeBg(buffer)

        await clients.sendMessage(m.chat, {
            image: result,
            caption: 'Background berhasil dihapus'
        }, { quoted: m })

        await m.react('✅')
    } catch (e) {
        await m.react('❌')
        m.reply('Gagal: ' + (e.message || 'Error'))
    }
}
