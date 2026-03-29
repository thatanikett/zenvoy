import { useCallback, useEffect, useState } from 'react'
import LandingPage from './components/LandingPage'
import HowItWorksPage from './components/HowItWorksPage'
import MapExperience from './components/MapExperience'

const APP_ROUTE = '/app'
const HOW_ROUTE = '/how-it-works'

export default function App() {
  const [pathname, setPathname] = useState(() => window.location.pathname || '/')

  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname || '/')
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

  const navigate = useCallback((nextPath) => {
    if (window.location.pathname === nextPath) return
    window.history.pushState({}, '', nextPath)
    setPathname(nextPath)
  }, [])

  if (pathname === APP_ROUTE) {
    return <MapExperience />
  }

  if (pathname === HOW_ROUTE) {
    return <HowItWorksPage onNavigate={navigate} />
  }

  return <LandingPage onLaunchApp={() => navigate(APP_ROUTE)} onNavigate={navigate} />
}
