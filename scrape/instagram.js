import axios from 'axios'
import * as cheerio from 'cheerio'
import vm from 'node:vm'

async function indown(url) {
    const { data: pageData, headers } = await axios.get('https://indown.io/en1', {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
        }
    })

    const $ = cheerio.load(pageData)
    const token = $('input[name="_token"]').val()
    const cookies = headers['set-cookie'] ? headers['set-cookie'].map(v => v.split(';')[0]).join('; ') : ''

    if (!token) throw new Error('Token Indown tidak ditemukan')

    const params = new URLSearchParams()
    params.append('referer', 'https://indown.io/en1')
    params.append('locale', 'en')
    params.append('_token', token)
    params.append('link', url)
    params.append('p', 'i')

    const { data: resultData } = await axios.post('https://indown.io/download', params, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Cookie: cookies,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
        },
        timeout: 30000
    })

    const $r = cheerio.load(resultData)
    const urls = []

    $r('video source[src], a[href].btn-outline-primary').each((_, el) => {
        let link = $r(el).attr('src') || $r(el).attr('href')
        if (link) {
            if (link.includes('indown.io/fetch')) {
                try { link = decodeURIComponent(new URL(link).searchParams.get('url')) } catch {}
            }
            if (/cdninstagram\.com|fbcdn\.net/.test(link)) {
                urls.push(link.replace(/&dl=1$/, ''))
            }
        }
    })

    return [...new Set(urls)]
}

async function snapsave(url) {
    const form = new URLSearchParams()
    form.append('url', url)

    const { data } = await axios.post('https://snapsave.app/id/action.php?lang=id', form.toString(), {
        headers: {
            origin: 'https://snapsave.app',
            referer: 'https://snapsave.app/id/download-video-instagram',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 30000
    })

    const ctx = { window: {}, document: { getElementById: () => ({ value: '' }) }, console, eval: r => r }
    vm.createContext(ctx)
    const decoded = vm.runInContext(data, ctx)
    const regex = /https:\/\/d\.rapidcdn\.app\/v2\?[^"]+/g
    const matches = decoded.match(regex)

    if (matches && matches.length > 0) {
        return [...new Set(matches.map(u => u.replace(/&amp;/g, '&')))]
    }

    return []
}

export async function igDl(url) {
    let urls = await indown(url)
    if (!urls.length) urls = await snapsave(url)
    if (!urls.length) throw new Error('Tidak ada media ditemukan')

    return { urls }
}
