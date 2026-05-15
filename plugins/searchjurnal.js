import { getPaper, findPdf } from '../scrape/unified.js'
import { searchAll as searchGS } from '../scrape/googlescholar.js'
import { searchCrossRef } from '../scrape/crossref.js'
import { searchOpenAlex } from '../scrape/openalex.js'
import { searchArxiv } from '../scrape/arxiv.js'
import { searchDoaj } from '../scrape/doaj.js'
import { searchSemantic } from '../scrape/semantic.js'
import { searchPubmed } from '../scrape/pubmed.js'
import { searchZenodo } from '../scrape/zenodo.js'
import { searchBase } from '../scrape/base.js'
import { searchCore } from '../scrape/core.js'
import { searchHal } from '../scrape/hal.js'
import { searchEuropePMC } from '../scrape/europepmc.js'
import { searchScielo } from '../scrape/scielo.js'
import axios from 'axios'

const NON_GS_SOURCES = [
  { name: 'CrossRef', search: searchCrossRef },
  { name: 'OpenAlex', search: searchOpenAlex },
  { name: 'Semantic Scholar', search: searchSemantic },
  { name: 'Europe PMC', search: searchEuropePMC },
  { name: 'PubMed', search: searchPubmed },
  { name: 'arXiv', search: searchArxiv },
  { name: 'Zenodo', search: searchZenodo },
  { name: 'SciELO', search: searchScielo },
  { name: 'DOAJ', search: searchDoaj },
  { name: 'BASE', search: searchBase },
  { name: 'CORE', search: searchCore },
  { name: 'HAL', search: searchHal }
]

