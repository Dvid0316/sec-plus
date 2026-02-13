#!/usr/bin/env node
/**
 * Merge new flashcards/questions into existing study data.
 * New items are prepended (appear at the top).
 *
 * Usage:
 *   node scripts/mergeStudyData.mjs --new path/to/new-cards.json
 *   node scripts/mergeStudyData.mjs --new new.json --out SECPLUS_COMPLETE_STUDY_DATA.json
 *   node scripts/mergeStudyData.mjs --new new.json --no-dedupe   # keep exact duplicates
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const DEFAULT_EXISTING = 'SECPLUS_COMPLETE_STUDY_DATA.json'

function getArg(name, fallback = null) {
  const idx = process.argv.indexOf(name)
  if (idx === -1) return fallback
  return process.argv[idx + 1] ?? fallback
}

function hasFlag(name) {
  return process.argv.includes(name)
}

function domainNameToNum(name) {
  const m = String(name ?? '').match(/(\d)/)
  return m ? m[1] : null
}

function toCards(data) {
  if (Array.isArray(data)) return data.map((c) => ({ ...c, _domain: null }))
  if (Array.isArray(data?.cards)) return data.cards.map((c) => ({ ...c, _domain: null }))
  if (Array.isArray(data?.flashcards)) return data.flashcards.map((c) => ({ ...c, _domain: null }))
  if (data?.flashcards && typeof data.flashcards === 'object' && !Array.isArray(data.flashcards)) {
    const out = []
    for (const [domainName, arr] of Object.entries(data.flashcards)) {
      if (!Array.isArray(arr)) continue
      const domainNum = domainNameToNum(domainName)
      for (const c of arr) {
        out.push({ ...c, _domain: domainNum })
      }
    }
    return out
  }
  throw new Error('Input must be an array, { cards }, { flashcards }, or { flashcards: { "Domain N": [...] } }')
}

function normalize(c) {
  const front = String(c?.front ?? c?.question ?? '').trim()
  const back = String(c?.back ?? c?.answer ?? '').trim()
  if (!front || !back) return null
  let tags = Array.isArray(c?.tags) ? [...c.tags] : ['security-plus', 'sy0-701']
  const domain = c._domain
  if (domain && !tags.includes(`domain-${domain}`)) {
    tags = [...tags, `domain-${domain}`]
  }
  const card = { front, back, tags }
  if (domain) card.domain = domain
  return card
}

function dedupeByFrontBack(cards) {
  const seen = new Set()
  const out = []
  for (const c of cards) {
    const key = `${(c.front ?? '').toLowerCase()}||${(c.back ?? '').toLowerCase()}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(c)
  }
  return out
}

function extractPracticeQuestions(data) {
  const pq = data?.practice_questions
  if (!pq || typeof pq !== 'object' || Array.isArray(pq)) return []
  const result = []
  const order = ['A', 'B', 'C', 'D']
  for (const [domainName, arr] of Object.entries(pq)) {
    if (!Array.isArray(arr)) continue
    const domain = domainNameToNum(domainName) ?? '1'
    for (let i = 0; i < arr.length; i++) {
      const q = arr[i]
      const opts = q?.options
      if (!opts || typeof opts !== 'object') continue
      const options = order.map((k) => opts[k]).filter(Boolean)
      if (options.length < 2) continue
      const correctKey = String(q?.correct ?? 'A').toUpperCase()
      const correctIndex = order.indexOf(correctKey)
      const idx = correctIndex >= 0 ? correctIndex : 0
      result.push({
        id: `static-${domain}-${i}`,
        question: String(q?.question ?? '').trim(),
        options: options.length ? options : [opts.A, opts.B, opts.C, opts.D].filter(Boolean),
        correct_index: Math.min(idx, options.length - 1),
        explanation: String(q?.explanation ?? '').trim() || options[idx],
        domain,
      })
    }
  }
  return result
}

async function main() {
  const newPath = getArg('--new')
  const outPath = getArg('--out', DEFAULT_EXISTING)
  const existingPath = getArg('--existing', DEFAULT_EXISTING)
  const dedupe = !hasFlag('--no-dedupe')

  if (!newPath) {
    console.error('Usage: node scripts/mergeStudyData.mjs --new <path-to-new-json> [--out <output>] [--existing <current-file>] [--no-dedupe]')
    process.exit(1)
  }

  const root = process.cwd()
  const absNew = path.resolve(root, newPath)
  const absOut = path.resolve(root, outPath)
  const absExisting = path.resolve(root, existingPath)

  const newRaw = await fs.readFile(absNew, 'utf-8')
  const newData = JSON.parse(newRaw)
  const newCards = toCards(newData).map(normalize).filter(Boolean)

  let existingCards = []
  try {
    const existingRaw = await fs.readFile(absExisting, 'utf-8')
    const existingData = JSON.parse(existingRaw)
    existingCards = toCards(existingData).map(normalize).filter(Boolean)
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.log(`Existing file not found, using new file only.`)
    } else throw err
  }

  const merged = [...newCards, ...existingCards]
  const result = dedupe ? dedupeByFrontBack(merged) : merged

  await fs.writeFile(absOut, JSON.stringify(result, null, 2), 'utf-8')

  console.log(`Merged ${newCards.length} new + ${existingCards.length} existing → ${result.length} total`)
  console.log(`Output: ${absOut}`)

  const practiceQuestions = extractPracticeQuestions(newData)
  if (practiceQuestions.length > 0) {
    const pqPath = path.resolve(root, 'src/data/practice_questions.static.json')
    await fs.mkdir(path.dirname(pqPath), { recursive: true })
    await fs.writeFile(pqPath, JSON.stringify({ questions: practiceQuestions, count: practiceQuestions.length }, null, 2), 'utf-8')
    console.log(`Extracted ${practiceQuestions.length} practice questions → ${pqPath}`)
  }
}

main().catch((err) => {
  console.error(err?.message ?? err)
  process.exit(1)
})
