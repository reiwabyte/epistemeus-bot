import { GoogleGenerativeAI } from '@google/generative-ai'

let genAI = null
let lastAsk = {}

if (geminiKey) {
    genAI = new GoogleGenerativeAI(geminiKey)
}

export default async (clients, m, text) => {
    if (!genAI || !text || text.length < 3) return false
    if (text.startsWith(set.prefix[0])) return false

    let now = Date.now()
    let userId = m.sender
    if (lastAsk[userId] && now - lastAsk[userId] < 3000) return false
    lastAsk[userId] = now

    try {
        let model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
        let prompt = `Kamu adalah asisten AI yang membantu menjawab pertanyaan. Jawab dengan singkat, padat, dan jelas dalam Bahasa Indonesia. Konteks: ini adalah grup diskusi ilmiah.`
        if (m.isGroup) {
            let meta = await clients.groupMetadata(m.chat).catch(() => null)
            if (meta?.subject) prompt += `\nGrup: ${meta.subject}`
        }
        prompt += `\n\nPertanyaan: ${text}`

        let result = await model.generateContent(prompt)
        let response = result.response.text()

        if (response.length > 4000) response = response.slice(0, 4000) + '...'

        await clients.sendMessage(m.chat, {
            text: response,
            contextInfo: { externalAdReply: AD_REPLY }
        })
        return true
    } catch (e) {
        logger.error('Gemini error:', e.message)
        return false
    }
}
