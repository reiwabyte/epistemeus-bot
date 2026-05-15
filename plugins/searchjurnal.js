import { getPaper, findPdf } from '../scrape/unified.js'
import { searchAll as searchGS } from '../scrape/googlescholar.js'
import { searchPapers as searchCrossRef } from '../scrape/crossref.js'
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
  if (best.abstract) {
    const abs = best.abstract.length > 400 ? best.abstract.slice(0, 400) + '...' : best.abstract
    info += `📝 *Abstrak:*\n${abs}\n`
  }
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

async function tryDownloadPdf(url, retries = 3) {
  for (let i = 0; i <= retries; i++) {
    if (i > 0) await new Promise(r => setTimeout(r, i * 1500 + Math.random() * 1000))
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
    } catch (e) {
      if (e?.response?.status === 403 && !url.includes('download=1')) {
        url = url.replace(/\/content$/, '') + (url.includes('?') ? '&' : '?') + 'download=1'
      }
    }
  }
  return null
}

async function sendPdf(clients, m, buffer, id) {
  if (!buffer) return false
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

async function tryPdfUrl(clients, m, url, id) {
  if (!url || url.includes('sci-hub')) return false
  if (await sendPdf(clients, m, { url }, id)) return true
  const buf = await tryDownloadPdf(url)
  if (buf && await sendPdf(clients, m, Buffer.from(buf.data), id)) return true
  return false
}

const PDF_PATTERNS = [
  { match: /^10\.5281\/zenodo\.(\d+)/, resolve: async (m) => {
    try {
      const { data } = await axios.get(`https://zenodo.org/api/records/${m[1]}`, { timeout: 10000 })
      const files = data.files || []
      for (const f of files) {
        if (f.links?.download) return f.links.download
        if ((f.type === 'pdf' || f.key?.endsWith('.pdf')) && f.key)
          return `https://zenodo.org/records/${m[1]}/files/${encodeURIComponent(f.key)}?download=1`
      }
    } catch {}
    return null
  }},
  { match: /^10\.1101\//, build: (_, d) => `https://www.biorxiv.org/content/${d}.full.pdf` },
  { match: /^10\.1371\/journal\.pone\./, build: (_, d) => `https://journals.plos.org/plosone/article/file?id=${d}&type=printable` },
  { match: /^10\.1371\/journal\.pmed\./, build: (_, d) => `https://journals.plos.org/plosmedicine/article/file?id=${d}&type=printable` },
  { match: /^10\.1155\//, build: (_, d) => `https://downloads.hindawi.com/journals/${d.split('/').slice(0,-1).join('/')}/articles/${d.split('/').pop()}.pdf` },
  { match: /^10\.3390\//, build: (_, d) => `https://mdpi-res.com/${d.replace(/^10\./, 'd_')}.pdf` },
]

async function resolvePattern(cleanId) {
  for (const p of PDF_PATTERNS) {
    const m = cleanId.match(p.match)
    if (!m) continue
    if (p.resolve) {
      const r = await p.resolve(m)
      if (r) return r
    }
    if (p.build) return p.build(m, cleanId)
  }
  return null
}

export async function getpdf(clients, m, { prefix, cmd, body, paperInfo }) {
  const raw = body.slice(prefix.length + cmd.length).trim()
  if (!raw) return m.reply(`Gunakan: ${prefix}getpdf [doi/url]`)
  const id = resolveId(raw) || raw
  const cleanId = id.replace('https://doi.org/', '')

  await m.react('⏳')

  let candidates = []
  if (paperInfo?.pdfUrl) candidates.push(paperInfo.pdfUrl)

  const arxivId = cleanId.replace(/^arxiv\.org\/(abs|pdf)\//, '').replace('.pdf', '')
  if (/^\d{4}\.\d{4,5}(v\d+)?$/.test(arxivId)) candidates.push(`https://arxiv.org/pdf/${arxivId}.pdf`)

  const patternUrl = await resolvePattern(cleanId)
  if (patternUrl) candidates.push(patternUrl)

  try {
    const fp = await findPdf(id)
    if (fp && !fp.includes('sci-hub') && !fp.includes('doi.org/')) candidates.push(fp)
  } catch {}

  const seen = new Set()
  for (const url of candidates) {
    if (!url || seen.has(url)) continue
    seen.add(url)
    if (await tryPdfUrl(clients, m, url, id)) return await m.react('✅')
  }

  const extraInfo = await getPaper(id).catch(() => null)
  if (extraInfo?.pdfUrl && !seen.has(extraInfo.pdfUrl)) {
    if (await tryPdfUrl(clients, m, extraInfo.pdfUrl, id)) return await m.react('✅')
  }

  if (id.startsWith('http') && !id.includes('doi.org/')) {
    if (!seen.has(id) && await tryPdfUrl(clients, m, id, id)) return await m.react('✅')
  }

  await m.react('⚠️')
  await m.reply(`PDF tidak tersedia. Buka:\n${cleanId.startsWith('http') ? cleanId : 'https://doi.org/' + cleanId}`)
}