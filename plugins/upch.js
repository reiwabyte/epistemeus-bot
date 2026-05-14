import { execSync, execFileSync } from 'child_process'
import { readFileSync, unlinkSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { randomBytes } from 'crypto'

export default async (clients, m, { isOwner }) => {
  if (!isOwner) return

  const ch = process.env.CHANNEL_ID
  if (!ch) return m.reply('CHANNEL_ID belum diatur. Isi di file .env')

  const q = m.quoted || m
  const mime = (q.msg || q).mimetype || ''
  if (!/audio/.test(mime)) return m.reply('Reply ke audio')

  try {
    try { execFileSync('which', ['ffmpeg']) } catch {
      return m.reply('ffmpeg tidak terinstall. Install dulu:\n• apt install ffmpeg (Debian/Ubuntu)')
    }

    const buf = await q.download()
    if (!buf) return m.reply('Gagal download audio')

    const ext = mime.split('/')[1] || 'mp3'
    const input = join(tmpdir(), `upch_${randomBytes(4).toString('hex')}.${ext}`)
    const output = join(tmpdir(), `upch_${randomBytes(4).toString('hex')}.opus`)

    writeFileSync(input, buf)
    execSync(`ffmpeg -y -i "${input}" -c:a libopus -b:a 64k -vbr on -compression_level 10 "${output}"`, { timeout: 60000 })

    const opus = readFileSync(output)
    unlinkSync(input)
    unlinkSync(output)

    const runtime = Math.floor((Date.now() - global.start) / 1000)
    const jam = Math.floor(runtime / 3600)
    const menit = Math.floor((runtime % 3600) / 60)
    const detik = runtime % 60
    const bodyText = `Runtime: ${jam}h ${menit}m ${detik}s`

    await clients.sendMessage(ch, {
      audio: opus,
      mimetype: 'audio/ogg; codecs=opus',
      ptt: true,
      contextInfo: {
        mentionedJid: [m.sender],
        isForwarded: true,
        forwardingScore: 999,
        externalAdReply: {
          title: 'Epistemeus Bot',
          body: bodyText,
          mediaType: 1,
          showAdAttribution: false
        }
      }
    })
    m.reply('Done')
  } catch (e) {
    console.error('upch error:', e)
    m.reply('Error: ' + e.message)
  }
}
