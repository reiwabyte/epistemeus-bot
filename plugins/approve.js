export default async (clients, m, { isOwner, prefix }) => {
    if (!isOwner) return
    let targetJid = m.mentionedJid?.[0] || m.quoted?.sender || null
    if (!targetJid) {
        let num = m.body?.replace(/[^0-9]/g, '')
        if (num) targetJid = num + '@s.whatsapp.net'
    }
    if (!targetJid) return m.reply(`Gunakan: ${prefix}approve [nomor|@pengguna]`)

    let targetNum = targetJid.split('@')[0]
    let data = pendingVerification.get(targetNum)
    if (!data) return m.reply('Tidak ada permintaan tertunda dari pengguna tersebut')
    if (data.status !== 'waiting_approval') return m.reply(`Status pengguna: ${data.status}. Tidak bisa disetujui.`)

    if (data.isTest) {
        await m.reply(`[UJI COBA] Berhasil menyetujui @${targetNum}`, { mentions: [targetJid] })
        pendingVerification.delete(targetNum)
        return
    }

    await clients.groupRequestParticipantsUpdate(data.groupJid, [targetJid], 'approve')

    let gd = db.groups?.find(g => g.id === data.groupJid)
    let gName = gd?.name || 'Grup'

    if (!db.history) db.history = []
    db.history.push({
        number: targetNum,
        name: data.answers?.[0] || targetNum,
        group: gName,
        status: 'approved',
        time: Date.now()
    })
    saveDb()

    await clients.sendMessage(targetJid, {
        text: `Selamat! Permintaan kamu untuk bergabung ke grup *${gName}* telah DISETUJUI! Silakan cek grup sekarang.`
    })

    await m.reply(`Berhasil menyetujui permintaan bergabung dari @${targetNum}`, { mentions: [targetJid] })
    pendingVerification.delete(targetNum)
    logger.info(`Menyetujui permintaan bergabung untuk ${targetJid}`)
}
