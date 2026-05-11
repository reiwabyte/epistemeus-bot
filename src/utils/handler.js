const groupMetaCache = new Map()
const CACHE_TTL = 10 * 60 * 1000
const STALE_TTL = 30 * 60 * 1000

function getCached(jid) {
    const entry = groupMetaCache.get(jid)
    if (!entry) return undefined
    const age = Date.now() - entry.ts
    if (age < CACHE_TTL) return entry.data
    if (age < STALE_TTL) return entry.data
    return undefined
}

function setCached(jid, data) {
    groupMetaCache.set(jid, { data, ts: Date.now() })
}

function updateParticipantsCache(id, participants, action) {
    const cached = groupMetaCache.get(id)
    if (!cached?.data?.participants) return false

    switch (action) {
        case 'add':
            for (const p of participants) {
                if (!cached.data.participants.some(x => x.id === p)) {
                    cached.data.participants.push({ id: p })
                }
            }
            break
        case 'remove':
            cached.data.participants = cached.data.participants.filter(x => !participants.includes(x.id))
            break
        case 'promote':
            for (const p of participants) {
                const m = cached.data.participants.find(x => x.id === p)
                if (m) m.admin = 'admin'
            }
            break
        case 'demote':
            for (const p of participants) {
                const m = cached.data.participants.find(x => x.id === p)
                if (m) m.admin = null
            }
            break
    }
    cached.ts = Date.now()
    return true
}

function updateMetadataCache(id, updates) {
    const cached = groupMetaCache.get(id)
    if (!cached?.data) return false
    Object.assign(cached.data, updates)
    cached.ts = Date.now()
    return true
}

export async function clientsConfig(opts) {
    let clients = bail.makeWASocket({
        ...opts,
        cachedGroupMetadata: getCached
    })

    clients.chats = {}

    clients.decodeJid = (jid) => {
        if (!jid) return jid
        if (/:\d+@/gi.test(jid)) {
            let decode = bail.jidDecode(jid) || {}
            return decode.user && decode.server ? decode.user + '@' + decode.server : jid
        }
        return jid
    }

    clients.getJid = (jid) => {
        if (!jid) return jid
        if (!jid.endsWith('@lid')) return jid
        for (let chat of Object.values(clients.chats)) {
            if (!chat?.participants) continue
            let user = chat.participants.find(p => p.lid === jid || p.id === jid)
            if (user) return user.phoneNumber || user.id
        }
        return jid
    }

    clients.ev.on('group-participants.update', async ({ id, participants, action }) => {
        if (!id || id === 'status@broadcast') return
        const updated = updateParticipantsCache(id, participants, action)
        if (updated) {
            clients.chats[id] = groupMetaCache.get(id).data
        } else {
            try {
                let data = await clients.groupMetadata(id)
                setCached(id, data)
                clients.chats[id] = data
            } catch {}
        }
    })

    clients.ev.on('groups.update', async (updates) => {
        for (let u of updates) {
            if (!u.id || u.id === 'status@broadcast' || !u.id.endsWith('@g.us')) continue
            const updated = updateMetadataCache(u.id, u)
            if (updated) {
                clients.chats[u.id] = groupMetaCache.get(u.id).data
            } else {
                try {
                    let data = await clients.groupMetadata(u.id)
                    setCached(u.id, data)
                    clients.chats[u.id] = data
                } catch {}
            }
        }
    })

    Object.defineProperty(clients, 'name', { value: 'WASocket', configurable: true })
    return clients
}

