import { askHF, askHFWithImage } from '../src/utils/huggingface.js'
import { downloadImage, sendRichOrPlain } from '../src/utils/richmessage.js'

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

    await sendRichOrPlain(clients, m, answer)
}