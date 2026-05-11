export default async (clients, m) => {
    if (pendingVerification.has(m.sender)) {
        pendingVerification.delete(m.sender)
        await m.reply('Proses dibatalkan')
        logger.info(`Interview cancelled for ${m.sender}`)
    }
}
