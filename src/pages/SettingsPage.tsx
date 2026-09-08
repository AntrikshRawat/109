import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import getOrInitializeSyncKey from '../services/syncKey'
import { performDailySync } from '../services/backup'
import { handleCloudRestore } from '../services/restore'

function SettingsPage() {
  const navigate = useNavigate()

  const [syncKey, setSyncKey] = useState('')
  const [restoreKey, setRestoreKey] = useState('')
  const [lastSyncDate, setLastSyncDate] = useState<string | null>(null)
  const [isBacking, setIsBacking] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [showCopied, setShowCopied] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    setSyncKey(getOrInitializeSyncKey())
    setLastSyncDate(localStorage.getItem('lastSyncDate'))
  }, [])

  const handleCopyKey = async () => {
    try {
      await navigator.clipboard.writeText(syncKey)
      setShowCopied(true)
      setTimeout(() => setShowCopied(false), 2000)
    } catch {
      // Fallback for browsers without clipboard API
      const el = document.createElement('textarea')
      el.value = syncKey
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setShowCopied(true)
      setTimeout(() => setShowCopied(false), 2000)
    }
  }

  const handleManualBackup = async () => {
    setIsBacking(true)
    setMessage(null)
    try {
      // Force a sync regardless of lastSyncDate
      localStorage.removeItem('lastSyncDate')
      await performDailySync()
      setLastSyncDate(localStorage.getItem('lastSyncDate'))
      setMessage({ type: 'success', text: 'Backup completed successfully!' })
    } catch {
      setMessage({ type: 'error', text: 'Backup failed. Check your connection.' })
    } finally {
      setIsBacking(false)
    }
  }

  const handleRestore = async () => {
    const keyToUse = restoreKey.trim()
    if (!keyToUse) {
      setMessage({ type: 'error', text: 'Please enter a sync key to restore from.' })
      return
    }

    const confirmed = window.confirm(
      'This will replace ALL your current data with the backup data. Are you sure?'
    )
    if (!confirmed) return

    setIsRestoring(true)
    setMessage(null)
    try {
      const success = await handleCloudRestore(keyToUse)
      if (success) {
        setMessage({ type: 'success', text: 'Data restored successfully! Reloading app...' })
        setTimeout(() => window.location.reload(), 1500)
      } else {
        setMessage({ type: 'error', text: 'Restore failed. The sync key may be invalid or no backup exists.' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Restore failed. Check your connection.' })
    } finally {
      setIsRestoring(false)
    }
  }

  return (
    <div className="relative min-h-dvh bg-surface-950 text-surface-50 font-sans">
      {/* ── Ambient background glows ─────────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="animate-pulse-glow absolute -left-32 top-0 h-[500px] w-[500px] rounded-full bg-primary-500/20 blur-[140px]" />
        <div className="animate-pulse-glow absolute -right-32 top-1/3 h-[400px] w-[400px] rounded-full bg-sky-500/15 blur-[120px]" style={{ animationDelay: '2s' }} />
      </div>

      {/* ── Page container ───────────────────────────────────────────── */}
      <div className="mx-auto flex max-w-lg flex-col gap-6 px-3 py-8 sm:px-5">

        {/* ── Back Button ────────────────────────────────────────────── */}
        <button
          id="btn-back"
          type="button"
          onClick={() => navigate('/')}
          className="flex w-fit cursor-pointer items-center gap-1.5 rounded-lg border border-surface-700/40 px-3 py-1.5 text-xs font-semibold text-surface-300 transition hover:border-primary-500/30 hover:text-primary-400"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
          </svg>
          Back
        </button>

        {/* ── Header ─────────────────────────────────────────────────── */}
        <header className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600/20 text-2xl">
            ⚙️
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-r from-surface-50 to-surface-300 bg-clip-text text-transparent">
              Sync &amp; Backup
            </span>
          </h1>
          <p className="mt-1.5 text-xs text-surface-400">
            Manage your cloud backup and restore data across devices
          </p>
          <div className="mx-auto mt-3 h-px w-20 bg-gradient-to-r from-transparent via-primary-500/60 to-transparent" />
        </header>

        {/* ── Status Banner ──────────────────────────────────────────── */}
        {message && (
          <div
            className={`animate-card-in rounded-xl border px-4 py-3 text-center text-sm backdrop-blur-sm ${
              message.type === 'success'
                ? 'border-emerald-500/30 bg-emerald-950/60 text-emerald-200'
                : 'border-rose-500/30 bg-rose-950/60 text-rose-200'
            }`}
          >
            <span className="mr-1.5">{message.type === 'success' ? '✅' : '❌'}</span>
            {message.text}
          </div>
        )}

        {/* ── Card 1 · Your Sync Key ─────────────────────────────────── */}
        <section
          className="animate-card-in rounded-2xl border border-surface-700/40 bg-surface-800/40 p-6 shadow-2xl shadow-primary-500/5 backdrop-blur-lg"
          style={{ animationDelay: '0.05s' }}
        >
          <div className="mb-4 flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600/20 text-base">
              🔑
            </span>
            <h2 className="text-lg font-bold tracking-wide">Your Sync Key</h2>
          </div>

          <p className="mb-3 text-xs leading-relaxed text-surface-400">
            This unique key links your data to the cloud. Save it somewhere safe — you'll need it to restore on another device.
          </p>

          <div className="flex items-center gap-2">
            <code
              id="sync-key-display"
              className="flex-1 overflow-x-auto rounded-lg border border-surface-700/40 bg-surface-900/80 px-3 py-2.5 text-xs font-mono tracking-wide text-primary-300 scrollbar-hide"
            >
              {syncKey}
            </code>
            <button
              id="btn-copy-key"
              type="button"
              onClick={handleCopyKey}
              className="cursor-pointer rounded-lg border border-surface-700/40 bg-surface-900/60 px-3 py-2.5 text-xs font-semibold text-surface-300 transition hover:border-primary-500/30 hover:text-primary-400 active:scale-95"
            >
              {showCopied ? '✓ Copied' : '📋 Copy'}
            </button>
          </div>

          {lastSyncDate && (
            <p className="mt-3 text-[10px] text-surface-500">
              Last synced: <span className="text-surface-400">{lastSyncDate}</span>
            </p>
          )}
        </section>

        {/* ── Card 2 · Manual Backup ─────────────────────────────────── */}
        <section
          className="animate-card-in rounded-2xl border border-surface-700/40 bg-surface-800/40 p-6 shadow-2xl shadow-emerald-500/5 backdrop-blur-lg"
          style={{ animationDelay: '0.12s' }}
        >
          <div className="mb-4 flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600/20 text-base">
              ☁️
            </span>
            <h2 className="text-lg font-bold tracking-wide">Cloud Backup</h2>
          </div>

          <p className="mb-4 text-xs leading-relaxed text-surface-400">
            Your data is automatically backed up daily. Use this button to trigger a manual backup right now.
          </p>

          <button
            id="btn-manual-backup"
            type="button"
            onClick={handleManualBackup}
            disabled={isBacking}
            className="w-full cursor-pointer rounded-xl border border-emerald-500/20 bg-emerald-600/15 px-4 py-3 text-sm font-bold text-emerald-300 transition hover:bg-emerald-600/25 hover:border-emerald-500/40 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isBacking ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-emerald-400/30 border-t-emerald-400" />
                Backing up...
              </span>
            ) : (
              '↑ Backup Now'
            )}
          </button>
        </section>

        {/* ── Card 3 · Restore Data ──────────────────────────────────── */}
        <section
          className="animate-card-in rounded-2xl border border-surface-700/40 bg-surface-800/40 p-6 shadow-2xl shadow-sky-500/5 backdrop-blur-lg"
          style={{ animationDelay: '0.19s' }}
        >
          <div className="mb-4 flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-600/20 text-base">
              ↓
            </span>
            <h2 className="text-lg font-bold tracking-wide">Restore Data</h2>
          </div>

          <p className="mb-3 text-xs leading-relaxed text-surface-400">
            Enter a sync key from another device to restore its backup here. This will <strong className="text-rose-400">replace all current data</strong>.
          </p>

          <div className="flex flex-col gap-3">
            <input
              id="input-restore-key"
              type="text"
              placeholder="Paste sync key here..."
              value={restoreKey}
              onChange={(e) => setRestoreKey(e.target.value)}
              className="w-full rounded-lg border border-surface-700/40 bg-surface-900/80 px-3 py-2.5 text-sm font-mono text-surface-200 placeholder-surface-600 outline-none transition focus:border-sky-500/40 focus:ring-1 focus:ring-sky-500/20"
            />

            <button
              id="btn-restore"
              type="button"
              onClick={handleRestore}
              disabled={isRestoring || !restoreKey.trim()}
              className="w-full cursor-pointer rounded-xl border border-sky-500/20 bg-sky-600/15 px-4 py-3 text-sm font-bold text-sky-300 transition hover:bg-sky-600/25 hover:border-sky-500/40 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isRestoring ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-sky-400/30 border-t-sky-400" />
                  Restoring...
                </span>
              ) : (
                '↓ Restore from Cloud'
              )}
            </button>
          </div>
        </section>

        {/* ── Info footer ────────────────────────────────────────────── */}
        <p className="text-center text-[10px] leading-relaxed text-surface-600">
          Backups include all patient records, payment history, dues, locations,<br />
          and archived daily snapshots.
        </p>
      </div>
    </div>
  )
}

export default SettingsPage
