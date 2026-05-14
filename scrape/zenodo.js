import axios from 'axios'

const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'

function buildPdfUrl(item, pdfFile) {
  if (!pdfFile) return ''
  const recordId = item.id
  const fileKey = pdfFile.key
  if (!recordId || !fileKey) return ''
  return `https://zenodo.org/records/${recordId}/files/${encodeURIComponent(fileKey)}?download=1`
}

export async function searchZenodo(query, rows = 10) {
  const { data } = await axios.get('https://zenodo.org/api/records', {
    params: { q: query, size: rows, sort: 'bestmatch' },
    timeout: 30000,
    headers: { 'User-Agent': UA }
  })
  return (data.hits?.hits || []).map(item => {
    const meta = item.metadata || {}
    const doi = meta.doi || item.doi || ''
    const files = item.files || []
    const pdfFile = files.find(f => f.type === 'pdf' || f.key?.endsWith('.pdf') || f.mimetype === 'application/pdf')
    const authors = (meta.creators || []).map(c => c.name).filter(Boolean)
    return {
      doi: doi.replace('https://doi.org/', ''),
      title: meta.title || 'No title',
      authors,
      year: item.created?.slice(0, 4) || meta.publication_date?.slice(0, 4) || '',
      publisher: 'Zenodo (CERN)',
      type: meta.resource_type?.title || 'publication',
      url: `https://zenodo.org/records/${item.id}`,
      abstract: meta.description ? meta.description.replace(/<[^>]*>/g, '').trim() : '',
      pdfUrl: buildPdfUrl(item, pdfFile),
      source: 'Zenodo'
    }
  })
}

export async function getZenodoByDOI(doi) {
  const cleanDoi = doi.replace('https://doi.org/', '')
  const { data } = await axios.get('https://zenodo.org/api/records', {
    params: { q: `doi:"${cleanDoi}"`, size: 1 },
    timeout: 30000,
    headers: { 'User-Agent': UA }
  })
  const item = data.hits?.hits?.[0]
  if (!item) return null
  const meta = item.metadata || {}
  const pdfFile = (item.files || []).find(f => f.type === 'pdf' || f.key?.endsWith('.pdf'))
  return {
    doi: (meta.doi || item.doi || '').replace('https://doi.org/', ''),
    title: meta.title || 'No title',
    authors: (meta.creators || []).map(c => c.name).filter(Boolean),
    year: item.created?.slice(0, 4) || meta.publication_date?.slice(0, 4) || '',
    publisher: 'Zenodo (CERN)',
    type: meta.resource_type?.title || 'publication',
    url: `https://zenodo.org/records/${item.id}`,
    abstract: meta.description ? meta.description.replace(/<[^>]*>/g, '').trim() : '',
    pdfUrl: buildPdfUrl(item, pdfFile),
    source: 'Zenodo'
  }
}