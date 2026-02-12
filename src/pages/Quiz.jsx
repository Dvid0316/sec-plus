import { useState, useEffect } from 'react'
import studyData from '../data/studyData'
import { useSession } from '../contexts/SessionContext'

export default function Quiz() {
  const { recordAnswer } = useSession()
  const [questions, setQuestions] = useState([])
  const [filteredQuestions, setFilteredQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedIndex, setSelectedIndex] = useState(null)
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const [filterValue, setFilterValue] = useState('all')

  useEffect(() => {
    setQuestions(studyData.practice_questions)
  }, [])

  useEffect(() => {
    if (filterValue === 'all') {
      setFilteredQuestions(questions)
    } else {
      setFilteredQuestions(questions.filter((q) => q.domain === filterValue))
    }
    setCurrentIndex(0)
    setSelectedIndex(null)
    setShowResult(false)
    setScore({ correct: 0, total: 0 })
  }, [questions, filterValue])

  const currentQuestion = filteredQuestions[currentIndex]
  const total = filteredQuestions.length

  const handleSelect = (index) => {
    if (showResult) return
    setSelectedIndex(index)
    const isCorrect = index === currentQuestion.correct_index
    setShowResult(true)
    recordAnswer(isCorrect)
    setScore((s) => ({
      correct: s.correct + (isCorrect ? 1 : 0),
      total: s.total + 1,
    }))
  }

  const handleNext = () => {
    if (currentIndex < total - 1) {
      setCurrentIndex((i) => i + 1)
      setSelectedIndex(null)
      setShowResult(false)
    }
  }

  const getOptionStyle = (index) => {
    if (!showResult) {
      return selectedIndex === index
        ? 'bg-blue-600 border-blue-500'
        : 'bg-gray-800 border-gray-600 hover:border-gray-500'
    }
    if (index === currentQuestion.correct_index) {
      return 'bg-green-900/50 border-green-500'
    }
    if (index === selectedIndex && index !== currentQuestion.correct_index) {
      return 'bg-red-900/50 border-red-500'
    }
    return 'bg-gray-800 border-gray-600 opacity-60'
  }

  if (total === 0) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <p className="text-gray-400">No questions to display. Select a domain.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Quiz</h1>
          <select
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            className="bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm"
          >
            <option value="all">All Domains</option>
            {studyData.stats.by_domain.map((d) => (
              <option key={d.domain} value={d.domain}>
                Domain {d.domain}: {d.name}
              </option>
            ))}
          </select>
        </div>

        <p className="text-gray-400 mb-4">
          Question {currentIndex + 1} / {total} • Score: {score.correct}/{score.total}
        </p>

        <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 mb-6">
          <p className="text-lg font-medium mb-6">{currentQuestion.question}</p>

          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleSelect(index)}
                disabled={showResult}
                className={`w-full text-left p-4 rounded-lg border-2 transition-colors break-words whitespace-normal ${getOptionStyle(index)} ${!showResult ? 'cursor-pointer' : 'cursor-default'}`}
              >
                {option}
              </button>
            ))}
          </div>

          {showResult && (
            <div className="mt-6 p-4 bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-400 mb-1">Explanation:</p>
              <p className="text-gray-300">{currentQuestion.explanation}</p>
            </div>
          )}
        </div>

        {showResult && (
          <button
            onClick={handleNext}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium"
          >
            {currentIndex < total - 1 ? 'Next Question' : 'Finish Quiz'}
          </button>
        )}
      </div>
    </div>
  )
}
