export default async (clients, m, { isOwner, prefix }) => {
    if (!isOwner) return
    let targetJid = m.mentionedJid?.[0] || m.quoted?.sender || null
    if (!targetJid) {
        let num = m.body?.replace(/[^0-9]/g, '')
        if (num) targetJid = num + '@s.whatsapp.net'
    }
    if (!targetJid) return m.reply(`Gunakan: ${prefix}approve [nomor|@user]`)

    let data = pendingVerification.get(targetJid)
    if (!data) return m.reply('Tidak ada permintaan pending dari user tersebut')
    if (data.status !== 'waiting_approval') return m.reply(`Status user: ${data.status}. Tidak bisa di-approve.`)

    if (data.isTest) {
        await m.reply(`[TEST] Berhasil approve @${targetJid.split('@')[0]}`, { mentions: [targetJid] })
        pendingVerification.delete(targetJid)
        return
    }

    await clients.groupRequestParticipantsUpdate(data.groupJid, [targetJid], 'approve')

    let gd = db.groups?.find(g => g.id === data.groupJid)
    let gName = gd?.name || 'Grup'

    await clients.sendMessage(targetJid, {
        text: `Selamat! Permintaan kamu untuk bergabung ke grup *${gName}* telah DISETUJUI! Silakan cek grup sekarang.`
    })

    await m.reply(`Berhasil menyetujui join request dari @${targetJid.split('@')[0]}`, { mentions: [targetJid] })
    pendingVerification.delete(targetJid)
    logger.info(`Approved join request for ${targetJid}`)
}
