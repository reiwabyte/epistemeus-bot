import axios from 'axios'

const BASE = 'https://api.base-search.net/cgi-bin/BaseHttpSearchInterface'

export async function searchBase(query, rows = 10) {
  try {
    const { data } = await axios.get(BASE, {
      params: {
        func: 'PerformSearch',
        query: query,
        hits: rows,
        format: 'json'
      },
      timeout: 15000
    })

    const json = typeof data === 'string' ? JSON.parse(data) : data
    const docs = json?.response?.docs || []
    return docs.map(doc => {
      const doi = doc.doi?.[0] || ''
      return {
        doi: doi.replace('https://doi.org/', ''),
        title: doc.title?.[0] || 'No title',
        authors: doc.author || [],
        year: doc.year?.[0] || doc.date?.[0]?.slice(0, 4) || '',
        publisher: doc.source?.[0] || doc.publisher?.[0] || 'BASE',
        type: doc.doctype?.[0] || 'article',
        url: doc.url?.[0] || doc.link?.[0] || '',
        abstract: doc.description?.[0] ? doc.description[0].replace(/<[^>]*>/g, '').trim() : '',
        pdfUrl: '',
        source: 'BASE'
      }
    })
  } catch {
    return []
  }
}

export async function getBaseByDOI(doi) {
  const cleanDoi = doi.replace('https://doi.org/', '')
  const res = await searchBase(cleanDoi, 5)
  return res.find(p => p.doi === cleanDoi) || res[0] || null
}