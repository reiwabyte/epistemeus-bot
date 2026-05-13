import { searchPapers as searchCrossRef, getPaperByDOI as getCrossRefByDOI, findPdfUrl } from './crossref.js'
import { searchOpenAlex, getOpenAlexByDOI } from './openalex.js'
import { searchArxiv, getArxivById } from './arxiv.js'
import { searchDoaj, getDoajByDOI } from './doaj.js'
import { searchSemantic, getSemanticById } from './semantic.js'
import { searchPubmed, getPubmedById } from './pubmed.js'
import { searchZenodo, getZenodoByDOI } from './zenodo.js'
import { searchBase, getBaseByDOI } from './base.js'
import { searchCore, getCoreByDOI } from './core.js'
import { searchHal, getHalByDOI } from './hal.js'
import { searchEuropePMC, getEuropePMCByDOI } from './europepmc.js'
import { searchScielo, getScieloByDOI } from './scielo.js'

const SOURCES = [
  { name: 'CrossRef', search: searchCrossRef, get: getCrossRefByDOI },
  { name: 'OpenAlex', search: searchOpenAlex, get: getOpenAlexByDOI },
  { name: 'Semantic Scholar', search: searchSemantic, get: getSemanticById },
  { name: 'Europe PMC', search: searchEuropePMC, get: getEuropePMCByDOI },
  { name: 'PubMed', search: searchPubmed, get: getPubmedById },
  { name: 'arXiv', search: searchArxiv, get: getArxivById },
  { name: 'Zenodo', search: searchZenodo, get: getZenodoByDOI },
  { name: 'SciELO', search: searchScielo, get: getScieloByDOI },
  { name: 'DOAJ', search: searchDoaj, get: getDoajByDOI },
  { name: 'BASE', search: searchBase, get: getBaseByDOI },
  { name: 'CORE', search: searchCore, get: getCoreByDOI },
  { name: 'HAL', search: searchHal, get: getHalByDOI }
]

export async function searchAll(query, rowsPerSource = 5) {
  const results = []
  const seen = new Set()

  for (const source of SOURCES) {
    try {
      const papers = await source.search(query, rowsPerSource)
      for (const p of papers) {
        const key = p.doi || p.title?.toLowerCase().slice(0, 60)
        if (key && !seen.has(key)) {
          seen.add(key)
          results.push(p)
        }
      }
    } catch (e) {
      console.error(`[${source.name}] search error:`, e.message)
    }
  }

  return results.sort((a, b) => {
    const aScore = a.pdfUrl ? (a.source === 'arXiv' ? 2 : 1) : 0
    const bScore = b.pdfUrl ? (b.source === 'arXiv' ? 2 : 1) : 0
    if (bScore !== aScore) return bScore - aScore
    return (String(b.year || '')).localeCompare(String(a.year || ''))
  })
}

export async function getPaper(doi) {
  const cleanDoi = doi.replace('https://doi.org/', '').replace('arxiv.org/abs/', '').replace('.pdf', '')
  for (const source of SOURCES) {
    try {
      const result = await source.get(cleanDoi)
      if (result && result.title !== 'No title') return result
    } catch {}
  }
  return null
}

export async function findPdf(doi) {
  const cleanDoi = doi.replace('https://doi.org/', '')

  const candidates = []

  for (const source of SOURCES.slice(0, 5)) {
    try {
      const paper = await source.get(cleanDoi)
      if (paper?.pdfUrl) candidates.push({ url: paper.pdfUrl, from: source.name })
    } catch {}
  }

  try {
    const unpaywallUrl = await findPdfUrl(cleanDoi)
    if (unpaywallUrl && !unpaywallUrl.includes('doi.org/')) {
      candidates.unshift({ url: unpaywallUrl, from: 'Unpaywall' })
    }
  } catch {}

  if (candidates.length) return candidates[0].url

  return `https://doi.org/${cleanDoi}`
}

export function getSources() {
  return SOURCES.map(s => s.name)
}