export async function smsg(clients, m) {
    if (!m) return m
    let M = bail.proto.WebMessageInfo

    if (m.key) {
        m.id = m.key.id
        m.from = m.key.remoteJid.startsWith('status') ? bail.jidNormalizedUser(m.key?.participant || m.participant) : bail.jidNormalizedUser(m.key.remoteJid)
        m.isBaileys = m.id?.startsWith('3EB0')
        m.chat = m.key?.remoteJidAlt || m.key?.remoteJid
        m.owner = bail.jidNormalizedUser(owner.no[0] + '@s.whatsapp.net')
        m.fromMe = m.key.fromMe
        m.isGroup = m.chat?.endsWith('@g.us')

        if (m.isGroup) {
            let raw = m.key.participantAlt || m.key.participantPn || m.key.participant
            if (raw && raw.endsWith('@lid') && m.key.participant && !m.key.participant.endsWith('@lid')) raw = m.key.participant
            if (raw && !raw.includes('@')) raw += '@s.whatsapp.net'
            if (raw && raw.endsWith('@lid')) {
                let resolved = clients.getJid(raw)
                m.sender = (resolved && resolved !== raw) ? resolved : raw
            } else {
                m.sender = raw ? bail.jidNormalizedUser(raw) : m.chat
            }
        } else {
            m.sender = m.chat
        }
    }

    if (m.message) {
        let cht = clients.chats[m.key.remoteJid] || {}
        let parti = (cht?.participants || []).reduce((acc, p) => { acc[p.id] = p.phoneNumber; return acc }, {})

        m.mtype = bail.getContentType(m.message)
        m.msg = m.mtype == 'viewOnceMessage' ? m.message[m.mtype].message[bail.getContentType(m.message[m.mtype].message)] : m.message[m.mtype]

        m.body = m.message.conversation || m.msg?.text || m?.text

        m.mentionedJid = m.isGroup ? (m.msg?.contextInfo?.mentionedJid || []).map(id => parti[id] || id).filter(Boolean) : []

        let quoted = m.quoted = m.msg?.contextInfo?.quotedMessage || null

        if (m.quoted) {
            let type = bail.getContentType(quoted)
            m.quoted = m.quoted[type]
            if (['productMessage'].includes(type)) {
                type = bail.getContentType(m.quoted)
                m.quoted = m.quoted[type]
            }
            if (typeof m.quoted === 'string') m.quoted = { text: m.quoted }

            if (m && m.quoted) {
                m.quoted.key = {
                    remoteJid: m.msg?.contextInfo?.remoteJid || m.from,
                    participant: bail.jidNormalizedUser(m.msg?.contextInfo?.participant),
                    fromMe: bail.areJidsSameUser(bail.jidNormalizedUser(m.msg?.contextInfo?.participant), bail.jidNormalizedUser(clients?.user?.id)),
                    id: m.msg?.contextInfo?.stanzaId
                }
                m.quoted.mtype = type
                if (m.quoted.key) {
                    m.quoted.from = /g\.us|status/.test(m.msg?.contextInfo?.remoteJid) ? m.quoted.key.participant : m.quoted.key.remoteJid
                    m.quoted.id = m.msg?.contextInfo?.stanzaId
                    m.quoted.chat = m.msg?.contextInfo?.remoteJid || m.chat
                    if (m.quoted.id) m.quoted.isBaileys = m.quoted.id.startsWith('3EB0')
                    m.quoted.sender = clients.decodeJid(m.msg?.contextInfo?.participant)
                    m.quoted.fromMe = m.quoted.sender === clients.user?.id
                    m.quoted.text = m.quoted.text || m.quoted.caption || m.quoted.conversation || m.quoted.contentText || m.quoted.selectedDisplayText || m.quoted.title || ''
                    m.quoted.mentionedJid = m.msg?.contextInfo?.mentionedJid || []
                    m.quoted.fakeObj = M.fromObject({
                        key: { remoteJid: m.quoted.chat, fromMe: m.quoted.fromMe, id: m.quoted.id },
                        message: quoted,
                        ...(m.isGroup ? { participant: m.quoted.sender } : {})
                    })
                    m.quoted.download = () => downloadMediaMessage(m.quoted)
                }
            }
        }
    }

    m.reply = async (text, options = {}) => {
        if (typeof text !== 'string') text = String(text || '')
        return clients.sendMessage(m.chat, {
            text,
            mentions: [m.sender, m?.quoted?.sender || ''],
            contextInfo: { mentionedJid: [m.sender, m?.quoted?.sender || ''], forwardingScore: 999, isForwarded: true },
            ...options
        }, { quoted: m, ...options })
    }

    m.copy = () => smsg(clients, M.fromObject(M.toObject(m)))
    m.react = (e, key = m.key) => clients.sendMessage(m.chat, { react: { text: e, key } })

    return m
}

async function downloadMediaMessage(message) {
    let mime = (message.msg || message).mimetype || ''
    let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
    const stream = await bail.downloadContentFromMessage(message, messageType)
    let buffer = Buffer.from([])
    for await (let chunk of stream) buffer = Buffer.concat([buffer, chunk])
    return buffer
}
