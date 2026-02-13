import baseStudyData from '../../SECPLUS_COMPLETE_STUDY_DATA.json'
import flashcardsGenerated from './flashcards.generated.json'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

let questionsGenerated = null
let practiceQuestionsStatic = null
try {
  questionsGenerated = (await import('./questions.generated.json')).default
} catch {
  questionsGenerated = null
}
try {
  practiceQuestionsStatic = (await import('./practice_questions.static.json')).default
} catch {
  practiceQuestionsStatic = null
}

function getPracticeQuestions() {
  const generated = []
  if (questionsGenerated?.questions?.length) {
    for (const q of questionsGenerated.questions.filter((q) => q.type === 'mcq')) {
      const correctAnswer = q.choices?.[q.answerIndex]
      const options = shuffle([...(q.choices ?? [])])
      const correct_index = correctAnswer != null
        ? options.findIndex((opt) => opt === correctAnswer)
        : 0
      generated.push({
        id: q.id,
        question: q.prompt,
        options,
        correct_index: correct_index >= 0 ? correct_index : 0,
        correct_answer: correctAnswer,
        explanation: q.explanation ?? correctAnswer,
        domain: q.domain ?? 'all',
      })
    }
  }
  const staticQuestions = (practiceQuestionsStatic?.questions ?? []).map((q) => {
    const opts = q.options ?? []
    const correctAnswer = opts[q.correct_index ?? 0]
    const options = shuffle([...opts])
    const correct_index = correctAnswer != null ? options.findIndex((opt) => opt === correctAnswer) : 0
    return {
      ...q,
      options,
      correct_index: correct_index >= 0 ? correct_index : 0,
    }
  })
  const combined = [...staticQuestions, ...generated]
  if (combined.length > 0) return shuffle(combined)
  return !isBaseArray && baseStudyData?.practice_questions ? shuffle(baseStudyData.practice_questions) : []
}

// Support multiple data formats (user may have replaced the JSON files)
const isBaseArray = Array.isArray(baseStudyData)
const baseStats = !isBaseArray && baseStudyData?.stats ? baseStudyData.stats : null

// Get flashcards from generated file or base
const genCards = flashcardsGenerated?.cards ?? flashcardsGenerated?.flashcards ?? []
const genCount = flashcardsGenerated?.count ?? flashcardsGenerated?.total_flashcards ?? genCards.length

const rawFlashcards = genCards.length > 0
  ? genCards.map((c) => ({
      id: c.id ?? `card-${c.question?.slice(0, 8)}`,
      question: c.question ?? c.front,
      answer: c.answer ?? c.back,
      domain: c.domain ?? 'all',
      domain_name: c.domain_name ?? 'All Domains',
      section: c.section,
    }))
  : isBaseArray
    ? baseStudyData.map((c, i) => ({
        id: `card-${i}`,
        question: c.front ?? c.question,
        answer: c.back ?? c.answer,
        domain: 'all',
        domain_name: 'All Domains',
      }))
    : baseStudyData?.flashcards ?? []

const flashcards = shuffle(rawFlashcards)

const totalFlashcards = flashcards.length

const flashcardsByDomain = flashcards.reduce((acc, c) => {
  const d = String(c.domain ?? 'all')
  acc[d] = (acc[d] ?? 0) + 1
  return acc
}, {})

const defaultByDomain = [
  { domain: '1', name: 'General Security Concepts', flashcards: 0, questions: 0 },
  { domain: '2', name: 'Threats, Vulnerabilities, and Mitigations', flashcards: 0, questions: 0 },
  { domain: '3', name: 'Security Architecture', flashcards: 0, questions: 0 },
  { domain: '4', name: 'Operations and Incident Response', flashcards: 0, questions: 0 },
  { domain: '5', name: 'Governance, Risk, and Compliance', flashcards: 0, questions: 0 },
]

const byDomain = baseStats?.by_domain
  ? baseStats.by_domain.map((d) => ({
      ...d,
      flashcards: flashcardsByDomain[d.domain] ?? (flashcardsGenerated?.by_domain?.find((fd) => fd.domain === d.domain)?.flashcards) ?? Math.floor(totalFlashcards / 5),
    }))
  : defaultByDomain.map((d) => ({
      ...d,
      flashcards: flashcardsByDomain[d.domain] ?? Math.floor(totalFlashcards / 5),
    }))

const practice_questions = getPracticeQuestions()
const totalQuestions = practice_questions.length

const questionsByDomain = practice_questions.reduce((acc, q) => {
  const d = String(q.domain ?? 'all')
  acc[d] = (acc[d] ?? 0) + 1
  return acc
}, {})

const stats = {
  total_flashcards: totalFlashcards,
  total_questions: totalQuestions || (baseStats?.total_questions ?? 0),
  by_domain: byDomain.map((d) => ({
    ...d,
    questions: questionsByDomain[d.domain] ?? (totalQuestions ? Math.floor(totalQuestions / 5) : (d.questions ?? 0)),
  })),
}

const domains = !isBaseArray && baseStudyData?.domains
  ? baseStudyData.domains
  : byDomain.map((d) => ({ domain_num: d.domain, name: d.name, sections: [] }))

export default {
  metadata: !isBaseArray && baseStudyData?.metadata ? baseStudyData.metadata : { source: 'Security+ Study', exam: 'SY0-701' },
  domains,
  flashcards,
  practice_questions,
  stats,
}
