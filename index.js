console.clear()
import 'dotenv/config'
import './src/config.js'
import pino from 'pino'
import { clientsConfig, smsg } from './src/utils/handler.js'
import logger from './src/utils/logger.js'
import caseHandler from './plugins/index.js'

async function start() {
    let { state, saveCreds } = await bail.useMultiFileAuthState(pair.sesi)
    global.clients = await clientsConfig({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: !pair.isPair,
        browser: ['Linux', 'Chrome', ''],
        auth: {
            creds: state.creds,
            keys: bail.makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
        },
        generateHighQualityLinkPreview: true,
        shouldIgnoreJid: (jid) => jid.endsWith('@newsletter') || jid.includes('broadcast')
    })

    if (pair.isPair && !clients.authState.creds.registered) {
        let ph = pair.no.replace(/[^0-9]/g, '')
        await bail.delay(3000)
        let code = await clients.requestPairingCode(ph, 'AAAAAAAA')
        code = code?.match(/.{1,4}/g)?.join('-') || code
        logger.info('Pairing code:', code)
    }

    clients.ev.on('messages.upsert', async chatUpdate => {
        try {
            let mek = chatUpdate.messages[0]
            if (!mek.message) return
            if (mek.key.fromMe && mek.key.id?.startsWith('3EB0')) return

            global.m = await smsg(clients, mek)

            if (set.self && ![m.owner, clients.decodeJid(clients.user.id)].includes(m.sender)) return
            await caseHandler(clients, m)
            logger.print(m)
        } catch (err) {
            console.error(err)
        }
    })

    clients.ev.on('connection.update', async update => {
        let { connection, lastDisconnect } = update
        if (connection === 'close') {
            let reason = lastDisconnect?.error?.output?.statusCode
            logger.warn('Connection closed:', reason)
            if (reason !== bail.DisconnectReason.loggedOut) {
                logger.info('Restarting...')
                setTimeout(start, 5000)
            } else {
                logger.error('Logged out, please pair again.')
            }
        } else if (connection === 'open') {
            logger.info('Connected')
            let gcny = (await clients.groupFetchAllParticipating().catch(() => ({}))) || {}
            for (let id in gcny) clients.chats[id] = gcny[id]
        } else if (connection === 'connecting') {
            logger.info('Connecting...')
        }
    })

    clients.ev.on('creds.update', saveCreds)

    clients.ev.on('group.join-request', async (data) => {
        try {
            let { id: rawGroupJid, participant: requesterLid, participantPn, action, method } = data
            if (!rawGroupJid) return
            if (action === 'revoked' || action === 'rejected') return

            logger.info(`Join request event: group=${rawGroupJid} action=${action} method=${method} lid=${requesterLid} pn=${participantPn}`)

            let groupJid = bail.jidNormalizedUser(rawGroupJid)
            let isManaged = db.groups?.some(g => bail.jidNormalizedUser(g.id) === groupJid)
            if (!isManaged) {
                logger.info(`Group ${groupJid} not in managed list, skipping`)
                return
            }

            let userJid = participantPn
            if (userJid && !userJid.includes('@')) userJid += '@s.whatsapp.net'
            if (!userJid && requesterLid) {
                userJid = clients.getJid(requesterLid)
                if (!userJid || userJid === requesterLid) {
                    logger.warn(`Cannot resolve user JID from LID: ${requesterLid}`)
                    return
                }
            }
            if (!userJid) {
                logger.warn('No user JID available for join request')
                return
            }
            userJid = bail.jidNormalizedUser(userJid)

            let userNum = userJid.split('@')[0]
            if (db.banned?.includes(userNum)) {
                logger.info(`Banned user ${userNum} tried to join ${groupJid}, rejecting`)
                await clients.groupRequestParticipantsUpdate(groupJid, [userJid], 'reject')
                return
            }

            let groupData = db.groups.find(g => bail.jidNormalizedUser(g.id) === groupJid)
            let groupName = groupData?.name || 'Grup'

            let opening = `Halo! Sebelumnya kami mengucapkan terimakasih telah meminta bergabung ke grup ${groupName}.

Kami perlu melakukan proses perkenalan singkat. Silakan jawab pertanyaan berikut satu per satu.

1. Nama / Nama Panggilan / Nama Samaran:`

            await clients.sendMessage(userJid, {
                text: opening,
                contextInfo: { externalAdReply: AD_REPLY }
            })
            logger.info(`Step 1 sent to ${userJid} for group ${groupJid}`)

            pendingVerification.set(userJid.split('@')[0], {
                groupJid,
                status: 'waiting_answer',
                step: 0,
                answers: [],
                timestamp: Date.now()
            })
        } catch (e) {
            console.error('Error handling join request:', e)
        }
    })

    setInterval(() => {
        let mem = process.memoryUsage().rss / 1024 / 1024
        if (mem > 250) {
            logger.warn(`Memory ${mem.toFixed(0)}MB, restarting...`)
            process.exit(1)
        }
    }, 60000)
}

start()
