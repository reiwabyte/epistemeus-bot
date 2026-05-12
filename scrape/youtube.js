import axios from 'axios'
import https from 'https'

const agent = new https.Agent({ rejectUnauthorized: false })

async function poll(url, limit = 40) {
    for (let i = 0; i < limit; i++) {
        try {
            const { data } = await axios.get(url, { httpsAgent: agent })
            if (data.success === 1 && data.download_url) return data
            if (data.success === -1) break
        } catch {}
        await new Promise(r => setTimeout(r, 2500))
    }
    return null
}

export async function ytdlV1(url, type) {
    const endpoint = type === 'audio'
        ? `https://ytdlpyton.nvlgroup.my.id/download/audio?url=${encodeURIComponent(url)}&mode=url`
        : `https://ytdlpyton.nvlgroup.my.id/download/?url=${encodeURIComponent(url)}&resolution=${type}&mode=url`
    const { data } = await axios.get(endpoint, { timeout: 30000 })
    if (!data.download_url) throw new Error('Gagal mendapat link download')
    return { title: data.title || 'YouTube Media', download_url: data.download_url }
}

export async function ytdlV2(url, type) {
    const format = type === 'audio' ? 'mp3' : 'mp4'
    const { data } = await axios.get(`https://api.nekolabs.my.id/downloader/youtube/v1?url=${encodeURIComponent(url)}&format=${format}`, { timeout: 30000 })
    if (!data.success || !data.result) throw new Error('Gagal mendapat link download')
    return { title: data.result.title || 'YouTube Media', download_url: data.result.downloadUrl }
}

export async function ytdlV4(url, res) {
    const format = res === 'audio' ? 'mp3' : res
    const key = 'dfcb6d76f2f6a9894gjkege8a4ab232222'

    const { data: init } = await axios.get('https://p.savenow.to/ajax/download.php', {
        params: { copyright: 0, format, url, api: key },
        httpsAgent: agent,
        timeout: 15000
    })

    if (!init.success) throw new Error('Gagal init download')

    const result = await poll(init.progress_url)
    if (!result?.download_url) throw new Error('Gagal mendapat link download')

    return { title: init.info?.title || 'YouTube Media', download_url: result.download_url }
}
