import axios from 'axios'

const BASE = 'https://www.ebi.ac.uk/europepmc/webservices/rest/search'

export async function searchEuropePMC(query, rows = 25) {
  const { data } = await axios.get(BASE, {
    params: { query, pageSize: rows, sort: 'relevance', format: 'json' },
    timeout: 15000
  })
  const hits = data?.resultList?.result || []
  return hits.map(item => {
    const doi = item.doi || item.pmid || ''
    const authors = (item.authorList?.author || []).map(a => `${a.firstName || ''} ${a.lastName || ''}`.trim()).filter(Boolean)
    if (!authors.length && item.authorString) {
      item.authorString.split(',').forEach(a => authors.push(a.trim()))
    }
    const pdfInfo = item.fullTextUrlList?.fullTextUrl?.find(u => u.documentStyle === 'PDF')
    return {
      doi: doi.replace('https://doi.org/', ''),
      title: item.title || 'No title',
      authors,
      year: item.firstPublicationDate?.slice(0, 4) || item.pubYear || '',
      publisher: item.journalTitle || item.bookOrReportDetails?.publisher || 'Europe PMC',
      type: item.resultType || 'article',
      url: `https://doi.org/${doi}` || item.sourceUrl,
      abstract: item.abstractText || '',
      pdfUrl: pdfInfo?.url || '',
      source: 'Europe PMC'
    }
  })
}

export async function getEuropePMCByDOI(doi) {
  const cleanDoi = doi.replace('https://doi.org/', '')
  try {
    const { data } = await axios.get(BASE, {
      params: { query: `doi:${cleanDoi}`, pageSize: 1, format: 'json' },
      timeout: 10000
    })
    const item = data?.resultList?.result?.[0]
    if (!item) return null
    const authors = (item.authorList?.author || []).map(a => `${a.firstName || ''} ${a.lastName || ''}`.trim()).filter(Boolean)
    const pdfInfo = item.fullTextUrlList?.fullTextUrl?.find(u => u.documentStyle === 'PDF')
    return {
      doi: (item.doi || '').replace('https://doi.org/', ''),
      title: item.title || 'No title',
      authors,
      year: item.firstPublicationDate?.slice(0, 4) || item.pubYear || '',
      publisher: item.journalTitle || 'Europe PMC',
      type: item.resultType || 'article',
      url: `https://doi.org/${cleanDoi}`,
      abstract: item.abstractText || '',
      pdfUrl: pdfInfo?.url || '',
      source: 'Europe PMC'
    }
  } catch {
    return null
  }
}