export default async (clients, m, { prefix, cmd, body }) => {
  let query = body.slice(prefix.length + cmd.length).trim()
  if (!query) return m.reply(`Gunakan: ${prefix}jurnal [kata kunci]`)

  await m.react('⏳')

  // .searchjurnal: pake scraper selain Google Scholar, list 1-50 button list
  // .jurnal: pake Google Scholar, langsung cari berdasarkan judul + PDF
  const isListMode = cmd === 'searchjurnal'

  if (isListMode) {
    let allPapers = []
    const seen = new Set()

    for (const src of NON_GS_SOURCES) {
      try {
        const results = await src.search(query, 5)
        for (const p of results) {
          const key = p.doi || p.title?.toLowerCase().slice(0, 60)
          if (key && !seen.has(key)) {
            seen.add(key)
            allPapers.push(p)
          }
        }
      } catch (e) {
        console.error(`[${src.name}] error:`, e.message)
      }
    }

    if (!allPapers.length) {
      await m.react('❌')
      return m.reply('Tidak ada hasil untuk: ' + query)
    }

    await m.react('✅')

    allPapers.sort((a, b) => (b.year || 0) - (a.year || 0))
    const maxShow = Math.min(allPapers.length, 50)
    const shown = allPapers.slice(0, maxShow)
    const rows = shown.map((p, i) => {
      const pa = Array.isArray(p.authors) ? p.authors : (p.authors ? String(p.authors).split(/[,;]/).map(s => s.trim()).filter(Boolean) : [])
      return {
        title: `${i + 1}. ${(p.title || '').slice(0, 55)}${p.title?.length > 55 ? '...' : ''}`,
        description: `[${p.source}] ${(pa[0] || '?')} (${p.year || '?'})${p.pdfUrl ? ' [PDF]' : ''}`,
        id: `${prefix}paper ${p.doi || p.url || i}`
      }
    })

    await clients.sendMessage(m.chat, {
      interactiveMessage: {
        title: `Hasil: ${query}`,
        footer: `${shown.length} paper dari ${NON_GS_SOURCES.length} sumber`,
        buttons: [{
          name: 'single_select',
          buttonParamsJson: JSON.stringify({
            title: 'Pilih paper',
            sections: [{
              title: `${shown.length} hasil dari ${allPapers.length} ditemukan`,
              rows
            }]
          })
        }]
      },
      contextInfo: {
        externalAdReply: {
          title: 'Academic Search',
          body: `${allPapers.length} hasil dari ${NON_GS_SOURCES.length} sumber`,
          mediaType: 1,
          showAdAttribution: false,
          renderLargerThumbnail: false
        }
      }
    })
    return
  }

  // .jurnal: Google Scholar + PDF
  const limit = 25

  let papers
  try {
    papers = await searchGS(query, limit)
  } catch (e) {
    console.error('[GS] error:', e.message)
    papers = []
  }

  if (!papers.length) {
    try {
      papers = await searchZenodo(query, limit)
    } catch {}
  }

  if (!papers.length) {
    await m.react('❌')
    return m.reply('Tidak ada hasil untuk: ' + query)
  }

  await m.react('✅')

  // .jurnal: cari paper terbaik berdasarkan judul
  const qlower = query.toLowerCase()
  let bestIdx = 0
  let bestScore = 0
  for (let i = 0; i < papers.length; i++) {
    const t = (papers[i].title || '').toLowerCase()
    if (t === qlower) { bestIdx = i; break }
    let score = 0
    const words = qlower.split(/\s+/).filter(Boolean)
    for (const w of words) {
      if (w.length > 2 && t.includes(w)) score++
    }
    if (score > bestScore) { bestScore = score; bestIdx = i }
  }

  const best = papers[bestIdx]
  const bestId = best.doi || best.url || ''

  const bestAuthors = Array.isArray(best.authors) ? best.authors : (best.authors ? String(best.authors).split(/[,;]/).map(s => s.trim()).filter(Boolean) : [])
  const authorText = bestAuthors.length ? bestAuthors[0] : 'Unknown'
  let info = `📄 *${best.title}*\n`
  info += `✍️ *Penulis:* ${authorText}\n`
  if (best.year) info += `📅 *Tahun:* ${best.year}\n`
  info += `🔗 ${best.url}`

  if (bestId) {
    await m.reply(`*Paper terbaik:*\n${info}\n\n⏳ Mendownload PDF...`)
    await getpdf(clients, m, { prefix, cmd: 'getpdf', body: `${prefix}getpdf ${bestId}`, paperInfo: best })
  } else {
    await clients.sendMessage(m.chat, {
      text: `*Paper terbaik:*\n${info}\n\n${prefix}paper ${best.url || bestIdx} untuk detail`
    })
  }
}

