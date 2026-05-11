export default async (clients, m) => {
    let phone = m.sender.split('@')[0]
    if (pendingVerification.has(phone)) {
        pendingVerification.delete(phone)
        await m.reply('Proses formulir dibatalkan')
        logger.info(`Formulir dibatalkan untuk ${m.sender}`)
    }
}
