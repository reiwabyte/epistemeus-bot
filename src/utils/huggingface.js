import axios from 'axios'

const HF_TOKEN = process.env.HF_TOKEN || ''
const BASE = 'https://router.huggingface.co/v1'

const MODELS = {
    text: 'Qwen/Qwen2.5-72B-Instruct',
    vision: 'Qwen/Qwen3.6-35B-A3B'
}

function cleanError(msg) {
    if (!msg) return 'Gagal terhubung ke Hugging Face'
    if (msg.includes('402') || msg.includes('payment') || msg.includes('quota') || msg.includes('insufficient_quota')) {
        return 'Kuota Hugging Face habis. Dapatkan token gratis di https://huggingface.co/settings/tokens'
    }
    if (msg.includes('401') || msg.includes('unauthorized') || msg.includes('token')) {
        return 'Token Hugging Face tidak valid. Set HF_TOKEN di .env'
    }
    let clean = msg.split('[')[0]?.trim() || msg
    if (clean.length > 120) clean = clean.slice(0, 120) + '...'
    return clean
}

export function hfAvailable() {
    return !!HF_TOKEN
}

export async function askHF(text) {
    try {
        const { data } = await axios.post(`${BASE}/chat/completions`, {
            model: MODELS.text,
            messages: [{ role: 'user', content: text }],
            max_tokens: 2048
        }, {
            headers: {
                'Authorization': `Bearer ${HF_TOKEN}`,
                'Content-Type': 'application/json'
            },
            timeout: 60000
        })
        return { text: data.choices[0].message.content, ok: true }
    } catch (e) {
        return { error: cleanError(e.response?.data?.error?.message || e.message) }
    }
}

export async function askHFWithImage(text, imageBuffer, mimeType) {
    try {
        const base64 = imageBuffer.toString('base64')
        const content = [
            { type: 'text', text }
        ]
        if (mimeType.startsWith('image/')) {
            content.push({
                type: 'image_url',
                image_url: { url: `data:${mimeType};base64,${base64}` }
            })
        }

        const { data } = await axios.post(`${BASE}/chat/completions`, {
            model: MODELS.vision,
            messages: [{ role: 'user', content }],
            max_tokens: 2048
        }, {
            headers: {
                'Authorization': `Bearer ${HF_TOKEN}`,
                'Content-Type': 'application/json'
            },
            timeout: 120000
        })
        return { text: data.choices[0].message.content, ok: true }
    } catch (e) {
        return { error: cleanError(e.response?.data?.error?.message || e.message) }
    }
}