export default async (clients, m) => {
    if (pendingVerification.has(m.sender)) {
        pendingVerification.delete(m.sender)
        await m.reply('Proses formulir dibatalkan')
        logger.info(`Formulir dibatalkan untuk ${m.sender}`)
    }
}
