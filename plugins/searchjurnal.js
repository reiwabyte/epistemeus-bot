import { searchAll, getPaper, findPdf } from '../scrape/unified.js'
import axios from 'axios'
import * as cheerio from 'cheerio'
import { execSync } from 'child_process'
import path from 'path'
import { tmpdir } from 'os'
import { writeFileSync, unlinkSync, mkdtempSync, readFileSync } from 'fs'

export default async (clients, m, { prefix, cmd, body }) => {
  let query = body.slice(prefix.length + cmd.length).trim()
  if (!query) return m.reply(`Gunakan: ${prefix}jurnal [kata kunci]`)

  await m.react('⏳')
  let papers
  try {
    papers = await searchAll(query, 25)
  } catch (e) {
    await m.react('❌')
    return m.reply('Gagal mencari: ' + e.message)
  }

  if (!papers.length) {
    await m.react('❌')
    return m.reply('Tidak ada hasil untuk: ' + query)
  }

  await m.react('✅')

  const maxShow = Math.min(papers.length, 100)
  const shown = papers.slice(0, maxShow)
  const rows = shown.map((p, i) => ({
    title: `${i + 1}. ${(p.title || '').slice(0, 55)}${p.title?.length > 55 ? '...' : ''}`,
    description: `[${p.source}] ${(p.authors?.[0] || '?')} (${p.year || '?'})${p.pdfUrl ? ' [PDF]' : ''}`,
    id: `${prefix}paper ${p.doi || i}`
  }))

  const footerText = `${shown.length} paper dari ${papers.length > maxShow ? papers.length + ' hasil' : shown.length + ' sumber'}`
  await clients.sendMessage(m.chat, {
    interactiveMessage: {
      title: `Hasil: ${query}`,
      footer: footerText,
      buttons: [{
        name: 'single_select',
        buttonParamsJson: JSON.stringify({
          title: 'Pilih paper',
          sections: [{
            title: `12 sumber: CrossRef, OpenAlex, Semantic Scholar, Europe PMC, PubMed, arXiv, Zenodo, SciELO, DOAJ, BASE, CORE, HAL`,
            rows
          }]
        })
      }]
    },
    contextInfo: {
      externalAdReply: {
          title: 'Cari paper dari 12 sumber',
          body: `${papers.length} hasil dari CrossRef, OpenAlex, Semantic Scholar, Europe PMC, PubMed, arXiv, Zenodo, SciELO, DOAJ, BASE, CORE, HAL`,
          mediaType: 1,
          showAdAttribution: false,
          renderLargerThumbnail: false
      }
    }
  })
}

