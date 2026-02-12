import { createContext, useContext, useState, useEffect } from 'react'

const STORAGE_KEY = 'secplus-session'

const SessionContext = createContext(null)

export function SessionProvider({ children }) {
  const [session, setSession] = useState(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY)
      if (stored) {
        const { correct, wrong } = JSON.parse(stored)
        return { correct: correct ?? 0, wrong: wrong ?? 0 }
      }
    } catch {}
    return { correct: 0, wrong: 0 }
  })

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  }, [session])

  const recordAnswer = (isCorrect) => {
    setSession((s) => ({
      correct: s.correct + (isCorrect ? 1 : 0),
      wrong: s.wrong + (isCorrect ? 0 : 1),
    }))
  }

  const resetSession = () => {
    setSession({ correct: 0, wrong: 0 })
  }

  return (
    <SessionContext.Provider value={{ session, recordAnswer, resetSession }}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used within SessionProvider')
  return ctx
}
