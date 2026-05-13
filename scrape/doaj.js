import axios from 'axios'

const BASE = 'https://doaj.org/api/v3/search/articles'

export async function searchDoaj(query, rows = 10) {
  const { data } = await axios.get(`${BASE}/${encodeURIComponent(query)}`, {
    params: { page: 1, pageSize: rows }
  })

  return (data.results || []).map(item => {
    const b = item.bibjson
    const doi = (b.identifier || []).find(i => i.type === 'DOI')?.id || ''
    return {
      doi,
      title: b.title || 'No title',
      authors: (b.author || []).map(a => a.name).filter(Boolean),
      year: b.year ? String(b.year) : '',
      publisher: b.journal?.title || b.publisher || '',
      type: 'open access',
      url: doi ? `https://doi.org/${doi}` : b.link?.[0]?.url || '',
      abstract: b.abstract || '',
      pdfUrl: '',
      source: 'DOAJ'
    }
  })
}

export async function getDoajByDOI(doi) {
  const cleanDoi = doi.replace('https://doi.org/', '')
  const { data } = await axios.get(`${BASE}/${encodeURIComponent(cleanDoi)}`, { params: { pageSize: 5 } })
  const item = data.results?.[0]
  if (!item) return null
  const b = item.bibjson
  const foundDoi = (b.identifier || []).find(i => i.type === 'DOI')?.id || ''
  return {
    doi: foundDoi,
    title: b.title || 'No title',
    authors: (b.author || []).map(a => a.name).filter(Boolean),
    year: b.year ? String(b.year) : '',
    publisher: b.journal?.title || b.publisher || '',
    type: 'open access',
    url: foundDoi ? `https://doi.org/${foundDoi}` : b.link?.[0]?.url || '',
    abstract: b.abstract || '',
    pdfUrl: '',
    source: 'DOAJ'
  }
}