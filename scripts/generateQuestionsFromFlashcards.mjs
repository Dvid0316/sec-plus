#!/usr/bin/env node
/**
 * Generate practice questions from flashcards.
 * Input: flashcards.generated.json
 * Output: questions.generated.json
 * No original exam questions copied—all generated from flashcards.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

function parseArgs() {
  const args = process.argv.slice(2)
  const getVal = (key) => {
    const i = args.indexOf(key)
    return i >= 0 && args[i + 1] ? args[i + 1] : null
  }
  return {
    in: getVal('--in') ?? path.join(ROOT, 'src', 'data', 'flashcards.generated.json'),
    out: getVal('--out') ?? path.join(ROOT, 'src', 'data', 'questions.generated.json'),
    max: parseInt(getVal('--max') ?? '600', 10) || 600,
  }
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function pickRandom(arr, n, exclude = []) {
  const filtered = arr.filter((x) => !exclude.includes(x))
  return shuffle(filtered).slice(0, n)
}

// Distractor bank: term -> [plausible wrong answers]
const DISTRACTOR_BANK = {
  dmarc: ['SPF', 'DKIM', 'S/MIME'],
  spf: ['DMARC', 'DKIM', 'BGP'],
  dkim: ['SPF', 'DMARC', 'DNSSEC'],
  mtbf: ['MTTR', 'RTO', 'RPO'],
  mttr: ['MTBF', 'RTO', 'RPO'],
  rto: ['RPO', 'MTBF', 'MTTR'],
  rpo: ['RTO', 'MTBF', 'MTTR'],
  sle: ['ALE', 'ARO', 'EF'],
  ale: ['SLE', 'ARO', 'EF'],
  aro: ['SLE', 'ALE', 'EF'],
  phishing: ['Spear phishing', 'Whaling', 'Vishing'],
  'spear phishing': ['Phishing', 'Whaling', 'Vishing'],
  whaling: ['Phishing', 'Spear phishing', 'Vishing'],
  vishing: ['Phishing', 'Smishing', 'Spear phishing'],
  smishing: ['Phishing', 'Vishing', 'Spear phishing'],
  ids: ['IPS', 'SIEM', 'Firewall'],
  ips: ['IDS', 'SIEM', 'Firewall'],
  hashing: ['Encryption', 'Encoding', 'Obfuscation'],
  encryption: ['Hashing', 'Encoding', 'Obfuscation'],
  symmetric: ['Asymmetric', 'Hashing', 'PKI'],
  asymmetric: ['Symmetric', 'Hashing', 'PKI'],
  tpm: ['HSM', 'UEFI', 'Secure Boot'],
  hsm: ['TPM', 'UEFI', 'Secure Boot'],
  reconnaissance: ['Scanning', 'Enumeration', 'Exploitation'],
  'passive reconnaissance': ['Active reconnaissance', 'Scanning', 'Enumeration'],
  'active reconnaissance': ['Passive reconnaissance', 'Scanning', 'Exploitation'],
  siem: ['IDS', 'IPS', 'SOAR'],
  soar: ['SIEM', 'IDS', 'IPS'],
  sso: ['MFA', 'Federation', 'LDAP'],
  mfa: ['SSO', 'Federation', 'LDAP'],
  ldap: ['RADIUS', 'Kerberos', 'SAML'],
  radius: ['LDAP', 'Kerberos', 'TACACS+'],
  kerberos: ['LDAP', 'RADIUS', 'SAML'],
  xss: ['SQL injection', 'CSRF', 'Buffer overflow'],
  'sql injection': ['XSS', 'CSRF', 'LDAP injection'],
  csrf: ['XSS', 'SQL injection', 'Clickjacking'],
  ransomware: ['Spyware', 'Trojan', 'Worm'],
  trojan: ['Ransomware', 'Worm', 'Spyware'],
  worm: ['Virus', 'Trojan', 'Ransomware'],
  virus: ['Worm', 'Trojan', 'Ransomware'],
}

// SY0-701 domain keywords - must match generateFlashcards.mjs
const DOMAIN_KEYWORDS = [
  { domain: '2', keywords: /\b(phishing|ransomware|malware|trojan|worm|virus|reconnaissance|vulnerability|exploit|social engineering|on-path|SQL injection|XSS|CSRF|threat actor|organized crime|nation-state|brute force|DDoS|keylogger|honeypot|watering hole|OSINT|penetration test|buffer overflow|replay attack|DNS poisoning|smishing|hacktivist|enumeration|rogue access point)\b/i },
  { domain: '3', keywords: /\b(DMARC|SPF|DKIM|firewall|network security|identity|authentication|federation|LDAP|RADIUS|Kerberos|MFA|SSO|SAML|VPN|NAT|segmentation|VLAN|SASE|802\.1X|IPsec|WPA3|WAF|load balancer|jump server|containerization|blockchain|digital signature|OCSP|HSM|secure enclave|TPM|biometric|AAA)\b/i },
  { domain: '4', keywords: /\b(incident response|forensics|SIEM|SOAR|monitoring|recovery|backup|root cause|MTBF|MTTR|RTO|RPO|BIA|IOC|containment|escalation|tabletop exercise|chain of custody|alert tuning|NetFlow|hardening|remediation|MDM|file integrity|FIM|DLP)\b/i },
  { domain: '5', keywords: /\b(policy|compliance|governance|audit|regulation|risk management|MOA|SLA|NDA|regulated|data owner|data custodian|due care|risk appetite|acceptance|self-assessment|responsibility matrix|conflict of interest|data sovereignty|privacy|user training|shadow IT|SLE|ALE|ARO|EF|exposure factor)\b/i },
  { domain: '1', keywords: /\b(CIA|confidentiality|integrity|availability|security controls|asset|zero trust|physical security|obfuscation|hashing|encryption|symmetric|asymmetric|PKI|non-repudiation|deterrent|detective|preventive|corrective|compensating|masking|tokenization|salting|least privilege|discretionary|access control|change management|gap analysis|mitigate)\b/i },
]

function inferDomain(card) {
  if (card.domain && String(card.domain).match(/^[1-5]$/)) return String(card.domain)
  const text = `${card.question ?? ''} ${card.answer ?? ''}`.toLowerCase()
  for (const { domain, keywords } of DOMAIN_KEYWORDS) {
    if (keywords.test(text)) return domain
  }
  return '1' // default to General Security Concepts
}

const SCENARIO_STEMS = [
  'A security analyst needs to explain the concept to management. Which of the following best describes',
  'During a security review, the team discusses a key concept. Which statement correctly defines',
  'An incident response document requires clear definitions. Which of the following accurately describes',
  'For the Security+ exam, a candidate must understand terminology. Which option best defines',
  'In a compliance audit, the auditor asks about a security concept. Which of the following is the correct definition of',
]

function extractTerm(question) {
  const m = question.match(/^What is\s+(.+?)\s*\??$/i)
  return m ? m[1].trim() : null
}

function getDistractors(correctAnswer, allAnswers, term) {
  const key = (term || correctAnswer)
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .slice(0, 50)
  const bankEntry = Object.entries(DISTRACTOR_BANK).find(([k]) => key.includes(k) || key.includes(k.replace(/\s+/g, ' ')))
  let pool = bankEntry ? bankEntry[1] : []

  if (pool.length < 3) {
    const correctNorm = correctAnswer.slice(0, 80)
    pool = allAnswers.filter((a) => a !== correctNorm && !correctAnswer.startsWith(a) && a.length > 15)
  }

  const exclude = [correctAnswer]
  let picked = pickRandom(pool, 3, exclude)
  if (picked.length < 3) {
    const extra = allAnswers.filter((a) => !exclude.includes(a) && !picked.includes(a) && a.length > 15)
    for (const e of shuffle(extra)) {
      if (picked.length >= 3) break
      if (e && !picked.includes(e)) picked.push(e)
    }
  }
  return picked.slice(0, 3)
}

function generateMcq(card, allAnswers, index) {
  const correctAnswer = card.answer.replace(/\s+/g, ' ').trim()
  const term = extractTerm(card.question)
  const distractors = getDistractors(correctAnswer, allAnswers, term)

  const stemIdx = index % SCENARIO_STEMS.length
  const stem = term
    ? `${SCENARIO_STEMS[stemIdx]} ${term}?`
    : `Which of the following best describes the concept in this definition: "${card.answer.slice(0, 60)}..."?`

  const choices = [correctAnswer, ...distractors].filter(Boolean)
  while (choices.length < 4) {
    const fallback = allAnswers.find((a) => !choices.includes(a) && a.length > 20)
    if (fallback) choices.push(fallback)
    else break
  }
  const shuffled = shuffle(choices.slice(0, 4))
  let answerIndex = shuffled.findIndex((c) => c === correctAnswer || (c && correctAnswer && c.trim() === correctAnswer.trim()))
  if (answerIndex < 0) {
    answerIndex = Math.floor(Math.random() * Math.min(4, shuffled.length))
    shuffled[answerIndex] = correctAnswer
  }

  const fullDefinition = card.answer.trim()
  const explanation = term
    ? `${term} is the correct answer. ${fullDefinition}`
    : `The correct answer is: ${fullDefinition}`

  return {
    id: `q-${card.id}-mcq`,
    sourceCardId: card.id,
    type: 'mcq',
    prompt: stem,
    choices: shuffled,
    answerIndex,
    explanation,
    domain: inferDomain(card),
    tags: card.tags ?? ['security-plus', 'sy0-701'],
    difficulty: 1 + (index % 3),
  }
}

function generateShort(card, index) {
  const term = extractTerm(card.question)
  if (!term) return null

  return {
    id: `q-${card.id}-short`,
    sourceCardId: card.id,
    type: 'short',
    prompt: `Define the following Security+ term: ${term}`,
    answer: card.answer,
    domain: inferDomain(card),
    tags: card.tags ?? ['security-plus', 'sy0-701'],
    difficulty: 1 + (index % 3),
  }
}

function main() {
  const { in: inPath, out: outPath, max } = parseArgs()

  const raw = fs.readFileSync(inPath, 'utf-8')
  const data = JSON.parse(raw)
  const cards = data.cards ?? data.flashcards ?? []
  const limited = cards.slice(0, max)

  const allAnswers = [...new Set(limited.map((c) => (c.answer ?? c.back ?? '').replace(/\s+/g, ' ').trim()).filter(Boolean))]

  const questions = []
  for (let i = 0; i < limited.length; i++) {
    const card = limited[i]
    const q = card.question ?? card.front
    const a = card.answer ?? card.back
    if (!q || !a || a.length < 10) continue

    questions.push(generateMcq({ ...card, question: q, answer: a }, allAnswers, i))

    const short = generateShort({ ...card, question: q, answer: a }, i)
    if (short && /^What is\s+.+\s*\??$/i.test(q)) {
      questions.push(short)
    }
  }

  const mcqs = questions.filter((q) => q.type === 'mcq')
  const QUESTION_TARGETS = { '1': 35, '2': 71, '3': 38, '4': 86, '5': 65 }
  const byDomain = {}
  for (const q of mcqs) {
    const d = String(q.domain ?? '1')
    if (!byDomain[d]) byDomain[d] = []
    byDomain[d].push(q)
  }
  const sampled = []
  for (const d of ['1', '2', '3', '4', '5']) {
    const pool = shuffle(byDomain[d] ?? [])
    const take = Math.min(QUESTION_TARGETS[d] ?? 0, pool.length)
    sampled.push(...pool.slice(0, take))
  }
  let need = 295 - sampled.length
  if (need > 0) {
    const remaining = mcqs.filter((q) => !sampled.includes(q))
    sampled.push(...shuffle(remaining).slice(0, need))
  }
  const finalMcqs = shuffle(sampled)

  const output = {
    generatedAt: new Date().toISOString(),
    count: finalMcqs.length,
    questions: finalMcqs,
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf-8')

  const dist = finalMcqs.reduce((acc, q) => {
    const d = String(q.domain ?? '1')
    acc[d] = (acc[d] ?? 0) + 1
    return acc
  }, {})
  console.log(`Generated ${finalMcqs.length} MCQs`)
  console.log(`Domain distribution: ${JSON.stringify(dist)}`)
  console.log(`Input:  ${inPath}`)
  console.log(`Output: ${outPath}`)
}

main()
