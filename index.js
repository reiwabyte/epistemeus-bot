console.clear()
import './src/config.js'
import fs from 'fs'
import path from 'path'
import pino from 'pino'
import { clientsConfig, smsg, cleanupCache } from './src/utils/handler.js'
import logger from './src/utils/logger.js'
import caseHandler from './plugins/index.js'

const TMP_DIR = path.join(process.cwd(), 'tmp')
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true })

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

            if (set.self) {
                let senderPhone = (m.sender || '').split('@')[0].replace(/[^0-9]/g, '')
                let isOwner = owner.no.some(n => n.replace(/[^0-9]/g, '') === senderPhone)
                if (!isOwner && clients.decodeJid(clients.user.id) !== m.sender) return
            }
            await caseHandler(clients, m)
            const pend = global.pendingStatus?.get(m.sender)
            if (pend && Date.now() - pend.timestamp < 120000 && !m.isGroup) {
                let target = m.body
                if (!target?.includes('@g.us')) {
                    const ir = m.message?.interactiveResponseMessage?.nativeFlowResponseMessage
                    if (ir) {
                        try { target = JSON.parse(ir.paramsJson || '{}').id } catch {}
                    }
                }
                if (target?.includes('@g.us')) {
                    global.pendingStatus.delete(m.sender)
                    await clients.sendMessage(target, { groupStatusMessage: pend.content })
                    m.reply('Status diposting ke ' + target.split('@')[0])
                    for (const key of ['image', 'video', 'audio']) {
                        const url = pend.content[key]?.url
                        if (url && typeof url === 'string' && url.includes('swgc_')) {
                            import('fs/promises').then(fs => fs.unlink(url).catch(() => {}))
                        }
                    }
                }
            }
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

            let communityJid = null
            try {
                let meta = await clients.groupMetadata(groupJid)
                communityJid = meta?.linkedParent || null
            } catch {}
            communityJid = communityJid || groupData?.community || null

            if (communityJid && db.communityApproved?.[communityJid]?.includes(userNum)) {
                logger.info(`User ${userNum} already approved in community ${communityJid}, auto-approving for ${groupJid}`)
                try {
                    await clients.groupRequestParticipantsUpdate(groupJid, [userJid], 'approve')
                } catch {}
                await clients.sendMessage(userJid, { text: `Selamat datang kembali! Kamu sudah terverifikasi di komunitas ini, langsung disetujui untuk grup *${groupName}*.` })
                if (!db.history) db.history = []
                db.history.push({
                    number: userNum,
                    name: userNum,
                    group: groupName,
                    status: 'auto_approved',
                    time: Date.now()
                })
                saveDb()
                return
            }

            let isCustomMode = groupData?.mode === 2 && groupData?.questions?.length
            let isRegistered = db.history?.some(h => h.number === userNum)

            let opening
            if (isCustomMode && isRegistered) {
                opening = `Halo! Kamu sudah terdaftar di database kami, namun belum tergabung di grup *${groupName}*.\n\nMohon isi pertanyaan berikut untuk verifikasi. Ketik *lanjutkan* untuk memulai.`
            } else if (isCustomMode) {
                opening = `Halo! Untuk bergabung ke grup *${groupName}*, mohon isi pertanyaan berikut.\n\nKetik *lanjutkan* untuk memulai.`
            } else {
                opening = `Halo! Sebelumnya kami mengucapkan terimakasih telah meminta bergabung ke grup ${groupName}.\n\nKami perlu melakukan proses perkenalan singkat. Silakan baca dengan saksama, lalu ketik *lanjutkan* untuk memulai.`
            }

            await clients.sendMessage(userJid, { text: opening })
            logger.info(`Opening sent to ${userJid} for group ${groupJid}`)

            pendingVerification.set(userJid.split('@')[0], {
                groupJid,
                status: 'waiting_confirmation',
                step: 0,
                answers: [],
                timestamp: Date.now()
            })
        } catch (e) {
            console.error('Error handling join request:', e)
        }
    })

    setInterval(() => {
        cleanupCache()
        for (const [k, v] of global.pendingVerification || []) {
            if (Date.now() - v.timestamp > 300000) global.pendingVerification.delete(k)
        }
        for (const [k, v] of global.pendingStatus || []) {
            if (Date.now() - v.timestamp > 180000) global.pendingStatus.delete(k)
        }
        let mem = process.memoryUsage().rss / 1024 / 1024
        if (typeof global.gc === 'function' && mem > 350) global.gc()
        if (mem > 500) {
            logger.warn(`Memory ${mem.toFixed(0)}MB, restarting...`)
            process.exit(1)
        }
    }, 60000)

    setInterval(() => {
        fs.readdir(TMP_DIR, (err, files) => {
            if (err) return
            for (let f of files) {
                if (f === '.gitkeep') continue
                let fp = path.join(TMP_DIR, f)
                fs.rm(fp, { recursive: true, force: true }, () => {})
            }
            if (files.length > 1) logger.info(`Cleaned tmp/ (${files.length - 1} file(s) removed)`)
        })
    }, 1500000)
}

start()
