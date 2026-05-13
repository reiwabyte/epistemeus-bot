import selfCmd from './self.js'
import publicCmd from './public.js'
import setgroupCmd from './setgroup.js'
import delgroupCmd from './delgroup.js'
import listgroupsCmd from './listgroups.js'
import approveCmd from './approve.js'
import rejectCmd from './reject.js'
import cekpendingCmd from './cekpending.js'
import cancelCmd from './cancel.js'
import menuCmd from './menu.js'
import banCmd from './ban.js'
import unbanCmd from './unban.js'
import warnsCmd from './warns.js'
import banlistCmd from './banlist.js'
import groqCmd from './groq.js'
import groupStatusCmd from './group-status.js'
import searchjurnalCmd, { paper as paperCmd, getpdf as getpdfCmd } from './searchjurnal.js'
import logCmd from './log.js'
import kickCmd from './kick.js'
import addCmd from './add.js'
import promoteCmd from './promote.js'
import demoteCmd from './demote.js'
import groupCmd from './group.js'
import linkCmd from './link.js'
import revokeCmd from './revoke.js'
import setnameCmd from './setname.js'
import setdescCmd from './setdesc.js'
import tagallCmd from './tagall.js'
import hidetagCmd from './hidetag.js'
import groupmenuCmd from './groupmenu.js'
import downloadmenuCmd from './downloadmenu.js'
import tiktokCmd from './tiktok.js'
import spotifyCmd from './spotify.js'
import playCmd from './play.js'
import mediafireCmd from './mediafire.js'
import facebookCmd from './facebook.js'
import twitterCmd from './twitter.js'
import igCmd from './ig.js'
import ytCmd from './yt.js'
import toolsmenuCmd from './toolsmenu.js'
import binaryCmd from './binary.js'
import uploadCmd from './upload.js'
import removebgCmd from './removebg.js'
import hdCmd from './hd.js'
import lirikCmd from './lirik.js'
import npmstalkCmd from './npmstalk.js'
import githubstalkCmd from './githubstalk.js'
import getplCmd from './getpl.js'
import getscrapeCmd from './getscrape.js'
import ownermenuCmd from './ownermenu.js'
import getCmd from './get.js'
import evalCmd from './eval.js'
import execCmd from './exec.js'
import approvedlistCmd from './approvedlist.js'
import { checkMessage, getWarningCount, incrementWarning, resetWarnings } from '../src/utils/moderation.js'

const getPhone = (jid) => jid?.split('@')[0]

const commands = {
    self: selfCmd, public: publicCmd,
    setgroup: setgroupCmd, delgroup: delgroupCmd, listgroups: listgroupsCmd,
    approve: approveCmd, reject: rejectCmd, cekpending: cekpendingCmd, cancel: cancelCmd,
    menu: menuCmd,
    ban: banCmd, unban: unbanCmd,
    warns: warnsCmd, banlist: banlistCmd,
    log: logCmd,
    kick: kickCmd, add: addCmd,
    promote: promoteCmd, demote: demoteCmd,
    group: groupCmd, link: linkCmd, revoke: revokeCmd,
    setname: setnameCmd, setdesc: setdescCmd,
    tagall: tagallCmd,
    hidetag: hidetagCmd,
    groupmenu: groupmenuCmd,
    swgc: groupStatusCmd, statusgroup: groupStatusCmd,
    downloadmenu: downloadmenuCmd,
    tiktok: tiktokCmd,
    spotify: spotifyCmd,
    play: playCmd,
    mediafire: mediafireCmd,
    fb: facebookCmd,
    twitter: twitterCmd,
    ig: igCmd,
    yt: ytCmd,
    toolsmenu: toolsmenuCmd,
    binary: binaryCmd,
    tourl: uploadCmd,
    removebg: removebgCmd,
    hd: hdCmd,
    lirik: lirikCmd,
    npmstalk: npmstalkCmd,
    githubstalk: githubstalkCmd,
    getpl: getplCmd,
    groq: groqCmd,
    get: getCmd,
    eval: evalCmd, exec: execCmd,
    approvedlist: approvedlistCmd,
    getscrape: getscrapeCmd,
    ownermenu: ownermenuCmd,
    searchjurnal: searchjurnalCmd,
    jurnal: searchjurnalCmd,
    paper: paperCmd,
    getpdf: getpdfCmd
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

    if (step === 4 || step === 6) {
        return clients.sendMessage(jid, { text: `${text}\n\nBalas *Ya* atau *Tidak*` })
    }

    return clients.sendMessage(jid, { text })
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
        if (i === 6 && a.toLowerCase() === 'tidak') return ''
        let q = STEP_QUESTIONS[i]
        if (i === 3) q += ` ${groupName}:`
        return `• *${q}*\n  ${a}`
    }).filter(Boolean).join('\n\n')

    let msgToOwner = `*Pendaftar Baru${label}*
• *Nama:* ${userInfo}
• *Nomor:* ${userNum}
• *Grup:* ${groupName}
• *Waktu:* ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}

*Jawaban:*
${formatted}`

    if (data.karyaFiles?.length) {
        let karyaList = data.karyaFiles.map((f, i) => {
            if (f.type === 'teks') return `  ${i + 1}. ${f.text}`
            return `  ${i + 1}. ${f.fileName || 'berkas'}${f.caption ? ` (${f.caption})` : ''}`
        }).join('\n')
        msgToOwner += `\n\n*Karya:*\n${karyaList}`
    }

    await clients.sendMessage(m.owner, { text: msgToOwner })
    await clients.sendMessage(m.owner, {
        text: 'Pilih tindakan:',
        interactiveMessage: {
            title: 'Persetujuan Anggota',
            footer: 'Epistemeia Bot',
            header: 'Konfirmasi',
            buttons: [
                {
                    name: 'single_select',
                    buttonParamsJson: JSON.stringify({
                        title: 'Tindakan',
                        sections: [
                            {
                                title: 'Pilih Tindakan',
                                rows: [
                                    { title: 'Terima', id: `approve_${userNum}`, description: 'Setujui bergabung ke grup' },
                                    { title: 'Tolak', id: `reject_${userNum}`, description: 'Tolak permintaan bergabung' }
                                ]
                            }
                        ]
                    })
                }
            ]
        }
    })
}

