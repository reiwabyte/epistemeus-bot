import axios from 'axios'

const BASE = 'https://api.openalex.org/works'

export async function searchOpenAlex(query, rows = 10) {
  const { data } = await axios.get(BASE, {
    params: {
      search: query,
      per_page: rows,
      sort: 'relevance_score:desc'
    },
    headers: { 'User-Agent': 'epistemeus-bot/1.0 (mailto:bot@epistemeus.local)' }
  })
  return (data.results || []).map(item => {
    const doi = item.doi || ''
    const pdfLink = item.open_access?.oa_url || ''
    const primary = item.primary_location
    const source = primary?.source
    return {
      doi: doi.replace('https://doi.org/', ''),
      title: item.title || 'No title',
      authors: (item.authorships || []).map(a => a.author?.display_name).filter(Boolean),
      year: item.publication_year || '',
      publisher: source?.display_name || source?.publisher || item.publisher || '',
      type: item.type || 'article',
      url: item.doi || `https://doi.org/${doi}`,
      abstract: item.abstract_inverted_index ? reconstructAbstract(item.abstract_inverted_index) : '',
      pdfUrl: pdfLink,
      source: 'OpenAlex'
    }
  })
}

function reconstructAbstract(inverted) {
  if (!inverted) return ''
  const words = []
  for (const [word, positions] of Object.entries(inverted)) {
    for (const pos of positions) words[pos] = word
  }
  return words.filter(Boolean).join(' ')
}

export async function getOpenAlexByDOI(doi) {
  const cleanDoi = doi.replace('https://doi.org/', '')
  const { data } = await axios.get(`${BASE}/doi:${cleanDoi}`, {
    headers: { 'User-Agent': 'epistemeus-bot/1.0 (mailto:bot@epistemeus.local)' }
  })
  if (!data) return null
  const pdfLink = data.open_access?.oa_url || ''
  const primary = data.primary_location
  const source = primary?.source
  return {
    doi: (data.doi || '').replace('https://doi.org/', ''),
    title: data.title || 'No title',
    authors: (data.authorships || []).map(a => a.author?.display_name).filter(Boolean),
    year: data.publication_year || '',
    publisher: source?.display_name || source?.publisher || data.publisher || '',
    type: data.type || 'article',
    url: data.doi || `https://doi.org/${cleanDoi}`,
    abstract: data.abstract_inverted_index ? reconstructAbstract(data.abstract_inverted_index) : '',
    pdfUrl: pdfLink,
    source: 'OpenAlex'
  }
}