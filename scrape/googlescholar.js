import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
puppeteer.use(StealthPlugin())

let browser = null
let browserPromise = null
let gsCookies = []

function parseCookieFile(text) {
  const cookies = []
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) continue
    const parts = trimmed.split('\t')
    if (parts.length >= 7) {
      const includeSubdomains = parts[1] === 'TRUE'
      const path = parts[2] || '/'
      const secure = parts[3] === 'TRUE'
      const expiry = parseInt(parts[4], 10) || undefined
      const name = parts[5]
      const value = parts[6]
      if (name && value) {
        cookies.push({
          name, value,
          domain: parts[0],
          path,
          secure,
          httpOnly: false,
          sameSite: 'Lax',
          ...(expiry ? { expires: expiry } : {})
        })
      }
    }
  }
  return cookies
}

export function setCookies(input) {
  if (typeof input === 'string') {
    gsCookies = parseCookieFile(input)
  } else if (Array.isArray(input)) {
    gsCookies = input
  } else {
    return false
  }
  return gsCookies.length > 0
}

export function getCookieCount() {
  return gsCookies.length
}

async function getBrowser() {
  if (browser) return browser
  if (browserPromise) return browserPromise
  browserPromise = (async () => {
    try {
      browser = await puppeteer.launch({
        executablePath: '/usr/bin/google-chrome-stable',
        headless: 'new',
        args: [
          '--no-sandbox', '--disable-setuid-sandbox',
          '--disable-dev-shm-usage', '--disable-gpu',
          '--single-process'
        ]
      })
      browser.on('disconnected', () => {
        browser = null
        browserPromise = null
      })
      return browser
    } catch (e) {
      browserPromise = null
      throw e
    }
  })()
  return browserPromise
}

async function searchScholar(query, limit = 10) {
  const b = await getBrowser()
  const page = await b.newPage()

  try {
    await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36')

    if (gsCookies.length > 0) {
      await page.setCookie(...gsCookies)
    }

    const url = `https://scholar.google.com/scholar?q=${encodeURIComponent(query)}&hl=en&as_sdt=0%2C5`
    const resp = await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 })

    if (resp.status() === 429) {
      const body = await page.evaluate(() => document.body.innerText)
      throw new Error('Google Scholar blocked: ' + (body?.slice(0, 100) || '429'))
    }

    if (resp.status() === 503) {
      throw new Error('Google Scholar unavailable (503)')
    }

    const results = await page.evaluate((max) => {
      const items = document.querySelectorAll('.gs_ri')
      return Array.from(items).slice(0, max).map(el => {
        const titleEl = el.querySelector('.gs_rt')
        const authorEl = el.querySelector('.gs_a')
        const snippetEl = el.querySelector('.gs_rs')
        const linkEl = titleEl?.querySelector('a')

        const title = titleEl?.textContent?.replace(/\[PDF\]|\[BOOK\]|\[CITATION\]/gi, '').trim() || ''
        const rawAuthors = authorEl?.textContent?.trim() || ''
        const authors = rawAuthors.split('-')[0]?.trim() || rawAuthors

        let year = ''
        const yearMatch = rawAuthors.match(/\b(19\d\d|20\d\d)\b/)
        if (yearMatch) year = yearMatch[1]

        const snippet = snippetEl?.textContent?.trim() || ''
        const url = linkEl?.href || ''

        // Detect PDF from URL patterns
        let pdfUrl = ''
        if (url) {
          const urlLower = url.toLowerCase()
          if (urlLower.endsWith('.pdf') ||
              urlLower.includes('/pdf/') ||
              urlLower.includes('/download/') ||
              urlLower.includes('type=pdf') ||
              urlLower.includes('type=chapterpdf') ||
              urlLower.includes('.pdf?') ||
              urlLower.includes('pdf=true') ||
              urlLower.match(/\.pdf($|[?#])/)) {
            pdfUrl = url
          }
        }

        // Check for PDF badge (orange icon)
        if (!pdfUrl) {
          const pdfBadge = titleEl?.querySelector('.gs_ctg')?.textContent?.includes('PDF') || false
          if (pdfBadge) {
            const pdfLink = el.querySelector('.gs_or_gg a') || el.querySelector('a[href*="pdf"]')
            if (pdfLink) pdfUrl = pdfLink.href
          }
        }

        return { title, authors, year, snippet, url, pdfUrl, source: 'Google Scholar' }
      })
    }, limit)

    return results
  } finally {
    await page.close()
  }
}

export async function searchAll(query, limit = 25) {
  let results = []
  try {
    results = await searchScholar(query, limit)
  } catch (e) {
    console.error('[GoogleScholar] search error:', e.message)
    throw e
  }
  return results
}

export async function getPaper(doi) {
  const cleanDoi = doi.replace('https://doi.org/', '')
  try {
    const results = await searchScholar(cleanDoi, 5)
    return results.find(p => p.url?.includes(cleanDoi) || p.title?.toLowerCase().includes(cleanDoi.slice(-20).toLowerCase())) || results[0] || null
  } catch {
    return null
  }
}

export async function findPdfUrl(doi) {
  const cleanDoi = doi.replace('https://doi.org/', '')
  try {
    const results = await searchScholar(cleanDoi, 5)
    const match = results.find(p => p.pdfUrl) || results[0]
    return match?.pdfUrl || null
  } catch {
    return null
  }
}

let closing = false
process.on('exit', async () => {
  if (browser && !closing) {
    closing = true
    await browser.close().catch(() => {})
  }
})
process.on('SIGINT', () => process.exit())
process.on('SIGTERM', () => process.exit())
