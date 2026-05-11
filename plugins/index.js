import selfCmd from './self.js'
import publicCmd from './public.js'
import testCmd from './test.js'
import setgroupCmd from './setgroup.js'
import delgroupCmd from './delgroup.js'
import listgroupsCmd from './listgroups.js'
import approveCmd from './approve.js'
import rejectCmd from './reject.js'
import cekpendingCmd from './cekpending.js'
import cancelCmd from './cancel.js'
import menuCmd from './menu.js'
import aiCmd from './ai.js'
import { checkMessage } from '../src/utils/moderation.js'
import warnCmd from './warn.js'
import kickCmd from './kick.js'
import banCmd from './ban.js'
import unbanCmd from './unban.js'
import warnsCmd from './warns.js'
import stealthCmd from './stealth.js'

const getPhone = (jid) => jid?.split('@')[0]

const commands = {
    self: selfCmd, public: publicCmd, test: testCmd,
    setgroup: setgroupCmd, delgroup: delgroupCmd, listgroups: listgroupsCmd,
    approve: approveCmd, reject: rejectCmd, cekpending: cekpendingCmd, cancel: cancelCmd,
    menu: menuCmd,
    warn: warnCmd, kick: kickCmd, ban: banCmd, unban: unbanCmd, warns: warnsCmd,
    stealth: stealthCmd
}

const STEP_QUESTIONS = [
    '1. Nama / Nama Panggilan / Nama Samaran:',
    '2. Umur:',
    '3. Ketertarikan intelektual utama:',
    '4. Tujuan masuk ke',
    '5. Apakah kamu siap berdiskusi secara kritis, terbuka, dan tetap menghormati sudut pandang lain?',
    '6. Menurutmu, apa itu diskusi intelektual yang sehat?',
    '7. Apakah kamu memiliki karya formal/nonformal? Jika ada, sebutkan atau kirim file/link nya.'
]

async function sendQuestion(clients, jid, step, groupName) {
    let text = STEP_QUESTIONS[step]
    if (step === 3) text += ` ${groupName}:`

    if (step === 4) {
        return clients.sendMessage(jid, {
            text,
            footer: 'Epistemeia Bot',
            interactiveButtons: [
                { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: 'Ya', id: 'step5_ya' }) },
                { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: 'Tidak', id: 'step5_tidak' }) }
            ]
        })
    }

    return clients.sendMessage(jid, {
        text,
        contextInfo: { externalAdReply: AD_REPLY }
    })
}

async function sendApprovalToOwner(clients, m, data) {
    let userInfo = m.pushName || m.sender.split('@')[0]
    let userNum = m.sender.split('@')[0]
    let label = data.isTest ? ' [UJI COBA]' : ''
    let groupName = data.isTest
        ? (data.groupJid?.endsWith('@g.us') ? (await clients.groupMetadata(data.groupJid).catch(() => null))?.subject || 'Grup' : 'Epistemeia')
        : db.groups?.find(g => g.id === data.groupJid)?.name || 'Grup'

    let formatted = data.answers.map((a, i) => {
        if (a === undefined || a === null) return ''
        let q = STEP_QUESTIONS[i]
        if (i === 3) q += ` ${groupName}:`
        return `${q}\n*${a}*`
    }).filter(Boolean).join('\n\n')

    let msgToOwner = `[Pendaftar Baru${label}]

Nama: *${userInfo}*
Nomor: *${userNum}*
Grup: *${groupName}*
Waktu: *${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}*

Jawaban:
${formatted}`

    let buttons = [
        { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: 'Terima', id: `approve_${userNum}` }) },
        { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: 'Tolak', id: `reject_${userNum}` }) }
    ]

    if (data.karyaFiles?.length) {
        msgToOwner += `\n\nKarya: ${data.karyaFiles.length} berkas`
    }

    await clients.sendMessage(m.owner, {
        text: msgToOwner,
        footer: 'Epistemeia Bot',
        contextInfo: { externalAdReply: AD_REPLY },
        interactiveButtons: buttons
    })
}

const messageHistory = {}

