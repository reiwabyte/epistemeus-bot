import { writeFile, unlink } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'

export default async (clients, m, { body, prefix, cmd, isOwner, isGroup }) => {
  const q = m.quoted || m
  const type = q.mtype || ''
  const mime = (q.msg || q).mimetype || ''
  const cap = (body ? body.slice(prefix.length + cmd.length).trim() : '') || q.text || ''

  let content

  try {
    if (type === 'imageMessage' || /image/i.test(mime)) {
      const buf = await q.download()
      if (!buf) throw new Error('Download failed')
      const ext = mime.split('/')[1] || 'jpg'
      const tmp = join(tmpdir(), 'swgc_' + Date.now() + '.' + ext)
      await writeFile(tmp, buf)
      content = { image: { url: tmp }, caption: cap }
    } else if (type === 'videoMessage' || /video/i.test(mime)) {
      const buf = await q.download()
      if (!buf) throw new Error('Download failed')
      const ext = mime.split('/')[1] || 'mp4'
      const tmp = join(tmpdir(), 'swgc_' + Date.now() + '.' + ext)
      await writeFile(tmp, buf)
      content = { video: { url: tmp }, caption: cap }
    } else if (type === 'audioMessage' || /audio/i.test(mime)) {
      if (cap) m.reply('Audio tidak mendukung caption')
      const buf = await q.download()
      if (!buf) throw new Error('Download failed')
      const ext = mime.split('/')[1] || 'mp3'
      const tmp = join(tmpdir(), 'swgc_' + Date.now() + '.' + ext)
      await writeFile(tmp, buf)
      content = { audio: { url: tmp }, mimetype: mime || 'audio/mpeg' }
    } else if (cap) {
      content = { text: cap }
    } else {
      throw new Error('Reply media atau kirim teks')
    }
  } catch (e) {
    return m.reply(e.message)
  }

  const tmpFiles = []
  if (content.image?.url && typeof content.image.url === 'string' && content.image.url.includes('swgc_')) tmpFiles.push(content.image.url)
  if (content.video?.url && typeof content.video.url === 'string' && content.video.url.includes('swgc_')) tmpFiles.push(content.video.url)
  if (content.audio?.url && typeof content.audio.url === 'string' && content.audio.url.includes('swgc_')) tmpFiles.push(content.audio.url)

  if (isGroup) {
    try {
      await clients.sendMessage(m.chat, { groupStatusMessage: content })
      m.reply('Status grup berhasil diposting')
    } catch (e) {
      m.reply('Gagal: ' + e.message)
    } finally {
      for (const f of tmpFiles) unlink(f).catch(() => {})
    }
    return
  }

  if (!isOwner) return m.reply('Fitur ini khusus owner saat di private chat')

  try {
    const groups = Object.entries(clients.chats || {}).filter(([id, g]) => id.endsWith('@g.us') && !g.isCommunity && !g.isCommunityAnnounce)
    if (!groups.length) return m.reply('Tidak ada grup ditemukan')

    if (groups.length === 1) {
      try {
        await clients.sendMessage(groups[0][0], { groupStatusMessage: content })
        m.reply('Diposting ke ' + (groups[0][1]?.subject || groups[0][0]))
      } finally {
        for (const f of tmpFiles) unlink(f).catch(() => {})
      }
      return
    }

    global.pendingStatus = global.pendingStatus || new Map()
    global.pendingStatus.set(m.sender, { content, timestamp: Date.now() })

    const rows = groups.map(([id, g], i) => ({
      title: (i + 1) + '. ' + (g?.subject || id.split('@')[0]),
      id
    }))

    await clients.sendMessage(m.chat, {
      interactiveMessage: {
        title: 'Pilih grup untuk status',
        footer: 'Powered by ourin-baileys',
        buttons: [{
          name: 'single_select',
          buttonParamsJson: JSON.stringify({
            title: 'Daftar Grup',
            sections: [{ title: 'Grup', rows }]
          })
        }]
      }
    })
  } catch (e) {
    m.reply('Error: ' + e.message)
  }
}

export const aliases = ['statusgroup', 'swgc']