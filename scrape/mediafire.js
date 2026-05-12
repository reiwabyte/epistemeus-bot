import axios from 'axios'
import * as cheerio from 'cheerio'
import { basename, extname } from 'path'

export async function mediafireDl(url) {
    const { data: html } = await axios.get(url, { timeout: 20000 })
    const $ = cheerio.load(html)

    const title = $("meta[property='og:title']").attr("content")?.trim() || ''
    const size = html.match(/Download\s+\((.*?)\)/)?.[1] || 'Unknown'

    const $a = $("a.popsok").filter((_, el) => $(el).attr("href") === "javascript:void(0)").first()
    const b64 = $a.attr("data-scrambled-url")
    if (!b64) throw new Error('Download URL tidak ditemukan')

    const dl = Buffer.from(b64, 'base64').toString()

    return {
        name: title,
        filename: basename(dl),
        type: extname(dl),
        size,
        download: dl,
        link: url
    }
}