export default async (clients, m) => {
    try {
        let isOwner = m.owner?.includes(m.sender)
        let isGroup = m.isGroup

        let interactiveResponse = m.message?.interactiveResponseMessage?.nativeFlowResponseMessage
        let buttonParams = null
        if (interactiveResponse) {
            buttonParams = JSON.parse(interactiveResponse.paramsJson || '{}')
            let buttonId = buttonParams.id || ''

            if (buttonId.startsWith('step5_')) {
                let answer = buttonParams.display_text || 'Tidak'
                let phone = getPhone(m.sender)
                if (!pendingVerification.has(phone)) return
                let data = pendingVerification.get(phone)
                if (data.status !== 'waiting_answer' || data.step !== 4) return

                if (!data.answers) data.answers = []
                data.answers[4] = answer

                let groupName = data.isTest
                    ? (data.groupJid?.endsWith('@g.us') ? (await clients.groupMetadata(data.groupJid).catch(() => null))?.subject || 'Grup' : 'Epistemeia')
                    : db.groups?.find(g => g.id === data.groupJid)?.name || 'Grup'

                data.step = 5
                await sendQuestion(clients, m.chat, 5, groupName)
                pendingVerification.set(phone, data)
                return
            }

            if (buttonId.startsWith('approve_') || buttonId.startsWith('reject_')) {
                let isApprove = buttonId.startsWith('approve_')
                let targetNum = buttonId.replace(isApprove ? 'approve_' : 'reject_', '')
                let targetJid = targetNum + '@s.whatsapp.net'
                let data = pendingVerification.get(targetNum)

                if (!data) {
                    await clients.sendMessage(m.chat, { text: 'Tidak ada permintaan tertunda dari pengguna tersebut (mungkin sudah diproses)' })
                    return
                }
                if (isApprove && data.status !== 'waiting_approval') {
                    await clients.sendMessage(m.chat, { text: `Status pengguna: ${data.status}. Tidak bisa disetujui.` })
                    return
                }
                if (data.isTest) {
                    await clients.sendMessage(m.chat, { text: `[UJI COBA] Berhasil ${isApprove ? 'menerima' : 'menolak'} @${targetNum}`, mentions: [targetJid] })
                    pendingVerification.delete(targetNum)
                    return
                }

                await clients.groupRequestParticipantsUpdate(data.groupJid, [targetJid], isApprove ? 'approve' : 'reject')
                let gd = db.groups?.find(g => g.id === data.groupJid)
                let gName = gd?.name || 'Grup'

                if (isApprove) {
                    await clients.sendMessage(targetJid, { text: `Selamat! Permintaan kamu untuk bergabung ke grup *${gName}* telah DISETUJUI! Silakan cek grup sekarang.` })
                } else {
                    await clients.sendMessage(targetJid, { text: `Mohon maaf, permintaan kamu untuk bergabung ke grup *${gName}* telah DITOLAK.\n\nTerimakasih telah meluangkan waktu untuk mengisi formulir.` })
                }

                await clients.sendMessage(m.chat, { text: `Berhasil ${isApprove ? 'menerima' : 'menolak'} @${targetNum}`, mentions: [targetJid] })
                pendingVerification.delete(targetNum)
                logger.info(`${isApprove ? 'Menyetujui' : 'Menolak'} permintaan bergabung untuk ${targetJid} melalui tombol`)
                return
            }
        }

        let body = (m?.mtype === 'conversation' ? m?.message?.conversation
            : m?.mtype === 'imageMessage' ? m?.message?.imageMessage?.caption
            : m?.mtype === 'videoMessage' ? m?.message?.videoMessage?.caption
            : m?.mtype === 'extendedTextMessage' ? m?.message?.extendedTextMessage?.text
            : m?.mtype === 'documentMessage' ? m?.message?.documentMessage?.caption
            : interactiveResponse ? buttonParams?.display_text || buttonParams?.id || ''
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

        let phone = getPhone(m.sender)
        if (pendingVerification.has(phone)) {
            let data = pendingVerification.get(phone)
            if (cmd && commands[cmd]) {
                if (cmd === 'cancel') {
                    pendingVerification.delete(phone)
                    await m.reply('Proses formulir dibatalkan')
                    logger.info(`Formulir dibatalkan untuk ${m.sender}`)
                    return
                }
                await commands[cmd](clients, m, { body, prefix, cmd, isOwner, isGroup })
                return
            }
            if (data.status === 'waiting_karya') {
                if (isGroup && !data.isTest) return

                if (body && body.toLowerCase() === 'selesai') {
                    data.status = 'waiting_approval'
                    await sendApprovalToOwner(clients, m, data)
                    await clients.sendMessage(m.chat, {
                        text: 'Terimakasih! Jawaban dan karya kamu sudah diterima dan akan ditinjau oleh admin. Mohon tunggu ya',
                        contextInfo: { externalAdReply: AD_REPLY }
                    })
                    pendingVerification.set(phone, data)
                    logger.info(`Formulir selesai untuk ${m.sender}, diteruskan ke owner`)
                    return
                }

                if (body && /tidak\s*ada/i.test(body)) {
                    data.status = 'waiting_approval'
                    await sendApprovalToOwner(clients, m, data)
                    await clients.sendMessage(m.chat, {
                        text: 'Terimakasih! Jawaban kamu sudah diterima dan akan ditinjau oleh admin. Mohon tunggu ya',
                        contextInfo: { externalAdReply: AD_REPLY }
                    })
                    pendingVerification.set(phone, data)
                    logger.info(`Formulir selesai untuk ${m.sender}, diteruskan ke owner`)
                    return
                }

                if (!data.karyaFiles) data.karyaFiles = []

                let mediaTypes = ['imageMessage', 'videoMessage', 'documentMessage', 'audioMessage']
                if (mediaTypes.includes(m.mtype)) {
                    try {
                        let stream = await bail.downloadContentFromMessage(m.message[m.mtype], m.mtype.replace('Message', '').toLowerCase())
                        let buffer = Buffer.from([])
                        for await (let chunk of stream) buffer = Buffer.concat([buffer, chunk])
                        let fileName = m.message[m.mtype]?.fileName || 'berkas'
                        let mimetype = m.message[m.mtype]?.mimetype || 'application/octet-stream'
                        let caption = m.message[m.mtype]?.caption || ''

                        await clients.sendMessage(m.owner, {
                            [m.mtype.replace('Message', '').toLowerCase()]: buffer,
                            mimetype,
                            fileName,
                            caption: `[KARYA dari ${m.sender.split('@')[0]}] ${caption}`.trim()
                        })
                        data.karyaFiles.push({ type: m.mtype, fileName, caption, time: Date.now() })
                    } catch (e) {
                        logger.error('Gagal meneruskan karya:', e)
                    }
                } else if (body) {
                    await clients.sendMessage(m.owner, {
                        text: `[KARYA dari ${m.sender.split('@')[0]}]\n\n${body}`
                    })
                    data.karyaFiles.push({ type: 'teks', text: body, time: Date.now() })
                }

                await clients.sendMessage(m.chat, {
                    text: 'Karya diterima. Kirim lagi jika masih ada, atau ketik "selesai" jika sudah selesai.',
                    contextInfo: { externalAdReply: AD_REPLY }
                })
                pendingVerification.set(phone, data)
                return
            }

            if (data.status === 'waiting_answer') {
                if (isGroup && !data.isTest) return

                if (!data.answers) data.answers = []
                data.answers[data.step] = body

                let groupName = data.isTest
                    ? (data.groupJid?.endsWith('@g.us') ? (await clients.groupMetadata(data.groupJid).catch(() => null))?.subject || 'Grup' : 'Epistemeia')
                    : db.groups?.find(g => g.id === data.groupJid)?.name || 'Grup'

                data.step++

                if (data.step < STEP_QUESTIONS.length) {
                    await sendQuestion(clients, m.chat, data.step, groupName)
                    pendingVerification.set(phone, data)
                    return
                }

                let lastAnswer = data.answers[6] || ''
                if (!/tidak\s*ada/i.test(lastAnswer) && lastAnswer.trim()) {
                    data.status = 'waiting_karya'
                    await clients.sendMessage(m.chat, {
                        text: 'Izinkan kami melihat karya ilmiah anda. Silakan kirim berkas (foto, PDF, Word) atau tautan web.\n\nKetik "selesai" jika sudah selesai mengirim.',
                        contextInfo: { externalAdReply: AD_REPLY }
                    })
                    pendingVerification.set(phone, data)
                    return
                }

                data.status = 'waiting_approval'
                await sendApprovalToOwner(clients, m, data)
                await clients.sendMessage(m.chat, {
                    text: 'Terimakasih! Jawaban kamu sudah diterima dan akan ditinjau oleh admin. Mohon tunggu ya',
                    contextInfo: { externalAdReply: AD_REPLY }
                })
                pendingVerification.set(phone, data)
                logger.info(`Formulir selesai untuk ${m.sender}, diteruskan ke owner`)
                return
            }
            return
        }

        if (isGroup && !m.key.fromMe) {
            let isManaged = db.groups?.some(g => g.id === m.chat)
            if (isManaged) {
                let senderId = m.sender?.split('@')[0]
                let isBanned = db.banned?.includes(senderId)
                if (!isBanned) {
                    if (!messageHistory[senderId]) messageHistory[senderId] = []
                    messageHistory[senderId].push(body)
                    if (messageHistory[senderId].length > 10) messageHistory[senderId].shift()

                    let reasons = await checkMessage(body, messageHistory[senderId])
                    if (reasons) {
                        logger.info(`Moderasi: ${senderId} terdeteksi: ${reasons.join(', ')}`)
                        let warnCount = (db.warns?.[senderId] || 0) + 1
                        if (!db.warns) db.warns = {}
                        db.warns[senderId] = warnCount
                        saveDb()

                        await clients.sendMessage(m.chat, {
                            text: `@${senderId} pesan kamu mengandung: ${reasons.join(', ')}.\nPeringatan ke-${warnCount}`,
                            contextInfo: { mentionedJid: [m.sender] }
                        })

                        if (warnCount >= 3) {
                            await clients.groupParticipantsUpdate(m.chat, [m.sender], 'remove')
                            db.banned = db.banned || []
                            if (!db.banned.includes(senderId)) db.banned.push(senderId)
                            saveDb()
                            logger.info(`Diblokir ${senderId} dari ${m.chat} (3 peringatan)`)
                        }
                        if (warnCount >= 2) {
                            await clients.sendMessage(m.chat, {
                                text: `@${senderId} kamu telah mendapat 2 peringatan. 1 peringatan lagi dan kamu akan dikeluarkan dan diblokir.`,
                                contextInfo: { mentionedJid: [m.sender] }
                            })
                        }
                    }
                }
            }
        }

        if (cmd && commands[cmd]) {
            await commands[cmd](clients, m, { body, prefix, cmd, isOwner, isGroup })
            return
        }

        if (body && !isGroup) {
            await aiCmd(clients, m, body)
        }
    } catch (e) {
        console.error('Kesalahan penanganan pesan:', e)
    }
}
