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
import { searchAll as searchGS, getPaper as getGS, findPdfUrl as findPdfGS, getCookieCount, setCookies } from './googlescholar.js'

const FALLBACK_SOURCES = [
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
  const seen = new Set()
  const results = []

  // Google Scholar first
  try {
    const gsResults = await searchGS(query, rowsPerSource * 2)
    for (const p of gsResults) {
      const key = p.doi || p.title?.toLowerCase().slice(0, 60)
      if (key && !seen.has(key)) {
        seen.add(key)
        results.push(p)
      }
    }
  } catch (e) {
    console.error('[GoogleScholar] search error:', e.message)
  }

  // Fallback sources for extra coverage
  for (const source of FALLBACK_SOURCES) {
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
  const cleanDoi = doi.replace('https://doi.org/', '').replace('arxiv.org/abs/', '').replace('arxiv.org/', '').replace('pubmed.ncbi.nlm.nih.gov/', '').replace('.pdf', '')

  // Google Scholar first
  try {
    const result = await getGS(cleanDoi)
    if (result && result.title) return { ...result, url: result.url || `https://doi.org/${cleanDoi}` }
  } catch (e) {
    console.error('[GoogleScholar] getPaper error:', e.message)
  }

  // Fallback sources
  for (const source of FALLBACK_SOURCES) {
    try {
      const result = await source.get(cleanDoi)
      if (result && result.title !== 'No title') return result
    } catch {}
  }
  return null
}

export async function findPdf(doi) {
  const cleanDoi = doi.replace('https://doi.org/', '').replace('pubmed.ncbi.nlm.nih.gov/', '').replace('arxiv.org/abs/', '').replace('arxiv.org/', '').replace('.pdf', '')
  const candidates = []

  // Google Scholar first
  try {
    const gsPdf = await findPdfGS(cleanDoi)
    if (gsPdf) candidates.push({ url: gsPdf, from: 'Google Scholar' })
  } catch {}

  // Unpaywall
  try {
    const unpaywallUrl = await findPdfUrl(cleanDoi)
    if (unpaywallUrl && !unpaywallUrl.includes('doi.org/')) {
      candidates.push({ url: unpaywallUrl, from: 'Unpaywall' })
    }
  } catch {}

  // First 5 fallback sources
  for (const source of FALLBACK_SOURCES.slice(0, 5)) {
    try {
      const paper = await source.get(cleanDoi)
      if (paper?.pdfUrl) candidates.push({ url: paper.pdfUrl, from: source.name })
    } catch {}
  }

  if (candidates.length) return candidates[0].url

  return `https://doi.org/${cleanDoi}`
}

export function getSources() {
  return ['Google Scholar', ...FALLBACK_SOURCES.map(s => s.name)]
}

export { getCookieCount, setCookies }