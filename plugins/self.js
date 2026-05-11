export default async (clients, m, { isOwner }) => {
    if (!isOwner) return m.reply('Owner only')
    set.self = true
    await m.reply('Self mode activated')
}
