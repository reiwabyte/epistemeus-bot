import axios from 'axios'

const BASE = 'https://api.semanticscholar.org/graph/v1'

export async function searchSemantic(query, rows = 10) {
  const { data } = await axios.get(`${BASE}/paper/search`, {
    params: { query, limit: rows, fields: 'title,authors,year,journal,externalIds,url,abstract,openAccessPdf' },
    timeout: 15000,
    validateStatus: s => s < 500
  })
  if (!data?.data) return []
  return (data.data || []).map(item => ({
    doi: (item.externalIds?.DOI || '').replace('https://doi.org/', ''),
    title: item.title || 'No title',
    authors: (item.authors || []).map(a => a.name).filter(Boolean),
    year: item.year ? String(item.year) : '',
    publisher: item.journal?.name || 'Semantic Scholar',
    type: 'article',
    url: item.url || `https://www.semanticscholar.org/paper/${item.paperId}`,
    abstract: item.abstract || '',
    pdfUrl: item.openAccessPdf?.url || '',
    source: 'Semantic Scholar'
  }))
}

export async function getSemanticById(id) {
  const cleanId = id.replace('https://doi.org/', '').replace('semanticscholar.org/paper/', '')
  try {
    const { data } = await axios.get(`${BASE}/paper/DOI:${cleanId}`, {
      params: { fields: 'title,authors,year,journal,externalIds,url,abstract,openAccessPdf' },
      timeout: 10000
    })
    if (!data || data.error) return null
    return {
      doi: (data.externalIds?.DOI || '').replace('https://doi.org/', ''),
      title: data.title || 'No title',
      authors: (data.authors || []).map(a => a.name).filter(Boolean),
      year: data.year ? String(data.year) : '',
      publisher: data.journal?.name || 'Semantic Scholar',
      type: 'article',
      url: data.url || `https://www.semanticscholar.org/paper/${data.paperId}`,
      abstract: data.abstract || '',
      pdfUrl: data.openAccessPdf?.url || '',
      source: 'Semantic Scholar'
    }
  } catch {
    return null
  }
}