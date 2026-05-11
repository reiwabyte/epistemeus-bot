export default async (clients, m, { isOwner }) => {
    if (!isOwner) return m.reply('Owner only')
    set.self = false
    await m.reply('Public mode activated')
}
