import { askGroq, askGroqWithImage, listModels, getModel, setModel } from '../src/utils/groq.js'
import { downloadImage, sendRichOrPlain } from '../src/utils/richmessage.js'

export default async (clients, m, { body, prefix, cmd }) => {
    let input = body.split(/ (.+)/)[1]?.trim() || ''
    let quoted = m.quoted

    if (!input) {
        let models = await listModels()
        if (!models) return m.reply('Gagal mengambil daftar model. Cek GROQ_API_KEY.')
        let list = models.map((v, i) => `${i + 1}. ${v}`).join('\n')
        let current = getModel()
        return m.reply(`*Model Saat Ini:* ${current}\n\n*Daftar Model Groq:*\n${list}\n\nGunakan: ${prefix}groq [pertanyaan]\nGanti model: ${prefix}groq setmodel [nama]\nKirim foto: reply gambar dengan ${prefix}groq [pertanyaan]`)
    }

    if (input === 'list') {
        let models = await listModels()
        if (!models) return m.reply('Gagal mengambil daftar model.')
        let current = getModel()
        return m.reply(`*Model Saat Ini:* ${current}\n\n*Daftar Model Groq:*\n${models.map((v, i) => `${i + 1}. ${v}`).join('\n')}`)
    }

    if (input.startsWith('setmodel ')) {
        let modelName = input.slice(9).trim()
        if (!modelName) return m.reply('Masukkan nama model.\nContoh: ' + prefix + 'groq setmodel llama-3.3-70b-versatile')
        let models = await listModels()
        if (!models || !models.includes(modelName)) {
            return m.reply(`Model "${modelName}" tidak ditemukan. Gunakan ${prefix}groq list untuk melihat daftar model.`)
        }
        setModel(modelName)
        return m.reply(`Model diubah ke: ${modelName}`)
    }

    await m.react('⏳')

    let prompt = input
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
            result = await askGroqWithImage(prompt, media, mime)
        } catch (e) {
            await m.react('❌')
            return m.reply('Gagal memproses gambar: ' + e.message)
        }
    } else {
        result = await askGroq(prompt)
    }

    await m.react('✅')
    if (result.error) return m.reply('⚠️ ' + result.error)

    let answer = result.text.trim()
    if (!answer) return m.reply('Tidak ada respons dari Groq.')

    await sendRichOrPlain(clients, m, answer)
}