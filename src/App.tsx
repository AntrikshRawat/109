import { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useAppStore } from './store/useAppStore'
import { migrateFromLocalStorage, type MigrationResult } from './store/indexedDB'
import HomePage from './pages/HomePage'
import PendingPatientsPage from './pages/PendingPatientsPage'
import PaymentsPage from './pages/PaymentsPage'
import DuesPage from './pages/DuesPage'
import LocationsPage from './pages/LocationsPage'

function App() {
  const archiveDayIfNeeded = useAppStore((s) => s.archiveDayIfNeeded)
  const loadDailyHistory = useAppStore((s) => s.loadDailyHistory)
  const [isReady, setIsReady] = useState(false)
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null)

  /* Migration + load history + archive check on mount */
  useEffect(() => {
    const init = async () => {
      try {
        // Step 1: Migrate old localStorage dailyHistory → IndexedDB (if needed)
        const result = await migrateFromLocalStorage()
        setMigrationResult(result)

        if (result.success) {
          console.log('📊 Migration status:', result)
        } else {
          console.error('❌ Migration failed:', result.error)
        }

        // Step 2: Load daily history from IndexedDB into memory
        await loadDailyHistory()

        // Step 3: Archive previous day if needed (saves to IndexedDB first)
        await archiveDayIfNeeded()
      } catch (err) {
        console.error('App initialization error:', err)
      } finally {
        setIsReady(true)
      }
    }
    init()
  }, [archiveDayIfNeeded, loadDailyHistory])

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

  /* Show loading state during initialization */
  if (!isReady) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-surface-950 text-surface-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-surface-600 border-t-primary-400" />
          <p className="text-sm text-surface-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Migration success banner (only on first migration, not already-migrated) */}
      {migrationResult && !migrationResult.alreadyMigrated && migrationResult.snapshotsMigrated > 0 && migrationResult.success && (
        <div className="fixed top-0 left-0 right-0 z-50 border-b border-emerald-500/30 bg-emerald-950/90 px-4 py-3 text-center text-sm text-emerald-200 backdrop-blur-sm">
          <span className="mr-2">✅</span>
          Migration complete: <strong>{migrationResult.snapshotsMigrated}</strong> daily records moved to IndexedDB.
          {' '}Backup saved as{' '}
          <code className="rounded bg-emerald-900/50 px-1.5 py-0.5 text-xs">
            &quot;app-storage-v6-backup&quot;
          </code>{' '}
          in localStorage.
          <button
            onClick={() => setMigrationResult(null)}
            className="ml-4 cursor-pointer rounded-md border border-emerald-500/30 px-2 py-0.5 text-xs transition hover:bg-emerald-800/50"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Migration failure banner */}
      {migrationResult && !migrationResult.success && (
        <div className="fixed top-0 left-0 right-0 z-50 border-b border-red-500/30 bg-red-950/90 px-4 py-3 text-center text-sm text-red-200 backdrop-blur-sm">
          <span className="mr-2">❌</span>
          Migration failed: {migrationResult.error}. Original data is safe in localStorage.
          <button
            onClick={() => setMigrationResult(null)}
            className="ml-4 cursor-pointer rounded-md border border-red-500/30 px-2 py-0.5 text-xs transition hover:bg-red-800/50"
          >
            Dismiss
          </button>
        </div>
      )}

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/pending-patients" element={<PendingPatientsPage />} />
        <Route path="/payments" element={<PaymentsPage />} />
        <Route path="/dues" element={<DuesPage />} />
        <Route path="/locations" element={<LocationsPage />} />
      </Routes>
    </>
  )
}

export default App
