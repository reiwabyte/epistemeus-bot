import crypto from 'crypto'
import axios from 'axios'
import yts from 'yt-search'

const client = axios.create({
    headers: {
        'content-type': 'application/json',
        origin: 'https://yt.savetube.me',
        'user-agent': 'Mozilla/5.0 (Android 15; Mobile; SM-F958; rv:130.0) Gecko/130.0 Firefox/130.0'
    }
})

const KY = 'C5D58EF67A7584E4A29F6C35BBC4EB12'

async function decrypt(enc) {
    const sr = Buffer.from(enc, 'base64')
    const ky = Buffer.from(KY, 'hex')
    const iv = sr.slice(0, 16)
    const dt = sr.slice(16)
    const dc = crypto.createDecipheriv('aes-128-cbc', ky, iv)
    const res = Buffer.concat([dc.update(dt), dc.final()])
    return JSON.parse(res.toString())
}

async function getCdn() {
    try {
        const res = await client.get('https://media.savetube.vip/api/random-cdn')
        return res.data ? res.data.cdn : null
    } catch {
        return null
    }
}

async function saveTubeDownload(url, format = 'mp3') {
    const m = url.match(/(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?(?:embed\/)?(?:v\/)?(?:shorts\/)?([a-zA-Z0-9_-]{11})/)
    const id = m?.[1]
    if (!id) throw new Error('YouTube ID tidak ditemukan')

    const cdn = await getCdn()
    if (!cdn) throw new Error('Gagal mendapat CDN')

    const info = await client.post(`https://${cdn}/v2/info`, {
        url: `https://www.youtube.com/watch?v=${id}`
    })

    const dec = await decrypt(info.data.data)

    const dl = await client.post(`https://${cdn}/download`, {
        id,
        downloadType: format === 'mp3' ? 'audio' : 'video',
        quality: format === 'mp3' ? '128' : format,
        key: dec.key
    })

    const thumbUrl = dec.thumbnail || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`

    const audioRes = await axios.get(dl.data.data.downloadUrl, { responseType: 'arraybuffer' })
    const thumbRes = await axios.get(thumbUrl, { responseType: 'arraybuffer' })

    return {
        title: dec.title || 'YouTube Audio',
        channel: dec.channelTitle || dec.author || 'Unknown',
        thumbnail: thumbRes.data,
        duration: dec.durationLabel || dec.duration || '',
        audioBuffer: Buffer.from(audioRes.data),
        url: `https://youtu.be/${id}`
    }
}

export async function playAudio(query) {
    const search = await yts(query)
    const video = search.videos.find(v => v.seconds < 900)
    if (!video) throw new Error('Video tidak ditemukan (durasi > 15 menit)')
    return saveTubeDownload(video.url, 'mp3')
}
