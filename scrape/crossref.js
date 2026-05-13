import axios from 'axios'

const BASE = 'https://api.crossref.org/works'

const PDF_PATTERNS = [
  { match: /^10\.1371\/journal\.pone\./, build: doi => `https://journals.plos.org/plosone/article/file?id=${doi}&type=printable` },
  { match: /^10\.1371\/journal\.pmed\./, build: doi => `https://journals.plos.org/plosmedicine/article/file?id=${doi}&type=printable` },
  { match: /^10\.1155\//, build: doi => `https://downloads.hindawi.com/journals/${doi.split('/').slice(0, -1).join('/')}/articles/${doi.split('/').pop()}.pdf` },
  { match: /^10\.3390\//, build: doi => `https://mdpi-res.com/${doi.replace(/^10\./, 'd_')}.pdf` },
]

function extractPdfUrl(item) {
  const link = item.link?.find(l => l['content-type'] === 'application/pdf' || l.URL?.endsWith('.pdf'))
  if (link?.URL) return link.URL

  const doi = item.DOI
  if (!doi) return ''

  for (const p of PDF_PATTERNS) {
    if (p.match.test(doi)) return p.build(doi)
  }

  const fallbackLink = item.link?.find(l =>
    l.URL?.includes('download') || l.URL?.includes('pdf') || l['content-type']?.includes('pdf')
  )
  return fallbackLink?.URL || ''
}

function mapItem(item) {
  return {
    doi: item.DOI || '',
    title: item.title?.[0] || 'No title',
    authors: (item.author || []).map(a => `${a.given || ''} ${a.family || ''}`.trim()).filter(Boolean),
    year: item.published?.dateParts?.[0]?.[0] || item.created?.dateParts?.[0]?.[0] || '',
    publisher: item.publisher || item['container-title']?.[0] || '',
    type: item.type?.replace(/-/g, ' ') || '',
    url: item.URL || `https://doi.org/${item.DOI}`,
    abstract: item.abstract ? item.abstract.replace(/<[^>]*>/g, '') : '',
    pdfUrl: extractPdfUrl(item),
    source: 'CrossRef'
  }
}

export async function searchPapers(query, rows = 10) {
  const { data } = await axios.get(BASE, {
    params: { query, rows, sort: 'relevance' }
  })
  return (data?.message?.items || []).map(mapItem)
}

export async function getPaperByDOI(doi) {
  const { data } = await axios.get(`${BASE}/${doi}`)
  const item = data?.message
  if (!item) return null
  return {
    ...mapItem(item),
    page: item.page || '',
    volume: item.volume || '',
    issue: item.issue || ''
  }
}

export async function searchByAuthor(author, rows = 10) {
  const { data } = await axios.get(BASE, {
    params: { 'query.author': author, rows, sort: 'relevance' }
  })
  return (data?.message?.items || []).map(mapItem)
}

const SCIHUB_DOMAINS = [
  'https://sci-hub.se',
  'https://sci-hub.ru',
  'https://sci-hub.st',
  'https://sci-hub.now.im'
]

export async function findPdfUrl(doi) {
  const cleanDoi = doi.replace('https://doi.org/', '')

  try {
    const { data } = await axios.get(`https://api.unpaywall.org/v2/${cleanDoi}?email=bot@epistemeus.local`, { timeout: 10000 })
    const oa = data?.best_oa_location
    if (oa?.url_for_pdf) return oa.url_for_pdf
    if (oa?.url) return oa.url
  } catch {}

  for (const domain of SCIHUB_DOMAINS) {
    try {
      const url = `${domain}/${cleanDoi}`
      const res = await axios.head(url, { timeout: 8000 })
      if (res.status < 400) return url
    } catch {}
  }

  const viaDoi = `https://sci-hub.se/${cleanDoi}`
  return viaDoi
}