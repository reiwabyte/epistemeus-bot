export default async (clients, m) => {
  const q = m.quoted
  if (!q) return m.reply('Reply to a message with media')

  const inner = q.message ? q.message[bail.getContentType(q.message)] : q
  const media = inner || q
  const mime = media.mimetype || ''

  let type
  if (mime.startsWith('image/')) type = 'image'
  else if (mime.startsWith('video/')) type = 'video'
  else if (mime.startsWith('audio/')) type = 'audio'
  else return m.reply('Supported media not found')

  try {
    const buf = await q.download()
    if (!buf) return m.reply('Download failed')

    const cap = media.caption || q.text || ''

    await clients.sendMessage(m.chat, {
      [type]: buf,
      mimetype: mime,
      caption: cap
    }, { quoted: m })
  } catch (e) {
    m.reply('Error: ' + e.message)
  }
}
