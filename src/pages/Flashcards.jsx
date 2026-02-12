import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import studyData from '../data/studyData'

export default function Flashcards() {
  const [searchParams] = useSearchParams()
  const domainFromUrl = searchParams.get('domain') || 'all'

  const [flashcards, setFlashcards] = useState([])
  const [filteredCards, setFilteredCards] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [filterValue, setFilterValue] = useState(domainFromUrl)

  useEffect(() => {
    setFilterValue(domainFromUrl)
  }, [domainFromUrl])

  useEffect(() => {
    setFlashcards(studyData.flashcards)
  }, [])

  useEffect(() => {
    if (filterValue === 'all') {
      setFilteredCards(flashcards)
    } else {
      setFilteredCards(flashcards.filter((c) => c.domain === filterValue))
    }
    setCurrentIndex(0)
    setIsFlipped(false)
  }, [flashcards, filterValue])

  const currentCard = filteredCards[currentIndex]
  const total = filteredCards.length

  const goNext = () => {
    if (currentIndex < total - 1) {
      setCurrentIndex((i) => i + 1)
      setIsFlipped(false)
    }
  }

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1)
      setIsFlipped(false)
    }
  }

  if (total === 0) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <p className="text-gray-400">No flashcards to display. Select a domain.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Flashcards</h1>
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
          Card {currentIndex + 1} / {total}
        </p>

        <div
          onClick={() => setIsFlipped((f) => !f)}
          className="bg-gray-800 border border-gray-600 rounded-lg p-8 min-h-[280px] cursor-pointer hover:border-blue-500 transition-colors flex items-center justify-center"
        >
          <div className="text-center w-full">
            {isFlipped ? (
              <p className="text-lg">{currentCard.answer}</p>
            ) : (
              <p className="text-lg font-medium">{currentCard.question}</p>
            )}
            <p className="text-gray-500 text-sm mt-4">Click to flip</p>
          </div>
        </div>

        <div className="flex gap-4 mt-6 justify-center">
          <button
            onClick={goPrev}
            disabled={currentIndex === 0}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
          >
            Previous
          </button>
          <button
            onClick={goNext}
            disabled={currentIndex === total - 1}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
