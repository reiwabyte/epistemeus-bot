export default async (clients, m, { isOwner, body, prefix, cmd }) => {
    if (!isOwner) return

    let code = body.slice(prefix.length + cmd.length).trim()
    if (!code) return m.reply('Masukkan kode JavaScript.\nContoh: ' + prefix + 'eval 1 + 1')

    try {
        let result = await eval(code)
        let output = typeof result === 'string' ? result : JSON.stringify(result, null, 2)
        await m.reply('```' + output + '```')
    } catch (e) {
        await m.reply('```' + e.message + '```')
    }
}