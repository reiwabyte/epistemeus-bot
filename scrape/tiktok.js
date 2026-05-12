import axios from 'axios'
import * as cheerio from 'cheerio'

function formatNumber(integer) {
    let numb = parseInt(integer)
    return Number(numb).toLocaleString().replace(/,/g, '.')
}

function formatDate(n, locale = 'id') {
    let d = new Date(Number(n) * 1000)
    return d.toLocaleDateString(locale, {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        hour: 'numeric', minute: 'numeric', second: 'numeric'
    })
}

async function expandUrl(u) {
    if (!/https?:\/\/(vt|vm)\.tiktok\.com\//i.test(u)) return u
    const r = await axios.get(u, {
        maxRedirects: 10, timeout: 20000,
        headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36', 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' },
        validateStatus: s => s >= 200 && s < 400
    })
    return r?.request?.res?.responseUrl || u
}

async function tikwmFetch(form, attempt = 1) {
    try {
        const r = await axios.post('https://www.tikwm.com/api/', form.toString(), {
            timeout: 45000,
            headers: {
                'Accept': 'application/json, text/javascript, */*; q=0.01',
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Origin': 'https://www.tikwm.com',
                'Referer': 'https://www.tikwm.com/',
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
                'X-Requested-With': 'XMLHttpRequest'
            },
            validateStatus: () => true
        })
        if (r.status >= 500) throw new Error('Request failed with status code ' + r.status)
        return r.data
    } catch (e) {
        const msg = String(e && e.message ? e.message : e)
        const retriable = msg.includes('timeout') || msg.includes('ECONNRESET') || msg.includes('ETIMEDOUT') || msg.includes('EAI_AGAIN') || msg.includes('502') || msg.includes('503') || msg.includes('504')
        if (attempt < 6 && retriable) {
            await new Promise(res => setTimeout(res, 700 * attempt + Math.floor(Math.random() * 600)))
            return tikwmFetch(form, attempt + 1)
        }
        throw e
    }
}

async function scrapeTikwm(url) {
    const expanded = await expandUrl(url)
    const form = new URLSearchParams({ url: expanded, count: 12, cursor: 0, web: 1, hd: 1 })
    let payload
    try { payload = await tikwmFetch(form) } catch { payload = null }
    let res = payload && payload.data ? payload.data : null
    if (!res) return null

    let data = []
    if (res?.duration == 0) {
        res.images.map(v => data.push({ type: 'photo', url: v }))
    } else {
        data.push({ type: 'watermark', url: res?.wmplay ? 'https://www.tikwm.com' + res.wmplay : null })
        data.push({ type: 'nowatermark', url: res?.play ? 'https://www.tikwm.com' + res.play : null })
        data.push({ type: 'nowatermark_hd', url: res?.hdplay ? 'https://www.tikwm.com' + res.hdplay : null })
    }

    return {
        title: res.title,
        taken_at: formatDate(res.create_time),
        region: res.region,
        id: res.id,
        duration: res.duration + ' Seconds',
        cover: res.cover ? 'https://www.tikwm.com' + res.cover : null,
        data: data.filter(v => v.url),
        music_info: {
            title: res.music_info?.title,
            author: res.music_info?.author,
            url: res.music ? 'https://www.tikwm.com' + res.music : res.music_info?.play
        },
        stats: {
            views: formatNumber(res.play_count),
            likes: formatNumber(res.digg_count),
            comment: formatNumber(res.comment_count),
            share: formatNumber(res.share_count)
        },
        author: {
            id: res.author?.id,
            nickname: res.author?.nickname,
            avatar: res.author?.avatar ? 'https://www.tikwm.com' + res.author.avatar : null
        }
    }
}

async function scrapeSavetik(url) {
    try {
        const body = new URLSearchParams({ q: url, cursor: '0', page: '0', lang: 'id' }).toString()
        const r = await axios.post('https://savetik.io/api/ajaxSearch', body, {
            timeout: 45000,
            headers: {
                'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'x-requested-with': 'XMLHttpRequest',
                'user-agent': 'Mozilla/5.0 (Linux; Android 10)',
                'origin': 'https://savetik.io',
                'referer': 'https://savetik.io/id/download-tiktok-photos',
                'accept': '*/*'
            }
        })
        const html = typeof r.data.data === 'string' ? r.data.data : null
        if (!html) return null
        const $ = cheerio.load(html)
        const mp4 = $('a:contains("Unduh MP4 [1]")').attr('href') || $('a:contains("Unduh MP4 [2]")').attr('href') || $('a:contains("Unduh MP4 HD")').attr('href') || null
        const mp3 = $('a:contains("Unduh MP3")').attr('href') || null
        const images = []
        $('.photo-list ul.download-box li').each((_, el) => {
            const img = $(el).find('a[title="Unduh Gambar"]').attr('href')
            if (img) images.push(img)
        })
        return {
            title: $('h3').first().text().trim() || '',
            data: images.length > 0 ? images.map(v => ({ type: 'photo', url: v })) : [{ type: 'nowatermark', url: mp4 }].filter(v => v.url),
            music_info: mp3 ? { url: mp3 } : null,
            author: { nickname: '' },
            stats: { views: '0', likes: '0', comment: '0', share: '0' }
        }
    } catch { return null }
}

export async function tiktokDl(url) {
    let res = await scrapeTikwm(url)
    if (res) return res
    res = await scrapeSavetik(url)
    if (res) return res
    return null
}
