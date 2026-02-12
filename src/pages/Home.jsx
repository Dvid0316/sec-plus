import { Link, useNavigate } from 'react-router-dom'
import studyData from '../data/studyData'

export default function Home() {
  const navigate = useNavigate()
  const { stats, domains } = studyData
  const { by_domain } = stats

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 md:p-8">
      <h1 className="text-4xl font-bold text-blue-500 mb-2">
        Security+ Study App
      </h1>
      <p className="text-gray-300 mb-8">
        CompTIA Security+ SY0-701 • {stats.total_flashcards} flashcards • {stats.total_questions} practice questions
      </p>

      <div className="flex gap-4 mb-8">
        <button
          onClick={() => navigate('/flashcards')}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium"
        >
          Start Studying
        </button>
        <button
          onClick={() => navigate('/quiz')}
          className="px-6 py-3 bg-green-600 hover:bg-green-500 rounded-lg font-medium"
        >
          Take Quiz
        </button>
      </div>

      <h2 className="text-xl font-semibold mb-4">Study by Domain</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {by_domain.map((domain) => (
          <div
            key={domain.domain}
            onClick={() => navigate(`/flashcards?domain=${domain.domain}`)}
            className="bg-gray-800 p-5 rounded-lg border border-gray-700 cursor-pointer hover:border-blue-500 hover:bg-gray-750 transition-colors"
          >
            <h3 className="font-semibold text-lg text-blue-400 mb-2">
              Domain {domain.domain}: {domain.name}
            </h3>
            <p className="text-gray-400 text-sm">
              {domain.flashcards} flashcards • {domain.questions} practice questions
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
