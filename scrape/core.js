import axios from 'axios'

const BASE = 'https://api.core.ac.uk/v3'

export async function searchCore(query, rows = 10) {
  const apiKey = process.env.CORE_API_KEY || ''
  const headers = apiKey ? { Authorization: `Bearer ${apiKey}` } : {}
  const params = { q: query, limit: rows }
  if (!apiKey) params.apiKey = 'free'

  try {
    const { data } = await axios.get(`${BASE}/search/works`, {
      params,
      headers,
      timeout: 10000
    })
    return (data.results || []).map(item => ({
      doi: (item.doi || '').replace('https://doi.org/', ''),
      title: item.title || 'No title',
      authors: item.authors || [],
      year: item.year ? String(item.year) : '',
      publisher: item.publisher || item.journalName || 'CORE',
      type: item.workType || 'article',
      url: item.sourceUrl || item.documentUrl || `https://doi.org/${item.doi}`,
      abstract: item.abstract || '',
      pdfUrl: item.downloadUrl || item.fullTextUrl || '',
      source: 'CORE'
    }))
  } catch {
    return []
  }
}

export async function getCoreByDOI(doi) {
  const cleanDoi = doi.replace('https://doi.org/', '')
  const res = await searchCore(cleanDoi, 3)
  return res.find(p => p.doi === cleanDoi) || res[0] || null
}