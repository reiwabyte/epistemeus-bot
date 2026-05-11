export default async (clients, m, { isOwner, prefix }) => {
    if (!isOwner) return
    let targetJid = m.mentionedJid?.[0] || m.quoted?.sender || null
    if (!targetJid) {
        let num = m.body?.replace(/[^0-9]/g, '')
        if (num) targetJid = num + '@s.whatsapp.net'
    }
    if (!targetJid) return m.reply(`Gunakan: ${prefix}reject [nomor|@user]`)

    let data = pendingVerification.get(targetJid)
    if (!data) return m.reply('Tidak ada permintaan pending dari user tersebut')

    if (data.isTest) {
        await m.reply(`[TEST] Berhasil reject @${targetJid.split('@')[0]}`, { mentions: [targetJid] })
        pendingVerification.delete(targetJid)
        return
    }

    await clients.groupRequestParticipantsUpdate(data.groupJid, [targetJid], 'reject')

    let gd = db.groups?.find(g => g.id === data.groupJid)
    let gName = gd?.name || 'Grup'

    await clients.sendMessage(targetJid, {
        text: `Mohon maaf, permintaan kamu untuk bergabung ke grup *${gName}* telah DITOLAK.\n\nTerimakasih telah meluangkan waktu untuk mengisi interview.`
    })

    await m.reply(`Berhasil menolak join request dari @${targetJid.split('@')[0]}`, { mentions: [targetJid] })
    pendingVerification.delete(targetJid)
    logger.info(`Rejected join request for ${targetJid}`)
}