function resolveId(input) {
  if (!input || typeof input !== 'string') return input
  if (input.includes('doi.org/')) return input.split('doi.org/')[1].split(/[?#]/)[0]
  if (input.includes('pubmed.ncbi.nlm.nih.gov/')) return input.split('pubmed.ncbi.nlm.nih.gov/')[1].split(/[?#/]/)[0]
  if (input.includes('arxiv.org/abs/')) return input.split('arxiv.org/abs/')[1].split(/[?#]/)[0]
  if (input.includes('arxiv.org/')) return input.split('arxiv.org/')[1].split(/[?#]/)[0]
  if (input.includes('sci-hub')) return null
  return input
}

export async function paper(clients, m, { prefix, cmd, body }) {
  const raw = body.slice(prefix.length + cmd.length).trim()
  if (!raw) return m.reply(`Gunakan: ${prefix}paper [doi/url]`)
  const doi = resolveId(raw) || raw

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

  const authorsArr = Array.isArray(data.authors) ? data.authors : (data.authors ? String(data.authors).split(/[,;]/).map(s => s.trim()).filter(Boolean) : [])
  const authorText = authorsArr.length ? authorsArr.join(', ') : 'Unknown'
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
  const getpdfId = data.doi || data.url || ''
  if (!data.pdfUrl && getpdfId) {
    buttons.push({
      name: 'quick_reply',
      buttonParamsJson: JSON.stringify({ display_text: 'Cari PDF', id: `${prefix}getpdf ${getpdfId}` })
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
    const fname = `paper_${(data.doi || data.url || 'unknown').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
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

const UA_LIST = [
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0',
]

async function tryDownloadPdf(url, retries = 3) {
  for (let i = 0; i <= retries; i++) {
    if (i > 0) await new Promise(r => setTimeout(r, i * 1500 + Math.random() * 1000))
    try {
      const res = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 30000,
        headers: { 'User-Agent': UA_LIST[i % UA_LIST.length] },
        maxRedirects: 5
      })
      const ct = res.headers['content-type'] || ''
      if (ct.includes('application/pdf') || Buffer.from(res.data).slice(0, 5).toString() === '%PDF-') {
        return { data: res.data, url }
      }
    } catch (e) {
      if (e?.response?.status === 403 && !url.includes('download=1')) {
        url = url.replace(/\/content$/, '') + (url.includes('?') ? '&' : '?') + 'download=1'
      }
    }
  }
  return null
}

async function scrapePdfFromHtml(pageUrl) {
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await new Promise(r => setTimeout(r, attempt * 2000 + Math.random() * 1000))
    try {
      const html = (await axios.get(pageUrl, {
        timeout: 15000,
        headers: { 'User-Agent': UA_LIST[attempt % UA_LIST.length] }
      })).data

      const patterns = [
        /href=["']([^"']*\.pdf[^"']*)["']/ig,
        /href=["']([^"']*(?:download|pdf)[^"']*)["'][^>]*>.*?(?:pdf|download)/igs,
        /(?:download|pdf).*?href=["']([^"']*)["']/ig,
        /<a[^>]*class=["'][^"']*pdf[^"']*["'][^>]*href=["']([^"']*)["']/ig,
        /href=["']([^"']*\/pdf\/[^"']*)["']/ig,
        /href=["']([^"']*pdf(?:direct|download|fulltext)[^"']*)["']/ig,
        /(?:data-href|data-url|data-file)=["']([^"']*\.pdf[^"']*)["']/ig,
        /<iframe[^>]+src=["']([^"']*\.pdf[^"']*)["']/ig,
        /<embed[^>]+src=["']([^"']*\.pdf[^"']*)["']/ig,
        /<meta[^>]+name=["']citation_pdf_url["'][^>]+content=["']([^"']*)["']/ig,
        /<meta[^>]+content=["']([^"']*\.pdf[^"']*)["'][^>]+name=["']citation_pdf_url["']/ig,
        /<link[^>]+rel=["'](?:alternate|item)[^"']*["'][^>]+type=["']application\/pdf["'][^>]+href=["']([^"']*)["']/ig,
      ]

      for (const pat of patterns) {
        const all = [...html.matchAll(pat)]
        for (const m of all) {
          let found = m[1].trim()
          if (found.startsWith('//')) found = 'https:' + found
          else if (found.startsWith('/')) found = new URL(found, pageUrl).href
          else if (!found.startsWith('http')) found = new URL(found, pageUrl).href
          const result = await tryDownloadPdf(found)
          if (result) return result
        }
      }
    } catch {}
  }
  return null
}

export async function getpdf(clients, m, { prefix, cmd, body, paperInfo }) {
  const raw = body.slice(prefix.length + cmd.length).trim()
  if (!raw) return m.reply(`Gunakan: ${prefix}getpdf [doi/url]`)
  const id = resolveId(raw) || raw
  const cleanId = id.replace('https://doi.org/', '')

  await m.react('⏳')

  async function isValidPdf(buf) {
    if (!buf) return false
    if (Buffer.isBuffer(buf)) return buf.slice(0, 5).toString() === '%PDF-'
    try { return Buffer.from(buf).slice(0, 5).toString() === '%PDF-' } catch { return false }
  }

  async function sendPdf(buffer) {
    const isUrl = buffer && typeof buffer === 'object' && buffer.url
    if (!isUrl && !isValidPdf(buffer.data || buffer)) return false
    const fileName = `paper_${id.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
    try {
      await clients.sendMessage(m.chat, {
        document: buffer,
        mimetype: 'application/pdf',
        fileName
      }, { quoted: m })
      return true
    } catch {
      return false
    }
  }

  const fromZenodo = paperInfo?.source === 'Zenodo' || paperInfo?.pdfUrl?.includes('zenodo.org')

  // Coba PDF URL dari hasil pencarian (Google Scholar / Zenodo dll)
  if (paperInfo?.pdfUrl && !paperInfo.pdfUrl.includes('sci-hub')) {
    if (await sendPdf({ url: paperInfo.pdfUrl })) return await m.react('✅')
    const buf = await tryDownloadPdf(paperInfo.pdfUrl)
    if (buf && await sendPdf(Buffer.from(buf.data))) return await m.react('✅')
    if (fromZenodo) {
      // PDF dari Zenodo gagal, skip getPaper/Zenodo API (bakal kena rate limit juga)
      // langsung coba HTML scrape sebagai usaha terakhir
      const zid = cleanId.match(/^10\.5281\/zenodo\.(\d+)/)?.[1]
      if (zid) {
        const result = await scrapePdfFromHtml(`https://zenodo.org/records/${zid}`)
        if (result) {
          const toSend = result.data ? Buffer.from(result.data) : result
          if (await sendPdf(toSend)) return await m.react('✅')
        }
      }
      await m.react('⚠️')
      return m.reply(`PDF tidak tersedia. Buka:\nhttps://doi.org/${cleanId}`)
    }
  }

  const pdfUrl = await findPdf(id).catch(() => null)
  const doiFallback = `https://doi.org/${cleanId}`
  const hasDirectUrl = pdfUrl && pdfUrl !== doiFallback && !pdfUrl.includes('sci-hub')

  if (hasDirectUrl) {
    if (await sendPdf({ url: pdfUrl })) return await m.react('✅')
    const buf = await tryDownloadPdf(pdfUrl)
    if (buf && await sendPdf(Buffer.from(buf.data))) return await m.react('✅')
  }

  const extraInfo = await getPaper(id).catch(() => null)
  const extraPdfUrl = extraInfo?.pdfUrl || null

  if (extraPdfUrl && extraPdfUrl !== pdfUrl && !extraPdfUrl.includes('sci-hub')) {
    if (await sendPdf({ url: extraPdfUrl })) return await m.react('✅')
    const buf = await tryDownloadPdf(extraPdfUrl)
    if (buf && await sendPdf(Buffer.from(buf.data))) return await m.react('✅')
  }

  const isUrl = id.startsWith('http') && !id.includes('doi.org/')
  if (isUrl || raw.startsWith('http')) {
    const url = isUrl ? id : raw
    if (await sendPdf({ url })) return await m.react('✅')
    const buf = await tryDownloadPdf(url)
    if (buf && await sendPdf(Buffer.from(buf.data))) return await m.react('✅')
  }

  // Cari link PDF dari halaman web (tanpa scrape konten artikel)
  const zenodoRecord = cleanId.match(/^10\.5281\/zenodo\.(\d+)/)
  const urlsToTry = [
    `https://doi.org/${cleanId}`,
    zenodoRecord ? `https://zenodo.org/records/${zenodoRecord[1]}` : null,
  ].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i)

  for (const url of urlsToTry) {
    const result = await scrapePdfFromHtml(url)
    if (result) {
      const toSend = result.data ? Buffer.from(result.data) : result
      if (await sendPdf(toSend)) return await m.react('✅')
    }
  }

  await m.react('⚠️')
  await m.reply(`PDF tidak tersedia. Buka:\nhttps://doi.org/${cleanId}`)
}