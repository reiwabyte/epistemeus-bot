import { GoogleGenerativeAI } from '@google/generative-ai'

let model = null

function initModel() {
    if (model) return true
    if (!process.env.GEMINI_API_KEY) return false
    try {
        let genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
        model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
        return true
    } catch {
        return false
    }
}

function cleanError(msg) {
    if (!msg) return 'Gagal terhubung ke Gemini'
    if (msg.includes('429') || msg.includes('quota') || msg.includes('Quota') || msg.includes('rate limit') || msg.includes('RESOURCE_EXHAUSTED')) {
        return 'Kuota Gemini habis. Pastikan sudah enable API di https://aistudio.google.com/apikey lalu buat API key baru.'
    }
    if (msg.includes('API_KEY_INVALID') || msg.includes('API key not valid') || msg.includes('API_KEY_NOT_FOUND')) {
        return 'API key Gemini tidak valid. Periksa .env'
    }
    let clean = msg.split('[')[0]?.trim() || msg
    if (clean.length > 120) clean = clean.slice(0, 120) + '...'
    return clean
}

export async function askGemini(text) {
    if (!initModel()) {
        return { error: 'Fitur AI nonaktif: API key Gemini tidak tersedia' }
    }
    try {
        let result = await model.generateContent(text)
        let response = result.response
        return { text: response.text(), ok: true }
    } catch (e) {
        return { error: cleanError(e.message) }
    }
}

export async function askGeminiWithImage(text, imageBuffer, mimeType) {
    if (!initModel()) {
        return { error: 'Fitur AI nonaktif: API key Gemini tidak tersedia' }
    }
    try {
        let parts = [
            { inlineData: { data: imageBuffer.toString('base64'), mimeType } }
        ]
        if (text) {
            parts.unshift({ text })
        }
        let result = await model.generateContent(parts)
        let response = result.response
        return { text: response.text(), ok: true }
    } catch (e) {
        return { error: cleanError(e.message) }
    }
}
