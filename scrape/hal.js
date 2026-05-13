import axios from 'axios'

const BASE = 'https://api.archives-ouvertes.fr/search'

export async function searchHal(query, rows = 10) {
  try {
    const { data } = await axios.get(BASE, {
      params: {
        q: query,
        rows,
        sort: 'relevance desc',
        wt: 'json',
        fl: 'doi_s,title_s,label_s,producedDateY_i,journalTitle_s,docType_s,uri_s,abstract_s,fileMainUrl_s'
      },
      timeout: 15000
    })
    const docs = data?.response?.docs || []
    return docs.map(item => ({
      doi: (Array.isArray(item.doi_s) ? item.doi_s[0] : item.doi_s) || '',
      title: (Array.isArray(item.title_s) ? item.title_s[0] : item.title_s) || (Array.isArray(item.label_s) ? item.label_s[0] : item.label_s) || 'No title',
      authors: [],
      year: item.producedDateY_i ? String(item.producedDateY_i) : '',
      publisher: item.journalTitle_s || 'HAL Archive',
      type: item.docType_s || 'article',
      url: item.uri_s || '',
      abstract: item.abstract_s || '',
      pdfUrl: item.fileMainUrl_s || '',
      source: 'HAL'
    }))
  } catch {
    return []
  }
}

export async function getHalByDOI(doi) {
  const cleanDoi = doi.replace('https://doi.org/', '')
  try {
    const { data } = await axios.get(BASE, {
      params: {
        q: `doi_s:"${cleanDoi}"`,
        rows: 1,
        wt: 'json',
        fl: 'doi_s,title_s,label_s,producedDateY_i,journalTitle_s,docType_s,uri_s,abstract_s,fileMainUrl_s'
      },
      timeout: 10000
    })
    const item = data?.response?.docs?.[0]
    if (!item) return null
    return {
      doi: (Array.isArray(item.doi_s) ? item.doi_s[0] : item.doi_s) || '',
      title: (Array.isArray(item.title_s) ? item.title_s[0] : item.title_s) || (Array.isArray(item.label_s) ? item.label_s[0] : item.label_s) || 'No title',
      authors: [],
      year: item.producedDateY_i ? String(item.producedDateY_i) : '',
      publisher: item.journalTitle_s || 'HAL Archive',
      type: item.docType_s || 'article',
      url: item.uri_s || '',
      abstract: item.abstract_s || '',
      pdfUrl: item.fileMainUrl_s || '',
      source: 'HAL'
    }
  } catch {
    return null
  }
}