export default async (clients, m, { isOwner, isGroup, body, prefix, cmd }) => {
    if (!isOwner) return
    let targetJid = isGroup ? m.chat : null

    if (!targetJid) {
        let args = body.slice(prefix.length + cmd.length).trim().split(/ +/)
        targetJid = args[0]
        if (!targetJid || !targetJid.endsWith('@g.us')) {
            return m.reply('Gunakan perintah ini di dalam grup yang ingin dihapus')
        }
    }

    let idx = db.groups?.findIndex(g => g.id === targetJid)
    if (idx === undefined || idx === -1) return m.reply('Grup tidak ditemukan dalam daftar')

    let name = db.groups[idx].name
    db.groups.splice(idx, 1)
    saveDb()
    await clients.sendMessage(m.chat, { text: `Grup *${name}* berhasil dihapus dari daftar.` })
    logger.info(`Grup dihapus: ${targetJid}`)
}
