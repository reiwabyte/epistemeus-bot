import axios from 'axios'
import * as cheerio from 'cheerio'

const ESEARCH = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi'
const ESUMMARY = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi'
const EFETCH = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi'

export async function searchPubmed(query, rows = 10) {
  const { data: searchXml } = await axios.get(ESEARCH, {
    params: { db: 'pubmed', term: query, retmax: rows, retmode: 'json', sort: 'relevance' }
  })
  const searchData = typeof searchXml === 'string' ? JSON.parse(searchXml) : searchXml
  const ids = searchData?.esearchresult?.idlist || []
  if (!ids.length) return []

  const { data: summaryJson } = await axios.get(ESUMMARY, {
    params: { db: 'pubmed', id: ids.join(','), retmode: 'json' }
  })
  const result = summaryJson?.result || {}
  return ids.map(id => {
    const item = result[id]
    if (!item) return null
    const doi = (item.elocationid || '').replace('doi: ', '') ||
                (item.articleids || []).find(a => a.type === 'doi')?.value || ''
    const authors = (item.authors || []).map(a => a.name).filter(Boolean)
    return {
      doi,
      title: item.title || 'No title',
      authors,
      year: item.pubdate?.slice(-4) || item.sortpubdate?.slice(0, 4) || '',
      publisher: item.source || item.fulljournalname || 'PubMed',
      type: 'article',
      url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
      abstract: '',
      pdfUrl: doi ? `https://www.ncbi.nlm.nih.gov/pmc/articles/PMC${id}/pdf/` : '',
      source: 'PubMed'
    }
  }).filter(Boolean)
}

export async function getPubmedById(id) {
  const cleanId = id.replace('pubmed.ncbi.nlm.nih.gov/', '').replace(/[^0-9]/g, '')
  const { data } = await axios.get(EFETCH, {
    params: { db: 'pubmed', id: cleanId, retmode: 'xml', rettype: 'abstract' }
  })
  const $ = cheerio.load(data, { xmlMode: true })
  const article = $('PubmedArticle').first()
  if (!article.length) return null

  const doi = article.find('ArticleId[IdType="doi"]').text() || ''
  const authors = []
  article.find('Author').each((_, el) => {
    const name = $(el).find('LastName').text() + ' ' + $(el).find('ForeName').text()
    if (name.trim()) authors.push(name.trim())
  })
  const title = article.find('ArticleTitle').text().replace(/\s+/g, ' ').trim()
  const pubDate = article.find('PubDate Year').text() ||
                  article.find('PubDate MedlineDate').text().slice(0, 4) || ''
  const journal = article.find('Journal Title').text() || article.find('Journal ISOAbbreviation').text() || ''
  const abstract = article.find('AbstractText').map((_, el) => $(el).text()).get().join(' ').replace(/\s+/g, ' ').trim()
  const pmid = article.find('PMID').text() || cleanId

  return {
    doi,
    title: title || 'No title',
    authors,
    year: pubDate,
    publisher: journal || 'PubMed',
    type: 'article',
    url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
    abstract,
    pdfUrl: doi ? `https://www.ncbi.nlm.nih.gov/pmc/articles/PMC${pmid}/pdf/` : '',
    source: 'PubMed'
  }
}