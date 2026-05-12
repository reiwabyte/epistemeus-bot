export default async (clients, m, { isOwner, prefix }) => {
    if (!isOwner) return
    let targetJid = m.mentionedJid?.[0] || m.quoted?.sender || null
    if (!targetJid) {
        let num = m.body?.replace(/[^0-9]/g, '')
        if (num) targetJid = num + '@s.whatsapp.net'
    }
    if (!targetJid) return m.reply(`Gunakan: ${prefix}reject [nomor|@pengguna]`)

    let targetNum = targetJid.split('@')[0]
    let data = pendingVerification.get(targetNum)
    if (!data) return m.reply('Tidak ada permintaan tertunda dari pengguna tersebut')

    if (data.isTest) {
        await m.reply(`[UJI COBA] Berhasil menolak @${targetNum}`, { mentions: [targetJid] })
        pendingVerification.delete(targetNum)
        return
    }

    await clients.groupRequestParticipantsUpdate(data.groupJid, [targetJid], 'reject')

    let gd = db.groups?.find(g => g.id === data.groupJid)
    let gName = gd?.name || 'Grup'

    if (!db.history) db.history = []
    db.history.push({
        number: targetNum,
        name: data.answers?.[0] || targetNum,
        group: gName,
        status: 'rejected',
        time: Date.now()
    })
    saveDb()

    await clients.sendMessage(targetJid, {
        text: `Mohon maaf, permintaan kamu untuk bergabung ke grup *${gName}* telah DITOLAK.\n\nTerimakasih telah meluangkan waktu untuk mengisi formulir.`
    })

    await m.reply(`Berhasil menolak permintaan bergabung dari @${targetNum}`, { mentions: [targetJid] })
    pendingVerification.delete(targetNum)
    logger.info(`Menolak permintaan bergabung untuk ${targetJid}`)
}
