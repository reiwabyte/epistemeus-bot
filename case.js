export default async (clients, m) => {
    try {
        let body = (m?.mtype === 'conversation' ? m?.message?.conversation
            : m?.mtype === 'imageMessage' ? m?.message?.imageMessage?.caption
            : m?.mtype === 'videoMessage' ? m?.message?.videoMessage?.caption
            : m?.mtype === 'extendedTextMessage' ? m?.message?.extendedTextMessage?.text
            : '') || ''

        let cmd = ''
        let prefix = ''

        if (set.prefix && Array.isArray(set.prefix)) {
            prefix = set.prefix.find(p => body.startsWith(p))
            if (prefix) {
                let sliced = body.slice(prefix.length).trim()
                cmd = sliced.split(/ +/)[0]?.toLowerCase() || ''
            }
        } else if (body) {
            cmd = body.trim().split(/ +/)[0]?.toLowerCase() || ''
        }

        let isOwner = m.owner?.includes(m.sender)

        switch (cmd) {
            case 'self': {
                if (!isOwner) return m.reply('Owner only')
                set.self = true
                await m.reply('Self mode activated')
            }
            break

            case 'public': {
                if (!isOwner) return m.reply('Owner only')
                set.self = false
                await m.reply('Public mode activated')
            }
            break
        }
    } catch (e) {
        console.error(e)
    }
}
