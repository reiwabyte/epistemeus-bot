import axios from 'axios'
import * as cheerio from 'cheerio'

const BASE = 'http://export.arxiv.org/api/query'

export async function searchArxiv(query, rows = 10) {
  const { data } = await axios.get(BASE, {
    params: {
      search_query: `all:${encodeURIComponent(query).replace(/%20/g, '+')}`,
      start: 0,
      max_results: rows,
      sortBy: 'relevance'
    }
  })

  const $ = cheerio.load(data, { xmlMode: true })
  const entries = []

  $('entry').each((i, el) => {
    const entry = $(el)
    const doi = entry.find('link[title="doi"]').attr('href')?.replace('https://doi.org/', '') || ''
    const id = entry.find('id').text() || ''
    const pdfLink = entry.find('link[title="pdf"]').attr('href') || ''

    entries.push({
      doi,
      title: entry.find('title').text().replace(/\s+/g, ' ').trim(),
      authors: [],
      year: entry.find('published').text().slice(0, 4) || '',
      publisher: 'arXiv',
      type: 'preprint',
      url: id,
      abstract: entry.find('summary').text().replace(/\s+/g, ' ').trim(),
      pdfUrl: pdfLink || `https://arxiv.org/pdf/${id.split('/').pop()}.pdf`,
      source: 'arXiv'
    })

    entry.find('author').each((_, a) => {
      entries[i].authors.push($(a).find('name').text())
    })
  })

  return entries
}

export async function getArxivById(id) {
  const cleanId = id.replace(/arxiv\.org\/(abs|pdf)\//, '').replace('.pdf', '')
  const { data } = await axios.get(`${BASE}?id_list=${cleanId}`)
  const $ = cheerio.load(data, { xmlMode: true })
  const entry = $('entry').first()
  if (!entry.length) return null

  const doi = entry.find('link[title="doi"]').attr('href')?.replace('https://doi.org/', '') || ''
  const authors = []
  entry.find('author').each((_, a) => authors.push($(a).find('name').text()))

  return {
    doi,
    title: entry.find('title').text().replace(/\s+/g, ' ').trim(),
    authors,
    year: entry.find('published').text().slice(0, 4) || '',
    publisher: 'arXiv',
    type: 'preprint',
    url: entry.find('id').text(),
    abstract: entry.find('summary').text().replace(/\s+/g, ' ').trim(),
    pdfUrl: entry.find('link[title="pdf"]').attr('href') || `https://arxiv.org/pdf/${cleanId}.pdf`,
    source: 'arXiv'
  }
}