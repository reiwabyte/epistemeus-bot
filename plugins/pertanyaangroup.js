export default async (clients, m, { isOwner, body, prefix, cmd, isGroup }) => {
  if (!isOwner) return

  const input = body.slice(prefix.length + cmd.length).trim()

  if (!input) {
    if (isGroup) {
      return m.reply(`Gunakan: ${prefix}${cmd} pertanyaan1|pertanyaan2|pertanyaan3|...\n\nContoh: ${prefix}${cmd} Nama kamu?|Umur kamu?|Alasan masuk?`)
    }
    return m.reply(`Gunakan di grup atau: ${prefix}${cmd} <idgc>|q1|q2|...`)
  }

  let groupJid, questions

  if (isGroup) {
    groupJid = m.chat
    questions = input.split('|').map(s => s.trim()).filter(Boolean)
  } else {
    const parts = input.split('|').map(s => s.trim()).filter(Boolean)
    if (parts.length < 2) return m.reply('Format: idgc|q1|q2|...')
    let rawId = parts[0]
    groupJid = rawId.includes('@g.us') ? rawId : rawId + '@g.us'
    questions = parts.slice(1)
  }

  if (questions.length < 1) return m.reply('Minimal 1 pertanyaan')

  let groupData = db.groups?.find(g => g.id === groupJid)
  if (!groupData) return m.reply(`Grup ${groupJid} belum terdaftar. Gunakan .setgroup dulu`)

  const parsed = questions.map(q => {
    const match = q.match(/^(.+?)\((\d+)\)$/)
    if (match) return { text: match[1].trim(), type: parseInt(match[2]) }
    return { text: q, type: 1 }
  })

  groupData.questions = parsed
  groupData.mode = 2
  saveDb()

  let reply = `Pertanyaan untuk *${groupData.name}*\n`
  reply += `Jumlah: ${parsed.length}\n\n`
  parsed.forEach((q, i) => {
    const tipe = q.type === 2 ? '(Ya/Tidak)' : ''
    reply += `${i + 1}. ${q.text} ${tipe}\n`
  })
  reply += `\nMode: Kustom (2)`

  await m.reply(reply)
}
