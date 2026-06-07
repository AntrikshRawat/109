import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'

const formatCurrency = (n: number) =>
  '₹' +
  Math.abs(n).toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })

function DuesPage() {
  const { dues, dueRecords, addDueRecord, collectDueRecord, deleteDueRecord, locations, patients, dailyHistory } = useAppStore()
  const navigate = useNavigate()

  /* Form state */
  const [showAddForm, setShowAddForm] = useState(false)
  const [formName, setFormName] = useState('')
  const [formAmount, setFormAmount] = useState('')
  const [formRemark, setFormRemark] = useState('')

  /* Confirm state */
  const [confirmCollectId, setConfirmCollectId] = useState<string | null>(null)
  const [collectMode, setCollectMode] = useState<'options' | 'partial'>('options')
  const [partialAmount, setPartialAmount] = useState('')
  const [collectOwner, setCollectOwner] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  /* Search & Filter state */
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLocation, setSelectedLocation] = useState('')

  const getPatientPlace = (recordId: string) => {
    if (!recordId.startsWith('patient_')) return null
    const patientId = recordId.replace('patient_', '')
    let p = patients.find(x => x.id === patientId)
    if (p) return p.place
    for (const snap of dailyHistory) {
      p = snap.patients.find(x => x.id === patientId)
      if (p) return p.place
    }
    return null
  }

  const confirmCollectRecordData = dueRecords?.find((r) => r.id === confirmCollectId)
  const confirmDeleteRecordData = dueRecords?.find((r) => r.id === confirmDeleteId)

  /* Handlers */
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseFloat(formAmount)
    const name = formName.trim()
    const remark = formRemark.trim()
    if (isNaN(amount) || amount <= 0 || !name) return
    addDueRecord(name, amount, remark)
    setFormName('')
    setFormAmount('')
    setFormRemark('')
    setShowAddForm(false)
  }

  const handleCollectClick = (id: string) => {
    setConfirmCollectId(id)
    setCollectMode('options')
    setPartialAmount('')
    setCollectOwner('')
  }

  const handleCollect = (id: string, amount?: number) => {
    collectDueRecord(id, amount, collectOwner)
    setConfirmCollectId(null)
  }

  const handlePartialSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!confirmCollectId || !confirmCollectRecordData) return
    const amt = parseFloat(partialAmount)
    if (isNaN(amt) || amt <= 0 || amt > confirmCollectRecordData.amount) return
    handleCollect(confirmCollectId, amt)
  }

  const handleDelete = (id: string) => {
    deleteDueRecord(id)
    setConfirmDeleteId(null)
  }

  return (
    <div className="relative min-h-dvh bg-surface-950 text-surface-50 font-sans">
      {/* ── Ambient background glows ─────────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="animate-pulse-glow absolute -left-32 top-0 h-125 w-125 rounded-full bg-rose-500/15 blur-[140px]" />
      </div>

      <div className="mx-auto flex max-w-lg flex-col gap-6 px-3 py-8 sm:px-5">
        {/* ── Back Button ────────────────────────────────────────────── */}
        <button
          id="btn-back"
          type="button"
          onClick={() => navigate(-1)}
          className="flex w-fit cursor-pointer items-center gap-1.5 rounded-xl border border-surface-700/30 bg-surface-800/40 px-3.5 py-2 text-sm font-medium text-surface-300 backdrop-blur transition hover:border-rose-500/30 hover:text-rose-300"
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

        {/* ── Title ──────────────────────────────────────────────────── */}
        <div className="text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-surface-400">
            Financial Overview
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-r from-rose-300 to-rose-500 bg-clip-text text-transparent">
              Dues
            </span>
          </h1>
        </div>

        {/* ── Stats Row ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-3">
          {/* Total Due Money */}
          <div className="rounded-xl border border-rose-400/10 bg-surface-800/40 px-4 py-4 text-center backdrop-blur-lg">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-rose-400/80">
              Total Due Money
            </p>
            <p className="mt-1.5 text-3xl font-extrabold tabular-nums text-rose-400">
              {formatCurrency(dues.totalDueMoney)}
            </p>
          </div>
        </div>
        {/* ── Search Bar & Filter ──────────────────────────────────── */}
        {dueRecords && dueRecords.length > 0 && (
          <div className="flex flex-col gap-3">
            <div className="relative">
              <svg
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                  clipRule="evenodd"
                />
              </svg>
              <input
                id="input-search-dues"
                type="text"
                placeholder="Search by patient name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-surface-700/40 bg-surface-800/40 py-3 pl-11 pr-10 text-sm text-surface-50 placeholder-surface-500 outline-none backdrop-blur transition focus:border-rose-500/40 focus:ring-2 focus:ring-rose-500/15"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-surface-400 transition hover:bg-surface-700/50 hover:text-surface-200"
                >
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                  </svg>
                </button>
              )}
            </div>
            
            {/* Location Dropdown */}
            {locations && locations.length > 0 && (
              <div className="relative">
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-surface-700/40 bg-surface-800/40 py-3 pl-4 pr-10 text-sm text-surface-50 outline-none backdrop-blur transition focus:border-rose-500/40 focus:ring-2 focus:ring-rose-500/15"
                >
                  <option value="">All Locations</option>
                  {locations.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-surface-500">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Due Records List ───────────────────────────────────── */}
        {(() => {
          const filteredRecords = (dueRecords || []).filter((r) => {
            if (searchQuery && !r.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
            if (selectedLocation) {
              const place = getPatientPlace(r.id)
              if (place !== selectedLocation) return false
            }
            return true
          })

          if (dueRecords && dueRecords.length > 0 && filteredRecords.length > 0) {
            const groupedRecords: Record<string, typeof filteredRecords> = {}
            filteredRecords.forEach((r) => {
              const date = new Date(r.createdAt)
              const monthKey = date.toLocaleString('default', { month: 'long', year: 'numeric' })
              if (!groupedRecords[monthKey]) {
                groupedRecords[monthKey] = []
              }
              groupedRecords[monthKey].push(r)
            })

            const sortedMonthKeys = Object.keys(groupedRecords).sort((a, b) => {
              return new Date(b).getTime() - new Date(a).getTime()
            })

            return (
              <section className="pb-20 flex flex-col gap-6">
                {searchQuery && (
                  <div className="flex justify-end -mb-4">
                    <span className="text-[10px] font-semibold text-surface-500">
                      Found {filteredRecords.length} of {dueRecords.length} dues
                    </span>
                  </div>
                )}
                {sortedMonthKeys.map((monthKey) => {
                  const recordsInMonth = groupedRecords[monthKey]
                  const monthTotal = recordsInMonth.reduce((sum, r) => sum + r.amount, 0)
                  return (
                    <div key={monthKey}>
                      <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-surface-400">
                        <span className="h-px flex-1 bg-surface-700/50" />
                        {monthKey} <span className="text-rose-400 ml-1">{formatCurrency(monthTotal)}</span>
                        <span className="h-px flex-1 bg-surface-700/50" />
                      </h2>
                      <div className="flex flex-col gap-2">
                        {recordsInMonth.map((record) => (
                          <div
                            key={record.id}
                            className="group flex items-center gap-3 rounded-xl border border-rose-400/10 bg-surface-900/50 px-4 py-3.5 transition-all duration-250 hover:border-rose-400/30"
                          >
                            {/* Icon */}
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400">
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>

                            {/* Info */}
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-surface-50 truncate">
                                {record.name}
                              </p>
                              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                <p className="text-xs text-surface-400/70">
                                  {new Date(record.createdAt).toLocaleDateString()}
                                </p>
                                {record.remark && (
                                  <span className="rounded-md bg-surface-700/40 px-1.5 py-0.5 text-[10px] text-surface-300 truncate max-w-30">
                                    {record.remark}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Amount */}
                            <div className="text-sm font-extrabold tabular-nums text-rose-400">
                              {formatCurrency(record.amount)}
                            </div>

                            {/* Actions */}
                            <div className="flex shrink-0 items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => handleCollectClick(record.id)}
                                className="flex cursor-pointer items-center justify-center rounded-lg bg-emerald-500/10 px-2 py-1.5 text-xs font-bold text-emerald-400 transition hover:bg-emerald-500/20"
                              >
                                Collect
                              </button>
                              {!record.id.startsWith('patient_') && (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(record.id)}
                                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-surface-500 transition hover:bg-rose-500/10 hover:text-rose-400"
                                >
                                  <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
                                    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
                                    <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1 0-2h3a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1h3a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118z" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </section>
            )
          }

        if (dueRecords && dueRecords.length > 0 && filteredRecords.length === 0) return (
          <div className="flex flex-col items-center gap-2 py-12 text-center pb-20">
            <p className="text-4xl">🔍</p>
            <p className="text-sm text-surface-400">
              No dues found{searchQuery ? ` for "${searchQuery}"` : ''}{selectedLocation ? ` in "${selectedLocation}"` : ''}
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('')
                setSelectedLocation('')
              }}
              className="mt-1 cursor-pointer text-xs font-semibold text-rose-400 transition hover:text-rose-300"
            >
              Clear filters
            </button>
          </div>
        )

        return (
          <div className="flex flex-col items-center gap-2 py-12 text-center pb-20">
            <p className="text-4xl">📄</p>
            <p className="text-sm text-surface-400">No dues recorded yet</p>
            <p className="text-xs text-surface-400/50">
              Tap "Add Due" below to log a pending payment
            </p>
          </div>
        )
        })()}
      </div>

      {/* ── Floating "Add Due" Button ─────────────────────────────── */}
      <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-40 flex justify-center pb-6">
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="pointer-events-auto flex cursor-pointer items-center gap-2 rounded-full border border-rose-500/30 bg-rose-600 px-7 py-3.5 text-sm font-bold text-white shadow-xl shadow-rose-600/30 transition-transform active:scale-95"
        >
          <span className="text-lg">➕</span> Add Due
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/*  MODAL: Add Due Form                                          */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="pointer-events-none absolute inset-0 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease]" />

          <div
            className="absolute inset-0 z-0"
            onClick={() => setShowAddForm(false)}
          />

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
              <span className="text-lg">📄</span>
              <h3 className="text-lg font-bold text-surface-50">
                Add New Due
              </h3>
            </div>
            <p className="mb-5 text-xs text-surface-400">
              Record an outstanding amount.
            </p>

            <form onSubmit={handleAddSubmit} className="flex flex-col gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-surface-300">
                  Name
                </label>
                <input
                  type="text"
                  placeholder="Patient / Person Name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  autoFocus
                  className="w-full rounded-xl border border-surface-700/50 bg-surface-800/60 px-4 py-3 text-sm text-surface-50 placeholder-surface-500 outline-none transition focus:border-rose-500/50 focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-surface-300">
                  Amount (₹)
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-rose-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="w-full rounded-xl border border-surface-700/50 bg-surface-800/60 py-3 pl-9 pr-4 text-sm text-surface-50 placeholder-surface-500 outline-none transition focus:border-rose-500/50 focus:ring-2 focus:ring-rose-500/20 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-surface-300">
                  Remark (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Needs to pay next visit"
                  value={formRemark}
                  onChange={(e) => setFormRemark(e.target.value)}
                  className="w-full rounded-xl border border-surface-700/50 bg-surface-800/60 px-4 py-3 text-sm text-surface-50 placeholder-surface-500 outline-none transition focus:border-rose-500/50 focus:ring-2 focus:ring-rose-500/20"
                />
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
                  type="submit"
                  className="flex-1 cursor-pointer rounded-xl bg-rose-600 py-3 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-40 hover:bg-rose-500"
                  disabled={!formName.trim() || !formAmount || parseFloat(formAmount) <= 0}
                >
                  Save Due
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/*  MODAL: Collect Confirmation                                  */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {confirmCollectId && confirmCollectRecordData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="pointer-events-none absolute inset-0 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease]" />

          <div
            className="absolute inset-0 z-0"
            onClick={() => setConfirmCollectId(null)}
          />

          <div className="relative z-10 w-full max-w-sm animate-[slideUp_0.3s_cubic-bezier(0.16,1,0.3,1)] rounded-2xl border border-surface-700/40 bg-surface-900 p-6 shadow-2xl">
            {collectMode === 'options' ? (
              <>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-surface-50">Collect Due</h3>
                <p className="mt-2 text-sm text-surface-400">
                  How much would you like to collect from <span className="font-semibold text-surface-300">{confirmCollectRecordData.name}</span>?
                  <br />
                  <span className="mt-1 block font-semibold text-emerald-400">
                    Total Due: {formatCurrency(confirmCollectRecordData.amount)}
                  </span>
                </p>
                <div className="mt-4 mb-4">
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-surface-300">
                    Collected By
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {['JITU', 'KULDEEP'].map((name) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => setCollectOwner(name)}
                        className={`cursor-pointer rounded-xl border py-2 text-sm font-semibold transition ${
                          collectOwner === name
                            ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300 shadow-sm shadow-emerald-500/10'
                            : 'border-surface-700/50 bg-surface-800/40 text-surface-400 hover:border-surface-600 hover:text-surface-300'
                        }`}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-6 flex flex-col gap-3">
                  <div className="flex gap-3">
                    <button
                      type="button"
                      disabled={!collectOwner}
                      onClick={() => handleCollect(confirmCollectId)}
                      className="flex-1 cursor-pointer rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-40 hover:bg-emerald-500"
                    >
                      Full Amount
                    </button>
                    <button
                      type="button"
                      disabled={!collectOwner}
                      onClick={() => setCollectMode('partial')}
                      className="flex-1 cursor-pointer rounded-xl border border-emerald-500/30 bg-emerald-500/10 py-3 text-sm font-bold text-emerald-400 transition disabled:cursor-not-allowed disabled:opacity-40 hover:bg-emerald-500/20"
                    >
                      Partial Amount
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setConfirmCollectId(null)}
                    className="w-full cursor-pointer rounded-xl bg-surface-800 py-3 text-sm font-semibold text-surface-300 transition hover:bg-surface-700"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <form onSubmit={handlePartialSubmit}>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-surface-50">Partial Collection</h3>
                <p className="mt-2 text-sm text-surface-400">
                  Enter the amount collected from <span className="font-semibold text-surface-300">{confirmCollectRecordData.name}</span>.
                  <br />
                  Max limit: <span className="font-semibold text-emerald-400">{formatCurrency(confirmCollectRecordData.amount)}</span>
                </p>
                
                <div className="mt-4 relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-emerald-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="1"
                    max={confirmCollectRecordData.amount}
                    step="any"
                    placeholder="0"
                    value={partialAmount}
                    onChange={(e) => setPartialAmount(e.target.value)}
                    autoFocus
                    className="w-full rounded-xl border border-surface-700/50 bg-surface-800/60 py-3 pl-9 pr-4 text-sm text-surface-50 placeholder-surface-500 outline-none transition focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setCollectMode('options')}
                    className="flex-1 cursor-pointer rounded-xl bg-surface-800 py-3 text-sm font-semibold text-surface-300 transition hover:bg-surface-700"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={!partialAmount || parseFloat(partialAmount) <= 0 || parseFloat(partialAmount) > confirmCollectRecordData.amount || !collectOwner}
                    className="flex-[1.5] cursor-pointer rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-40 hover:bg-emerald-500"
                  >
                    Confirm Collect
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/*  MODAL: Delete Confirmation                                   */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {confirmDeleteId && confirmDeleteRecordData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="pointer-events-none absolute inset-0 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease]" />

          <div
            className="absolute inset-0 z-0"
            onClick={() => setConfirmDeleteId(null)}
          />

          <div className="relative z-10 w-full max-w-sm animate-[slideUp_0.3s_cubic-bezier(0.16,1,0.3,1)] rounded-2xl border border-surface-700/40 bg-surface-900 p-6 shadow-2xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-500">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-surface-50">Delete Due?</h3>
            <p className="mt-2 text-sm text-surface-400">
              Are you sure you want to completely delete this due of{' '}
              <span className="font-semibold text-rose-400">
                {formatCurrency(confirmDeleteRecordData.amount)}
              </span>
              ? This action cannot be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 cursor-pointer rounded-xl bg-surface-800 py-3 text-sm font-semibold text-surface-300 transition hover:bg-surface-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(confirmDeleteId)}
                className="flex-[1.5] cursor-pointer rounded-xl bg-rose-600 py-3 text-sm font-bold text-white transition hover:bg-rose-500"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DuesPage
