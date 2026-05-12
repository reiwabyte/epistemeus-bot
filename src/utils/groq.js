import axios from 'axios'

const API_KEY = process.env.GROQ_API_KEY || ''
const BASE = 'https://api.groq.com/openai/v1'

const HEADERS = {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
}

const DEFAULT_MODEL = 'llama-3.3-70b-versatile'
const VISION_MODELS = ['llama-3.2-11b-vision-preview', 'llama-3.2-90b-vision-preview']

let currentModel = DEFAULT_MODEL

export function getModel() { return currentModel }
export function setModel(name) { currentModel = name }

export function groqAvailable() {
    return !!API_KEY
}

export async function listModels() {
    try {
        const { data } = await axios.get(`${BASE}/models`, { headers: HEADERS, timeout: 10000 })
        return data.data
            .filter(m => m.id && m.active)
            .map(m => m.id)
            .sort()
    } catch {
        return null
    }
}

function isVisionModel(model) {
    return VISION_MODELS.some(v => model.includes(v)) || model.includes('vision')
}

export async function askGroq(text, model) {
    let m = model || currentModel
    try {
        const { data } = await axios.post(`${BASE}/chat/completions`, {
            model: m,
            messages: [{ role: 'user', content: text }],
            max_tokens: 4096
        }, { headers: HEADERS, timeout: 60000 })
        return { text: data.choices[0].message.content, ok: true }
    } catch (e) {
        let msg = e.response?.data?.error?.message || e.message
        if (msg.includes('401') || msg.includes('unauthorized')) msg = 'Token Groq tidak valid. Cek GROQ_API_KEY di .env'
        return { error: msg }
    }
}

export async function askGroqWithImage(text, imageBuffer, mimeType, model) {
    let m = model || currentModel
    if (!isVisionModel(m)) {
        let fallback = VISION_MODELS[0]
        m = fallback
    }
    try {
        const base64 = imageBuffer.toString('base64')
        const content = [{ type: 'text', text }]
        if (mimeType.startsWith('image/')) {
            content.push({
                type: 'image_url',
                image_url: { url: `data:${mimeType};base64,${base64}` }
            })
        }

        const { data } = await axios.post(`${BASE}/chat/completions`, {
            model: m,
            messages: [{ role: 'user', content }],
            max_tokens: 4096
        }, { headers: HEADERS, timeout: 120000 })
        return { text: data.choices[0].message.content, ok: true }
    } catch (e) {
        let msg = e.response?.data?.error?.message || e.message
        return { error: msg }
    }
}