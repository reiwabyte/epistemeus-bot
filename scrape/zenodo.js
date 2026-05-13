import axios from 'axios'

const BASE = 'https://zenodo.org/api/records'

export async function searchZenodo(query, rows = 10) {
  const { data } = await axios.get(BASE, {
    params: { q: query, size: rows, sort: 'bestmatch' },
    timeout: 30000
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
      url: item.links?.doi || item.links?.html || `https://doi.org/${doi}`,
      abstract: meta.description ? meta.description.replace(/<[^>]*>/g, '').trim() : '',
      pdfUrl: pdfFile?.links?.self || pdfFile?.download_url || '',
      source: 'Zenodo'
    }
  })
}

export async function getZenodoByDOI(doi) {
  const cleanDoi = doi.replace('https://doi.org/', '')
  const { data } = await axios.get(`${BASE}`, {
    params: { q: `doi:"${cleanDoi}"`, size: 1 }
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
    url: item.links?.doi || item.links?.html || '',
    abstract: meta.description ? meta.description.replace(/<[^>]*>/g, '').trim() : '',
    pdfUrl: pdfFile?.links?.self || '',
    source: 'Zenodo'
  }
}