export async function paper(clients, m, { prefix, cmd, body }) {
  const doi = body.slice(prefix.length + cmd.length).trim()
  if (!doi) return m.reply(`Gunakan: ${prefix}paper [doi]`)

  await m.react('⏳')
  let data
  try {
    data = await getPaper(doi)
  } catch (e) {
    await m.react('❌')
    return m.reply('Gagal mengambil detail: ' + e.message)
  }

  if (!data) {
    await m.react('❌')
    return m.reply('Paper tidak ditemukan')
  }

  await m.react('✅')

  const authorText = data.authors?.length ? data.authors.join(', ') : 'Unknown'
  let info = `📄 *${data.title}*\n\n`
  info += `📚 *Sumber:* ${data.source || 'CrossRef'}\n`
  info += `✍️ *Penulis:* ${authorText}\n`
  if (data.year) info += `📅 *Tahun:* ${data.year}\n`
  if (data.publisher) info += `🏛️ *Publikasi:* ${data.publisher}\n`
  if (data.type) info += `📋 *Tipe:* ${data.type}\n`
  if (data.doi) info += `🔗 *DOI:* ${data.doi}\n`
  if (data.pdfUrl) info += `📎 *PDF:* Tersedia\n\n`
  else info += '\n'
  if (data.abstract) {
    const abs = data.abstract.length > 300 ? data.abstract.slice(0, 300) + '...' : data.abstract
    info += `📝 *Abstrak:*\n${abs}\n\n`
  }
  info += `🔗 ${data.url}`

  const buttons = []
  if (!data.pdfUrl) {
    buttons.push({
      name: 'quick_reply',
      buttonParamsJson: JSON.stringify({ display_text: 'Scrape & Buat PDF', id: `${prefix}getpdf ${data.doi}` })
    })
  }
  buttons.push({
    name: 'cta_url',
    buttonParamsJson: JSON.stringify({ display_text: 'Buka URL', url: data.url })
  })

  await clients.sendMessage(m.chat, {
    interactiveMessage: {
      title: info,
      footer: `Source: ${data.source}`,
      buttons
    },
    contextInfo: {
      mentionedJid: [m.sender],
      forwardingScore: 999,
      isForwarded: true,
      externalAdReply: {
        title: data.title.slice(0, 50) + (data.title.length > 50 ? '...' : ''),
        body: authorText.slice(0, 60),
        mediaType: 1,
        thumbnail: null,
        sourceUrl: data.url,
        showAdAttribution: false
      }
    }
  }, { quoted: m })

  // Auto-send PDF if available (no download button needed)
  if (data.pdfUrl) {
    const fname = `paper_${doi.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
    try {
      await clients.sendMessage(m.chat, {
        document: { url: data.pdfUrl },
        mimetype: 'application/pdf',
        fileName: fname
      }, { quoted: m })
    } catch (e) {
      console.error('auto PDF URL send failed:', e.message)
      const dl = await tryDownloadPdf(data.pdfUrl)
      if (dl) {
        try {
          await clients.sendMessage(m.chat, {
            document: Buffer.from(dl.data),
            mimetype: 'application/pdf',
            fileName: fname
          }, { quoted: m })
        } catch {}
      }
    }
  }
}

async function tryDownloadPdf(url, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 30000,
        headers: { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36' },
        maxRedirects: 5
      })
      const ct = res.headers['content-type'] || ''
      if (ct.includes('application/pdf') || Buffer.from(res.data).slice(0, 5).toString() === '%PDF-') {
        return { data: res.data, url }
      }
    } catch {}
  }
  return null
}

async function scrapePdfFromHtml(pageUrl) {
  try {
    const html = (await axios.get(pageUrl, {
      timeout: 15000,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    })).data

    const patterns = [
      /href=["']([^"']*\.pdf[^"']*)["']/i,
      /href=["']([^"']*(?:download|pdf)[^"']*)["'][^>]*>.*?(?:pdf|download)/is,
      /(?:download|pdf).*?href=["']([^"']*)["']/i,
      /<a[^>]*class=["'][^"']*pdf[^"']*["'][^>]*href=["']([^"']*)["']/i
    ]

    for (const pat of patterns) {
      const m = html.match(pat)
      if (m) {
        let found = m[1].trim()
        if (found.startsWith('//')) found = 'https:' + found
        else if (found.startsWith('/')) found = new URL(found, pageUrl).href
        else if (!found.startsWith('http')) found = new URL(found, pageUrl).href
        const result = await tryDownloadPdf(found)
        if (result) return result
      }
    }

    const metaTag = html.match(/<meta[^>]+citation_pdf_url[^>]+content=["']([^"']*)["']/i)
    if (metaTag) {
      const result = await tryDownloadPdf(metaTag[1])
      if (result) return result
    }
  } catch {}
  return null
}

async function extractToPdf(doi) {
  const cleanDoi = doi.replace('https://doi.org/', '')
  const url = `https://doi.org/${cleanDoi}`

  try {
    const paper = await getPaper(cleanDoi)
    if (!paper || !paper.title || paper.title === 'No title') return null

    const abstract = paper.abstract || ''
    const authors = (paper.authors || []).join(', ')
    const source = paper.source || 'CrossRef'
    const title = paper.title

    const tmpDir = mkdtempSync(path.join(tmpdir(), 'pdf-'))
    const outputPath = path.join(tmpDir, 'article.pdf')
    const inputPath = path.join(tmpDir, 'input.json')

    const pythonDir = new URL('../scrape/', import.meta.url).pathname
    const scriptPath = path.join(pythonDir, 'makepdf.py')

    writeFileSync(inputPath, JSON.stringify({
      title,
      authors,
      source,
      doi: cleanDoi,
      abstract: abstract.slice(0, 5000),
      text_pages: [],
      output: outputPath
    }))

    execSync(`python3 ${scriptPath} < ${inputPath}`, {
      timeout: 15000,
      stdio: ['pipe', 'ignore', 'pipe']
    })

    const buffer = readFileSync(outputPath)
    try {
      unlinkSync(outputPath)
      unlinkSync(tmpDir)
    } catch {}
    return buffer
  } catch {
    return null
  }
}

async function scrapeArticleToPdf(doi) {
  const cleanDoi = doi.replace('https://doi.org/', '')
  const url = `https://doi.org/${cleanDoi}`

  try {
    const res = await axios.get(url, {
      timeout: 20000,
      headers: { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36' },
      maxRedirects: 5
    })

    const $ = cheerio.load(res.data)

    let title = $('meta[name="citation_title"]').attr('content')
      || $('meta[name="DC.Title"]').attr('content')
      || $('h1').first().text().trim()
      || 'No title'

    let authors = []
    $('meta[name="citation_author"]').each((i, el) => {
      const a = $(el).attr('content')
      if (a) authors.push(a.trim())
    })
    if (!authors.length) {
      $('meta[name="DC.Creator"]').each((i, el) => {
        const a = $(el).attr('content')
        if (a) authors.push(a.trim())
      })
    }
    if (!authors.length) {
      const t = $('.author-name, .authors, [class*="author"]').first().text().trim()
      if (t) authors = t.split(/[,;]/).map(s => s.trim()).filter(Boolean)
    }

    let abstract = $('meta[name="citation_abstract"]').attr('content')
      || $('meta[name="DC.Description"]').attr('content')
      || $('.abstract, #abstract, [class*="abstract"], [id*="abstract"]').first().text().trim()
      || ''

    const contentSelectors = [
      'article', '.article-content', '.article-text',
      '.fulltext', '#fulltext', '.main-content', 'main',
      '.body-content', '#bodyContent', '.content-body',
      '.article-body', '#article-body', '.text-content',
      '#content', '.content', '.page-content'
    ]

    let content = ''
    for (const sel of contentSelectors) {
      const el = $(sel)
      if (el.length) {
        el.find('script, style, nav, header, footer, .references, .citations, .bibliography, .license, .copyright, .supplementary, .sidebar, .aside, .menu, .buttons, .share, .comments').remove()
        content = el.text().trim()
        if (content.length > 500) break
      }
    }

    if (!content || content.length < 200) {
      content = $('body').text().trim()
      content = content.replace(/\s+/g, ' ').replace(/\n{3,}/g, '\n\n')
    }

    const textSections = []
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 30)
    const chunkSize = 3000
    let currentChunk = ''
    for (const para of paragraphs) {
      const clean = para.trim()
      if (currentChunk.length + clean.length > chunkSize && currentChunk.length > 0) {
        textSections.push(currentChunk.trim())
        currentChunk = ''
      }
      currentChunk += clean + '\n\n'
    }
    if (currentChunk.trim().length > 20) textSections.push(currentChunk.trim())
    if (!textSections.length && abstract) textSections.push(abstract)

    const tmpDir = mkdtempSync(path.join(tmpdir(), 'pdf-'))
    const outputPath = path.join(tmpDir, 'article.pdf')
    const inputPath = path.join(tmpDir, 'input.json')
    const pythonDir = new URL('../scrape/', import.meta.url).pathname
    const scriptPath = path.join(pythonDir, 'makepdf.py')

    writeFileSync(inputPath, JSON.stringify({
      title: title.slice(0, 500),
      authors: authors.join(', ').slice(0, 500),
      source: 'Scraped from web',
      doi: cleanDoi,
      abstract: abstract.slice(0, 5000),
      text_pages: textSections.slice(0, 50),
      output: outputPath
    }))

    execSync(`python3 ${scriptPath} < ${inputPath}`, {
      timeout: 30000,
      stdio: ['pipe', 'ignore', 'pipe']
    })

    const buffer = readFileSync(outputPath)
    try {
      unlinkSync(outputPath)
      unlinkSync(tmpDir)
    } catch {}
    return buffer
  } catch {
    return null
  }
}

export async function getpdf(clients, m, { prefix, cmd, body }) {
  const doi = body.slice(prefix.length + cmd.length).trim()
  if (!doi) return m.reply(`Gunakan: ${prefix}getpdf [doi]`)

  await m.react('⏳')

  let pdfUrl
  try {
    pdfUrl = await findPdf(doi)
  } catch (e) {
    await m.react('❌')
    return m.reply('Gagal mencari PDF: ' + e.message)
  }

  async function sendPdf(buffer) {
    const fileName = `paper_${doi.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
    await clients.sendMessage(m.chat, {
      document: buffer,
      mimetype: 'application/pdf',
      fileName
    }, { quoted: m })
  }

  // Strategy 1: let Baileys download the PDF from URL directly
  if (pdfUrl) {
    try {
      await sendPdf({ url: pdfUrl })
      await m.react('✅')
      return
    } catch (e) {
      console.error('sendPdf URL failed:', e.message)
    }
  }

  // Strategy 2: download the PDF ourselves, then send buffer
  let result = await tryDownloadPdf(pdfUrl)
  if (result) {
    try {
      await sendPdf(Buffer.from(result.data))
      await m.react('✅')
      return
    } catch (e) {
      console.error('sendPdf buffer failed:', e.message)
    }
  }

  // Strategy 3: scrape PDF link from HTML page
  result = await scrapePdfFromHtml(pdfUrl)
  if (result) {
    try {
      await sendPdf(Buffer.from(result.data))
      await m.react('✅')
      return
    } catch (e) {
      console.error('sendPdf scrape HTML failed:', e.message)
    }
  }

  // Strategy 4: try Sci-Hub
  const cleanDoi = doi.replace('https://doi.org/', '')
  result = await scrapePdfFromHtml(`https://sci-hub.se/${cleanDoi}`)
  if (result) {
    try {
      await sendPdf(Buffer.from(result.data))
      await m.react('✅')
      return
    } catch (e) {
      console.error('sendPdf Sci-Hub failed:', e.message)
    }
  }

  // Strategy 5: scrape article text from journal page and generate PDF
  result = await scrapeArticleToPdf(doi)
  if (result) {
    try {
      await sendPdf(result)
      await m.react('✅')
      return
    } catch (e) {
      console.error('sendPdf scraped article failed:', e.message)
    }
  }

  // Strategy 6: generate minimal metadata PDF
  result = await extractToPdf(doi)
  if (result) {
    try {
      await sendPdf(result)
      await m.react('✅')
      return
    } catch (e) {
      console.error('sendPdf metadata failed:', e.message)
    }
  }

  await m.react('⚠️')
  await m.reply(`PDF tidak bisa dikirim. Coba buka:\nhttps://doi.org/${cleanDoi}`)
}