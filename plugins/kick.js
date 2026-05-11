export default async (clients, m, { isOwner, isGroup, prefix }) => {
    if (!isOwner) return
    if (!isGroup) return m.reply('Perintah ini hanya bisa digunakan di grup')

    let target = m.mentionedJid?.[0] || m.quoted?.sender
    if (!target) return m.reply(`Gunakan: ${prefix}kick @user`)

    await clients.groupParticipantsUpdate(m.chat, [target], 'remove')
    await m.reply(`Berhasil mengeluarkan @${target.split('@')[0]}`, { contextInfo: { mentionedJid: [target] } })
    logger.info(`Kicked ${target} from ${m.chat}`)
}
