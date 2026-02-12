import { Link, useLocation } from 'react-router-dom'
import { useSession } from '../contexts/SessionContext'

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/flashcards', label: 'Flashcards' },
  { to: '/quiz', label: 'Quiz' },
]

export default function Navigation() {
  const location = useLocation()
  const { session, resetSession } = useSession()
  const hasSession = session.correct > 0 || session.wrong > 0

  return (
    <nav className="bg-gray-800 p-4 text-white">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-6">
          {navLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={
                location.pathname === to
                  ? 'text-blue-400 font-semibold'
                  : 'text-gray-300 hover:text-white'
              }
            >
              {label}
            </Link>
          ))}
        </div>
        {hasSession && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400">Session:</span>
            <span className="text-green-400">{session.correct} ✓</span>
            <span className="text-red-400">{session.wrong} ✗</span>
            <button
              onClick={resetSession}
              className="text-gray-400 hover:text-white text-xs ml-1"
              title="Reset session"
            >
              Reset
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
