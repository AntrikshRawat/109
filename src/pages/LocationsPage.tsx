import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'

function LocationsPage() {
  const navigate = useNavigate()
  const { patients, dailyHistory, locations, addLocation, editLocation, deleteLocation } = useAppStore()

  /* Merge stored locations + patient-derived locations */
  const uniqueLocations = useMemo(() => {
    const places = new Set<string>(locations || [])
    for (const p of patients) {
      if (p.place) places.add(p.place)
    }
    for (const snap of dailyHistory) {
      for (const p of snap.patients) {
        if (p.place) places.add(p.place)
      }
    }
    return Array.from(places).sort()
  }, [patients, dailyHistory, locations])

  /* Form state */
  const [showAddForm, setShowAddForm] = useState(false)
  const [formLocation, setFormLocation] = useState('')
  const [error, setError] = useState('')

  /* Edit state */
  const [showEditForm, setShowEditForm] = useState(false)
  const [editingOldName, setEditingOldName] = useState('')
  const [editFormLocation, setEditFormLocation] = useState('')
  const [editError, setEditError] = useState('')

  /* Delete state */
  const [confirmDeleteName, setConfirmDeleteName] = useState<string | null>(null)
  const [deletingName, setDeletingName] = useState<string | null>(null)

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const name = formLocation.trim()
    if (!name) return
    const success = addLocation(name)
    if (!success) {
      setError('This location already exists')
      return
    }
    setFormLocation('')
    setError('')
    setShowAddForm(false)
  }

  const handleDeleteRequest = (name: string) => {
    setConfirmDeleteName(name)
  }

  const confirmDelete = () => {
    if (!confirmDeleteName) return
    setDeletingName(confirmDeleteName)
    setConfirmDeleteName(null)
    setTimeout(() => {
      deleteLocation(confirmDeleteName)
      setDeletingName(null)
    }, 250)
  }

  const handleEditRequest = (name: string) => {
    setEditingOldName(name)
    setEditFormLocation(name)
    setShowEditForm(true)
    setEditError('')
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newName = editFormLocation.trim()
    if (!newName) return
    if (newName.toLowerCase() === editingOldName.toLowerCase()) {
      setShowEditForm(false)
      return
    }
    const exists = uniqueLocations.some(l => l.toLowerCase() === newName.toLowerCase() && l.toLowerCase() !== editingOldName.toLowerCase())
    if (exists) {
      setEditError('This location already exists')
      return
    }
    editLocation(editingOldName, newName)
    setShowEditForm(false)
  }

  return (
    <div className="relative min-h-dvh bg-surface-950 text-surface-50 font-sans">
      {/* ── Ambient background glows ─────────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="animate-pulse-glow absolute -left-32 top-0 h-[500px] w-[500px] rounded-full bg-sky-500/20 blur-[140px]" />
        <div className="animate-pulse-glow absolute -right-32 top-1/3 h-[400px] w-[400px] rounded-full bg-primary-500/15 blur-[120px]" style={{ animationDelay: '2s' }} />
      </div>

      {/* ── Page container ───────────────────────────────────────────── */}
      <div className="mx-auto flex max-w-lg flex-col gap-6 px-3 pb-28 pt-8 sm:px-5">

        {/* ── Back button ──────────────────────────────────────────── */}
        <button
          id="btn-back"
          type="button"
          onClick={() => navigate('/')}
          className="flex w-fit cursor-pointer items-center gap-1.5 rounded-xl border border-surface-700/30 bg-surface-800/40 px-3.5 py-2 text-sm font-medium text-surface-300 backdrop-blur transition hover:border-primary-500/30 hover:text-primary-300"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
              clipRule="evenodd"
            />
          </svg>
          Back
        </button>

        {/* ── Header ───────────────────────────────────────────────── */}
        <header className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-600/20 text-2xl">
            📍
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-r from-sky-300 to-sky-500 bg-clip-text text-transparent">
              Locations
            </span>
          </h1>
          <p className="mt-2 text-sm text-surface-400">
            {uniqueLocations.length} total location{uniqueLocations.length !== 1 ? 's' : ''}
          </p>
          <div className="mx-auto mt-3 h-px w-20 bg-gradient-to-r from-transparent via-sky-500/60 to-transparent" />
        </header>

        {/* ── Locations list ───────────────────────────────────────── */}
        <div className="flex flex-col gap-3">
          {uniqueLocations.map((location, i) => (
            <section
              key={location}
              className={`animate-card-in group relative overflow-hidden rounded-2xl border border-surface-700/40 bg-surface-800/40 p-5 shadow-2xl shadow-sky-500/5 backdrop-blur-lg transition-all duration-200 hover:border-sky-500/30 hover:shadow-sky-500/10 ${deletingName === location ? 'scale-95 opacity-0' : ''}`}
              style={{ animationDelay: `${0.05 + i * 0.06}s` }}
            >
              <div className="pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full bg-sky-400/10 blur-2xl transition group-hover:bg-sky-400/20" />
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-600/20 text-sm">
                  📍
                </span>
                <p className="flex-1 text-base font-semibold text-surface-100">
                  {location}
                </p>
                <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => handleEditRequest(location)}
                    className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-surface-500 transition hover:bg-sky-500/10 hover:text-sky-400"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteRequest(location)}
                    className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-surface-500 transition hover:bg-rose-500/10 hover:text-rose-400"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
                      <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1 0-2h3a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1h3a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118z" />
                    </svg>
                  </button>
                </div>
              </div>
            </section>
          ))}

          {uniqueLocations.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <p className="text-4xl">📍</p>
              <p className="text-sm text-surface-400">No locations added yet</p>
              <p className="text-xs text-surface-400/50">
                Tap "Add Location" to add one
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Floating "Add Location" Button ────────────────────────────── */}
      <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-40 flex justify-center pb-6">
        <button
          id="btn-add-location"
          type="button"
          onClick={() => {
            setShowAddForm(true)
            setError('')
            setFormLocation('')
          }}
          className="pointer-events-auto flex cursor-pointer items-center gap-2 rounded-full border border-sky-500/30 bg-sky-600 px-7 py-3.5 text-sm font-bold text-white shadow-xl shadow-sky-600/30 transition-transform active:scale-95"
        >
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
          </svg>
          Add Location
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/*  MODAL: Add Location Form                                     */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* Visual backdrop */}
          <div className="pointer-events-none absolute inset-0 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease]" />

          {/* Invisible dismiss layer */}
          <div
            className="absolute inset-0 z-0"
            onClick={() => setShowAddForm(false)}
          />

          {/* Modal card */}
          <div className="relative z-10 w-full max-w-md animate-[slideUp_0.3s_cubic-bezier(0.16,1,0.3,1)] rounded-2xl border border-surface-700/40 bg-surface-900 p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="absolute right-4 top-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-surface-400 transition hover:bg-surface-700/50 hover:text-surface-200"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>

            <div className="mb-1 flex items-center gap-2">
              <span className="text-lg">📍</span>
              <h3 className="text-lg font-bold text-surface-50">
                Add New Location
              </h3>
            </div>
            <p className="mb-5 text-xs text-surface-400">
              Enter a location name to add to your list.
            </p>

            <form onSubmit={handleAddSubmit} className="flex flex-col gap-4">
              <div>
                <label
                  htmlFor="input-location-name"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-surface-300"
                >
                  Location Name
                </label>
                <input
                  id="input-location-name"
                  type="text"
                  placeholder="e.g. Andheri, Mumbai"
                  value={formLocation}
                  onChange={(e) => {
                    setFormLocation(e.target.value)
                    setError('')
                  }}
                  autoFocus
                  className="w-full rounded-xl border border-surface-700/50 bg-surface-800/60 px-4 py-3 text-sm text-surface-50 placeholder-surface-500 outline-none transition focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20"
                />
                {error && (
                  <p className="mt-1.5 text-xs font-medium text-rose-400">{error}</p>
                )}
              </div>

              <div className="mt-1 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 cursor-pointer rounded-xl border border-surface-700/50 bg-surface-800/40 py-3 text-sm font-semibold text-surface-300 transition hover:bg-surface-700/60"
                >
                  Cancel
                </button>
                <button
                  id="btn-submit-location"
                  type="submit"
                  className="flex-1 cursor-pointer rounded-xl bg-sky-600 py-3 text-sm font-bold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={!formLocation.trim()}
                >
                  Add Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/*  MODAL: Edit Location Form                                     */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {showEditForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="pointer-events-none absolute inset-0 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease]" />
          <div
            className="absolute inset-0 z-0"
            onClick={() => setShowEditForm(false)}
          />
          <div className="relative z-10 w-full max-w-md animate-[slideUp_0.3s_cubic-bezier(0.16,1,0.3,1)] rounded-2xl border border-surface-700/40 bg-surface-900 p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setShowEditForm(false)}
              className="absolute right-4 top-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-surface-400 transition hover:bg-surface-700/50 hover:text-surface-200"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>

            <div className="mb-1 flex items-center gap-2">
              <span className="text-lg">✏️</span>
              <h3 className="text-lg font-bold text-surface-50">
                Edit Location
              </h3>
            </div>
            <p className="mb-5 text-xs text-surface-400">
              Update the name for this location.
            </p>

            <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
              <div>
                <label
                  htmlFor="input-edit-location-name"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-surface-300"
                >
                  Location Name
                </label>
                <input
                  id="input-edit-location-name"
                  type="text"
                  placeholder="e.g. Andheri, Mumbai"
                  value={editFormLocation}
                  onChange={(e) => {
                    setEditFormLocation(e.target.value)
                    setEditError('')
                  }}
                  autoFocus
                  className="w-full rounded-xl border border-surface-700/50 bg-surface-800/60 px-4 py-3 text-sm text-surface-50 placeholder-surface-500 outline-none transition focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20"
                />
                {editError && (
                  <p className="mt-1.5 text-xs font-medium text-rose-400">{editError}</p>
                )}
              </div>

              <div className="mt-1 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditForm(false)}
                  className="flex-1 cursor-pointer rounded-xl border border-surface-700/50 bg-surface-800/40 py-3 text-sm font-semibold text-surface-300 transition hover:bg-surface-700/60"
                >
                  Cancel
                </button>
                <button
                  id="btn-submit-edit-location"
                  type="submit"
                  className="flex-1 cursor-pointer rounded-xl bg-sky-600 py-3 text-sm font-bold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={!editFormLocation.trim()}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/*  MODAL: Delete Confirmation                                    */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {confirmDeleteName && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmDeleteName(null)
          }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease]" />

          <div className="relative z-10 w-full max-w-xs animate-[slideUp_0.25s_cubic-bezier(0.16,1,0.3,1)] rounded-2xl border border-surface-700/40 bg-surface-900 p-6 shadow-2xl">
            <div className="mb-4 flex flex-col items-center gap-2 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-2xl">
                🗑️
              </span>
              <h3 className="text-base font-bold text-surface-50">
                Delete Location?
              </h3>
              <p className="text-sm text-surface-400">
                Are you sure you want to remove{' '}
                <span className="font-semibold text-surface-200">
                  {confirmDeleteName}
                </span>
                ? This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmDeleteName(null)}
                className="flex-1 cursor-pointer rounded-xl border border-surface-700/50 bg-surface-800/40 py-2.5 text-sm font-semibold text-surface-300 transition hover:bg-surface-700/60"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-delete"
                type="button"
                onClick={confirmDelete}
                className="flex-1 cursor-pointer rounded-xl bg-rose-600 py-2.5 text-sm font-bold text-white transition hover:bg-rose-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LocationsPage
