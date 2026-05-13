import axios from 'axios'

const BASE = 'https://search.scielo.org/api/v1'

export async function searchScielo(query, rows = 25) {
  const { data } = await axios.get(`${BASE}`, {
    params: { q: query, count: rows, lang: 'en', output: 'json' },
    timeout: 15000
  })
  const hits = data?.results || []
  const docs = hits.map(h => h._source || h) || []
  return docs.map(item => {
    const doi = item.doi || ''
    const authors = (item.authors || []).map(a => a.name || a.surname ? `${a.name || ''} ${a.surname || ''}`.trim() : a).filter(Boolean)
    return {
      doi: doi.replace('https://doi.org/', ''),
      title: item.title?.[0] || item.title || 'No title',
      authors,
      year: item.publication_date?.slice(0, 4) || item.year || '',
      publisher: item.journal_title || 'SciELO',
      type: item.type || 'article',
      url: item.url || item.link?.[0] || (doi ? `https://doi.org/${doi}` : ''),
      abstract: (Array.isArray(item.abstract) ? item.abstract[0] : item.abstract) || '',
      pdfUrl: item.pdf_url || item.pdf || '',
      source: 'SciELO'
    }
  })
}

export async function getScieloByDOI(doi) {
  const cleanDoi = doi.replace('https://doi.org/', '')
  try {
    const { data } = await axios.get(`${BASE}?q=doi:"${cleanDoi}"&output=json&count=1`, { timeout: 10000 })
    const item = data?.results?.[0]?._source
    if (!item) return null
    const authors = (item.authors || []).map(a => a.name || a.surname ? `${a.name || ''} ${a.surname || ''}`.trim() : a).filter(Boolean)
    return {
      doi: (item.doi || '').replace('https://doi.org/', ''),
      title: item.title?.[0] || item.title || 'No title',
      authors,
      year: item.publication_date?.slice(0, 4) || item.year || '',
      publisher: item.journal_title || 'SciELO',
      type: item.type || 'article',
      url: item.url || (cleanDoi ? `https://doi.org/${cleanDoi}` : ''),
      abstract: (Array.isArray(item.abstract) ? item.abstract[0] : item.abstract) || '',
      pdfUrl: item.pdf_url || item.pdf || '',
      source: 'SciELO'
    }
  } catch {
    return null
  }
}
