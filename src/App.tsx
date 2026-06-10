import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useAppStore } from './store/useAppStore'
import HomePage from './pages/HomePage'
import PendingPatientsPage from './pages/PendingPatientsPage'
import PaymentsPage from './pages/PaymentsPage'
import DuesPage from './pages/DuesPage'
import LocationsPage from './pages/LocationsPage'

function App() {
  const archiveDayIfNeeded = useAppStore((s) => s.archiveDayIfNeeded)

  /* Archive check on mount (every page load / refresh) */
  useEffect(() => {
    archiveDayIfNeeded()
  }, [archiveDayIfNeeded])

  /* Re-check when the user returns to the tab (handles overnight / multi-day gaps) */
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        archiveDayIfNeeded()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [archiveDayIfNeeded])

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/pending-patients" element={<PendingPatientsPage />} />
      <Route path="/payments" element={<PaymentsPage />} />
      <Route path="/dues" element={<DuesPage />} />
      <Route path="/locations" element={<LocationsPage />} />
    </Routes>
  )
}

export default App