export default async (clients, m) => {
    try {
        let phone = (m.sender || '').split('@')[0].replace(/[^0-9]/g, '')
        let isOwner = owner.no.some(n => n.replace(/[^0-9]/g, '') === phone)
        let isGroup = m.isGroup

        let interactiveResponse = m.message?.interactiveResponseMessage?.nativeFlowResponseMessage
        let buttonParams = null
        if (interactiveResponse) {
            buttonParams = JSON.parse(interactiveResponse.paramsJson || '{}')
            let buttonId = buttonParams.id || ''

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
                    let communityJid = gd?.community || null
                    if (!communityJid) {
                        try {
                            let meta = await clients.groupMetadata(data.groupJid)
                            communityJid = meta?.linkedParent || null
                        } catch {}
                    }
                    if (communityJid) {
                        if (!db.communityApproved) db.communityApproved = {}
                        if (!db.communityApproved[communityJid]) db.communityApproved[communityJid] = []
                        if (!db.communityApproved[communityJid].includes(targetNum)) {
                            db.communityApproved[communityJid].push(targetNum)
                        }
                    }
                }

                if (!db.history) db.history = []
                db.history.push({
                    number: targetNum,
                    name: data.answers?.[0] || targetNum,
                    group: gName,
                    status: isApprove ? 'approved' : 'rejected',
                    time: Date.now()
                })
                saveDb()

                if (isApprove) {
                    await clients.sendMessage(targetJid, { text: `Selamat! Permintaan kamu untuk bergabung ke grup *${gName}* telah DISETUJUI! Sekarang kamu terverifikasi untuk semua grup yang dikelola. Silakan cek grup sekarang.` })
                } else {
                    await clients.sendMessage(targetJid, { text: `Mohon maaf, permintaan kamu untuk bergabung ke grup *${gName}* telah DITOLAK.\n\nTerimakasih telah meluangkan waktu untuk mengisi formulir.` })
                }

                await clients.sendMessage(m.chat, { text: `Berhasil ${isApprove ? 'menerima' : 'menolak'} @${targetNum}`, mentions: [targetJid] })
                pendingVerification.delete(targetNum)
                logger.info(`${isApprove ? 'Menyetujui' : 'Menolak'} permintaan bergabung untuk ${targetJid} melalui tombol`)
                return
            }

            function decodeGroupJid(encoded) {
                return encoded.replace(/_g$/, '@g.us')
            }

            if (buttonId.startsWith('setgrp_')) {
                let groupJid = decodeGroupJid(buttonId.slice(7))
                if (!db.groups) db.groups = []
                if (db.groups.some(g => g.id === groupJid)) {
                    await clients.sendMessage(m.chat, { text: 'Grup sudah terdaftar.' })
                    return
                }
                let meta = clients.chats?.[groupJid] || await clients.groupMetadata(groupJid).catch(() => null)
                let name = meta?.subject || groupJid
                let community = meta?.linkedParent || null
                db.groups.push({ id: groupJid, name, community })
                saveDb()
                await clients.sendMessage(m.chat, { text: `Grup *${name}* berhasil didaftarkan!` })
                logger.info(`Grup terdaftar dari DM: ${groupJid} (${name})`)
                return
            }

            if (buttonId.startsWith('delgrp_')) {
                let groupJid = decodeGroupJid(buttonId.slice(7))
                let idx = db.groups?.findIndex(g => g.id === groupJid)
                if (idx === undefined || idx === -1) {
                    await clients.sendMessage(m.chat, { text: 'Grup tidak ditemukan dalam daftar.' })
                    return
                }
                let name = db.groups[idx].name
                db.groups.splice(idx, 1)
                saveDb()
                await clients.sendMessage(m.chat, { text: `Grup *${name}* berhasil dihapus dari daftar.` })
                logger.info(`Grup dihapus dari DM: ${groupJid}`)
                return
            }

            if (buttonId.startsWith('.') && commands[buttonId.slice(1).split(/ +/)[0]]) {
                let cmdName = buttonId.slice(1).split(/ +/)[0]
                await commands[cmdName](clients, m, { body: buttonId, prefix: '.', cmd: cmdName, isOwner, isGroup })
                return
            }

            if (buttonId.startsWith('grp_')) {
                let groupJid = decodeGroupJid(buttonId.slice(4))
                let meta = clients.chats?.[groupJid] || await clients.groupMetadata(groupJid).catch(() => null)
                if (!meta) {
                    await clients.sendMessage(m.chat, { text: 'Grup tidak ditemukan.' })
                    return
                }
                let gName = meta.subject || groupJid
                let isManaged = db.groups?.some(g => g.id === groupJid)
                let memberCount = meta.participants?.length || '?'
                let admins = meta.participants?.filter(p => p.admin)?.length || 0
                let managed = isManaged ? 'TERDAFTAR' : 'BELUM TERDAFTAR'

                let approved = db.history?.filter(h => h.group === gName && h.status === 'approved') || []
                let rejected = db.history?.filter(h => h.group === gName && h.status === 'rejected') || []

                let info = `*${gName}*\n`
                info += `Status: ${managed}\n`
                info += `Anggota: ${memberCount} (${admins} admin)\n`
                info += `ID: ${groupJid}\n\n`
                info += `*Riwayat:*\n`
                info += `Diterima: ${approved.length}\n`
                info += `Ditolak: ${rejected.length}\n\n`
                info += `Gunakan perintah di grup untuk mengelola.`

                await clients.sendMessage(m.chat, { text: info })
                return
            }
        }

        let body = (m?.mtype === 'conversation' ? m?.message?.conversation
            : m?.mtype === 'imageMessage' ? m?.message?.imageMessage?.caption
            : m?.mtype === 'videoMessage' ? m?.message?.videoMessage?.caption
            : m?.mtype === 'extendedTextMessage' ? m?.message?.extendedTextMessage?.text
            : m?.mtype === 'documentMessage' ? m?.message?.documentMessage?.caption
            : interactiveResponse ? buttonParams?.display_text || buttonParams?.id || ''
            : m?.body || '') || ''

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

        if (isGroup && !isOwner && !m.key.fromMe && body && !cmd) {
            let isManaged = db.groups?.some(g => g.id === m.chat)
            if (isManaged) {
            let groupMeta = clients.chats[m.chat]
            let isAdmin = groupMeta?.participants?.some(p => p.id === m.sender && (p.admin === 'admin' || p.admin === 'superadmin'))
            if (!isAdmin) {
                let reasons = checkMessage(body, phone)
                if (reasons) {
                    let warnCount = incrementWarning(m.chat, phone, reasons)
                    saveDb()

                    let reasonText = reasons.map(r => `- ${r}`).join('\n')

                    if (warnCount <= 2) {
                        await clients.sendMessage(m.chat, {
                            text: `@${phone}, pesan kamu mengandung:\n${reasonText}\n\n⚠️ *PERINGATAN KE-${warnCount}*\nMohon jaga sopan santun dan etika diskusi dalam grup.\n\n*Konsekuensi:*\n• Peringatan ${warnCount}/3\n• Pelanggaran ke-3 akan berakibat *dikeluarkan* dari grup.`,
                            contextInfo: { mentionedJid: [m.sender] }
                        })
                        logger.info(`Moderasi: peringatan ke-${warnCount} untuk ${phone} di ${m.chat}: ${reasons.join(', ')}`)
                    } else if (warnCount === 3) {
                        await clients.sendMessage(m.chat, {
                            text: `@${phone}, kamu telah melanggar aturan untuk ke-3 kalinya:\n${reasonText}\n\n⛔ *KICK*: Kamu akan dikeluarkan dari grup.\n\n*Catatan:* Kamu masih bisa meminta bergabung kembali melalui *permintaan bergabung* dan mengisi formulir verifikasi ulang.`,
                            contextInfo: { mentionedJid: [m.sender] }
                        })
                        await clients.groupParticipantsUpdate(m.chat, [m.sender], 'remove')
                        logger.info(`Moderasi: mengeluarkan ${phone} dari ${m.chat} (peringatan ke-3)`)
                    } else {
                        if (!db.banned) db.banned = []
                        if (!db.banned.includes(phone)) {
                            db.banned.push(phone)
                            saveDb()
                        }
                        await clients.sendMessage(m.chat, {
                            text: `@${phone}, kamu telah melanggar aturan untuk ke-${warnCount} kalinya:\n${reasonText}\n\n🚫 *BAN PERMANEN*: Kamu telah diblokir secara permanen dari semua grup yang dikelola.\n\nKamu *tidak akan bisa* bergabung kembali ke grup ini atau grup lain yang dikelola.`,
                            contextInfo: { mentionedJid: [m.sender] }
                        })
                        await clients.groupParticipantsUpdate(m.chat, [m.sender], 'remove')
                        logger.info(`Moderasi: memblokir permanen ${phone} (peringatan ke-${warnCount})`)
                    }

                    try {
                        await clients.sendMessage(m.chat, { delete: m.key })
                    } catch (e) {
                        logger.warn(`Gagal menghapus pesan: ${e.message}`)
                    }
                    return
                }
            }
            }
        }

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
                    await clients.sendMessage(m.chat, { text: 'Terimakasih! Jawaban dan karya kamu sudah diterima dan akan ditinjau oleh admin. Mohon tunggu ya' })
                    pendingVerification.set(phone, data)
                    logger.info(`Formulir selesai untuk ${m.sender}, diteruskan ke owner`)
                    return
                }

                if (body && /tidak\s*ada/i.test(body)) {
                    data.status = 'waiting_approval'
                    await sendApprovalToOwner(clients, m, data)
                    await clients.sendMessage(m.chat, { text: 'Terimakasih! Jawaban kamu sudah diterima dan akan ditinjau oleh admin. Mohon tunggu ya' })
                    pendingVerification.set(phone, data)
                    logger.info(`Formulir selesai untuk ${m.sender}, diteruskan ke owner`)
                    return
                }

                if (!data.karyaFiles) data.karyaFiles = []

                let mediaTypes = ['imageMessage', 'videoMessage', 'documentMessage', 'audioMessage']
                if (mediaTypes.includes(m.mtype)) {
                    try {
                        let forwardContent = bail.generateForwardMessageContent(m, true)
                        await clients.sendMessage(m.owner, forwardContent)
                        let fileName = m.message[m.mtype]?.fileName || 'berkas'
                        let caption = m.message[m.mtype]?.caption || ''
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

                await clients.sendMessage(m.chat, { text: 'Karya diterima. Kirim lagi jika masih ada, atau ketik "selesai" jika sudah selesai.' })
                pendingVerification.set(phone, data)
                return
            }

            if (data.status === 'waiting_confirmation') {
                if (body && body.trim().toLowerCase() === 'lanjutkan') {
                    let groupName = data.isTest
                        ? (data.groupJid?.endsWith('@g.us') ? (await clients.groupMetadata(data.groupJid).catch(() => null))?.subject || 'Grup' : 'Epistemeia')
                        : db.groups?.find(g => g.id === data.groupJid)?.name || 'Grup'

                    data.status = 'waiting_answer'
                    await sendQuestion(clients, m.chat, 0, groupName)
                    pendingVerification.set(phone, data)
                    return
                }
                await clients.sendMessage(m.chat, { text: 'Ketik *lanjutkan* untuk memulai formulir.' })
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

                let lastQ = data.answers[6]
                if (lastQ && lastQ.toLowerCase() === 'ya') {
                    data.status = 'waiting_karya'
                    await clients.sendMessage(m.chat, { text: 'Izinkan kami melihat karya ilmiah anda. Silakan kirim berkas (foto, PDF, Word) atau tautan web.\n\nKetik *selesai* jika sudah selesai mengirim.' })
                    pendingVerification.set(phone, data)
                    return
                }

                data.status = 'waiting_approval'
                await sendApprovalToOwner(clients, m, data)
                await clients.sendMessage(m.chat, { text: 'Terimakasih! Jawaban kamu sudah diterima dan akan ditinjau oleh admin. Mohon tunggu ya' })
                logger.info(`Formulir selesai untuk ${m.sender}, diteruskan ke owner`)
                return
            }
            return
        }

        if (cmd && commands[cmd]) {
            await commands[cmd](clients, m, { body, prefix, cmd, isOwner, isGroup })
            return
        }
    } catch (e) {
        console.error('Kesalahan penanganan pesan:', e)
    }
}
