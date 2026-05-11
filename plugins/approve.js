export default async (clients, m, { isOwner, prefix }) => {
    if (!isOwner) return
    let targetJid = m.mentionedJid?.[0] || m.quoted?.sender || null
    if (!targetJid) {
        let num = m.body?.replace(/[^0-9]/g, '')
        if (num) targetJid = num + '@s.whatsapp.net'
    }
    if (!targetJid) return m.reply(`Gunakan: ${prefix}approve [nomor|@pengguna]`)

    let data = pendingVerification.get(targetJid)
    if (!data) return m.reply('Tidak ada permintaan tertunda dari pengguna tersebut')
    if (data.status !== 'waiting_approval') return m.reply(`Status pengguna: ${data.status}. Tidak bisa disetujui.`)

    if (data.isTest) {
        await m.reply(`[UJI COBA] Berhasil menyetujui @${targetJid.split('@')[0]}`, { mentions: [targetJid] })
        pendingVerification.delete(targetJid)
        return
    }

    await clients.groupRequestParticipantsUpdate(data.groupJid, [targetJid], 'approve')

    let gd = db.groups?.find(g => g.id === data.groupJid)
    let gName = gd?.name || 'Grup'

    await clients.sendMessage(targetJid, {
        text: `Selamat! Permintaan kamu untuk bergabung ke grup *${gName}* telah DISETUJUI! Silakan cek grup sekarang.`
    })

    await m.reply(`Berhasil menyetujui permintaan bergabung dari @${targetJid.split('@')[0]}`, { mentions: [targetJid] })
    pendingVerification.delete(targetJid)
    logger.info(`Menyetujui permintaan bergabung untuk ${targetJid}`)
}
