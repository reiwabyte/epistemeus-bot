import { execSync } from 'child_process'

export default async (clients, m, { isOwner, body, prefix, cmd }) => {
    if (!isOwner) return

    let command = body.slice(prefix.length + cmd.length).trim()
    if (!command) return m.reply('Masukkan perintah shell.\nContoh: ' + prefix + 'exec ls -la')

    try {
        let stdout = execSync(command, { timeout: 30000 })
        await m.reply('```' + stdout.toString().trim() + '```')
    } catch (e) {
        let err = e.stderr?.toString() || e.message
        await m.reply('```' + err.trim() + '```')
    }
}