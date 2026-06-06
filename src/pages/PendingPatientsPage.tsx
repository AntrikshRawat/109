import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import type { PatientItem, DailySnapshot } from '../store/useAppStore'

/* ── Helpers ─────────────────────────────────────────────────────────── */
const formatCurrency = (n: number) =>
  '₹' +
  n.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })

const parseDateStr = (s: string) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

const getWeekday = (s: string) =>
  parseDateStr(s).toLocaleDateString('en-IN', { weekday: 'short' })

const getDay = (s: string) => parseDateStr(s).getDate()

const getMonthShort = (s: string) =>
  parseDateStr(s).toLocaleDateString('en-IN', { month: 'short' })

const formatDateFull = (s: string) =>
  parseDateStr(s).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

function PendingPatientsPage() {
  const {
    pendingPatients,
    patients,
    addPatient,
    markTreated,
    markTreatedWithDue,
    markRemaining,
    deletePatient,
    dailyHistory,
    currentDate,
    archiveDayIfNeeded,
  } = useAppStore()
  const navigate = useNavigate()

  /* Auto-archive on mount / day change */
  useEffect(() => {
    archiveDayIfNeeded()
  }, [])

  /* Currently selected date in the strip – defaults to today */
  const [selectedDate, setSelectedDate] = useState(currentDate)
  const isViewingToday = selectedDate === currentDate

  /* Scroll selected date chip to center of strip */
  const stripRef = useRef<HTMLDivElement>(null)
  const scrollToCenter = (date: string, smooth = true) => {
    const container = stripRef.current
    if (!container) return
    const chip = container.querySelector(`[data-date="${date}"]`) as HTMLElement | null
    if (!chip) return
    const scrollLeft = chip.offsetLeft - container.offsetWidth / 2 + chip.offsetWidth / 2
    container.scrollTo({ left: scrollLeft, behavior: smooth ? 'smooth' : 'auto' })
  }

  /* Center today on mount */
  useEffect(() => {
    // Small delay to ensure layout is computed
    requestAnimationFrame(() => scrollToCenter(currentDate, false))
  }, [])

  /* Center on selection change */
  const handleDateSelect = (date: string) => {
    setSelectedDate(date)
    requestAnimationFrame(() => scrollToCenter(date))
  }

  /* Build the list of all dates: history dates + today, sorted chronologically */
  const allDates = [
    ...dailyHistory.map((s) => s.date).sort(),
    currentDate,
  ]
  // Remove duplicates
  const uniqueDates = [...new Set(allDates)]

  /* Get snapshot for the selected historical date */
  const selectedSnapshot = dailyHistory.find((s) => s.date === selectedDate)

  /* Derive patients to display */
  const displayPatients = isViewingToday
    ? patients
    : selectedSnapshot?.patients || []
  const displayRemaining = displayPatients.filter((p) => p.status === 'remaining')
  const displayTreated = displayPatients.filter((p) => p.status === 'treated')
  const displayStats = isViewingToday
    ? pendingPatients
    : {
        remaining: selectedSnapshot?.remaining || 0,
        treated: selectedSnapshot?.treated || 0,
      }

  /* Form state */
  const [showAddForm, setShowAddForm] = useState(false)
  const [formName, setFormName] = useState('')
  const [formPlace, setFormPlace] = useState('')

  /* Income popup state */
  const [incomePatientId, setIncomePatientId] = useState<string | null>(null)
  const [incomeAmount, setIncomeAmount] = useState('')

  /* Delete state */
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  /* ── Handlers ──────────────────────────────────────────────────────── */
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const name = formName.trim()
    const place = formPlace.trim()
    if (!name || !place) return
    addPatient(name, place)
    setFormName('')
    setFormPlace('')
    setShowAddForm(false)
  }

  const handleToggle = (patient: PatientItem) => {
    if (patient.status === 'remaining') {
      setIncomePatientId(patient.id)
      setIncomeAmount('')
    } else {
      markRemaining(patient.id)
    }
  }

  const handleIncomeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseFloat(incomeAmount)
    if (!incomePatientId || isNaN(amount) || amount < 0) return
    markTreated(incomePatientId, amount)
    setIncomePatientId(null)
    setIncomeAmount('')
  }

  const handleDeleteRequest = (id: string) => {
    setConfirmDeleteId(id)
  }

  const confirmDeletePatient = () => {
    if (!confirmDeleteId) return
    setDeletingId(confirmDeleteId)
    setConfirmDeleteId(null)
    setTimeout(() => {
      deletePatient(confirmDeleteId)
      setDeletingId(null)
    }, 250)
  }

  const confirmDeletePatientData = patients.find((p) => p.id === confirmDeleteId)
  const incomePatient = patients.find((p) => p.id === incomePatientId)

  /* ── Render Item (interactive – today only) ─────────────────────────── */
  const renderItem = (patient: PatientItem) => (
    <div
      key={patient.id}
      className={`group flex items-center gap-3 rounded-xl border bg-surface-900/50 px-4 py-3.5 transition-all duration-250 ${
        patient.status === 'treated'
          ? 'border-emerald-400/10'
          : 'border-surface-700/30'
      } ${deletingId === patient.id ? 'scale-95 opacity-0' : ''}`}
    >
      {/* Toggle checkbox */}
      <button
        type="button"
        onClick={() => handleToggle(patient)}
        className={`flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-md border transition ${
          patient.status === 'treated'
            ? 'border-emerald-500 bg-emerald-500 text-white'
            : 'border-surface-500/50 bg-transparent hover:border-primary-400'
        }`}
      >
        {patient.status === 'treated' && (
          <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
            <path
              d="M2.5 6L5 8.5L9.5 3.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      {/* Patient info */}
      <div className="min-w-0 flex-1">
        <p
          className={`text-sm font-semibold transition ${
            patient.status === 'treated'
              ? 'text-surface-400 line-through'
              : 'text-surface-50'
          }`}
        >
          {patient.name}
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
          <p className="flex items-center gap-1 text-xs text-surface-400/70">
            <svg className="h-3 w-3" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1a5 5 0 0 0-5 5c0 3.53 4.434 8.291 4.62 8.49a.5.5 0 0 0 .76 0C8.566 14.29 13 9.53 13 6a5 5 0 0 0-5-5zm0 7a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" />
            </svg>
            {patient.place}
          </p>
          {patient.status === 'treated' && patient.income > 0 && (
            <span className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400">
              {formatCurrency(patient.income)}
            </span>
          )}
          {patient.status === 'treated' && patient.dueAmount !== undefined && patient.dueAmount > 0 && (
            <span className="rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400">
              Due: {formatCurrency(patient.dueAmount)}
            </span>
          )}
        </div>
      </div>

      {/* Delete – always visible on mobile, hover on desktop */}
      <button
        type="button"
        onClick={() => handleDeleteRequest(patient.id)}
        className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-surface-500 transition hover:bg-rose-500/10 hover:text-rose-400 sm:opacity-0 sm:group-hover:opacity-100"
      >
        <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
          <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
          <path
            fillRule="evenodd"
            d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1 0-2h3a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1h3a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118z"
          />
        </svg>
      </button>
    </div>
  )

  /* ── Render Item (read-only – history) ──────────────────────────────── */
  const renderHistoryItem = (patient: PatientItem) => (
    <div
      key={patient.id}
      className={`flex items-center gap-3 rounded-xl border bg-surface-900/50 px-4 py-3.5 ${
        patient.status === 'treated'
          ? 'border-emerald-400/10'
          : 'border-surface-700/30'
      }`}
    >
      {/* Status indicator */}
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
          patient.status === 'treated'
            ? 'border-emerald-500 bg-emerald-500 text-white'
            : 'border-amber-400/50 bg-amber-400/10'
        }`}
      >
        {patient.status === 'treated' ? (
          <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
        )}
      </span>

      {/* Patient info */}
      <div className="min-w-0 flex-1">
        <p
          className={`text-sm font-semibold ${
            patient.status === 'treated' ? 'text-surface-400 line-through' : 'text-surface-50'
          }`}
        >
          {patient.name}
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
          <p className="flex items-center gap-1 text-xs text-surface-400/70">
            <svg className="h-3 w-3" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1a5 5 0 0 0-5 5c0 3.53 4.434 8.291 4.62 8.49a.5.5 0 0 0 .76 0C8.566 14.29 13 9.53 13 6a5 5 0 0 0-5-5zm0 7a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" />
            </svg>
            {patient.place}
          </p>
          {patient.status === 'treated' && patient.income > 0 && (
            <span className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400">
              {formatCurrency(patient.income)}
            </span>
          )}
          {patient.status === 'treated' && patient.dueAmount !== undefined && patient.dueAmount > 0 && (
            <span className="rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400">
              Due: {formatCurrency(patient.dueAmount)}
            </span>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="relative min-h-dvh bg-surface-950 text-surface-50 font-sans">
      {/* ── Ambient glow ─────────────────────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="animate-pulse-glow absolute -left-32 top-0 h-[500px] w-[500px] rounded-full bg-primary-500/20 blur-[140px]" />
      </div>

      {/* ── Page container ───────────────────────────────────────────── */}
      <div className="mx-auto flex max-w-lg flex-col gap-5 px-3 pb-28 pt-6 sm:px-5">
        {/* ── Back Button ────────────────────────────────────────────── */}
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

        {/* ── Title ──────────────────────────────────────────────────── */}
        <div className="text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-surface-400">
            Doctor's Dashboard
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-r from-primary-300 to-primary-500 bg-clip-text text-transparent">
              Pending Patients
            </span>
          </h1>
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/*  HORIZONTAL DATE STRIP                                     */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <div className="-mx-3 sm:-mx-5">
          <div
            ref={stripRef}
            className="flex gap-2 overflow-x-auto px-3 pb-2 pt-1 sm:px-5 scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {uniqueDates.map((date) => {
              const isToday = date === currentDate
              const isSelected = date === selectedDate

              return (
                <button
                  key={date}
                  type="button"
                  data-date={date}
                  onClick={() => handleDateSelect(date)}
                  className={`relative flex shrink-0 cursor-pointer flex-col items-center rounded-2xl border px-3.5 py-2.5 transition-all duration-200 ${
                    isSelected
                      ? isToday
                        ? 'border-primary-500/40 bg-primary-500/15 shadow-lg shadow-primary-500/10'
                        : 'border-surface-400/30 bg-surface-700/40 shadow-lg shadow-surface-700/10'
                      : 'border-surface-700/20 bg-surface-800/30 hover:border-surface-600/30 hover:bg-surface-800/50'
                  }`}
                >
                  {/* Day number */}
                  <span
                    className={`text-xl font-extrabold tabular-nums leading-none ${
                      isSelected
                        ? isToday
                          ? 'text-primary-300'
                          : 'text-surface-100'
                        : 'text-surface-300'
                    }`}
                  >
                    {getDay(date)}
                  </span>

                  {/* Month */}
                  <span
                    className={`mt-1 text-[9px] font-medium uppercase tracking-wider ${
                      isSelected
                        ? isToday
                          ? 'text-primary-400/70'
                          : 'text-surface-400'
                        : 'text-surface-500/70'
                    }`}
                  >
                    {getMonthShort(date)}
                  </span>

                  {/* Active dot indicator for today */}
                  {isToday && (
                    <span className="absolute -top-0.5 right-1.5 h-2 w-2 rounded-full bg-primary-400 shadow-sm shadow-primary-400/50" />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Selected date label ─────────────────────────────────────── */}
        <div className="flex items-center justify-center gap-2">
          <span className="h-px flex-1 bg-surface-700/30" />
          <span className="flex items-center gap-1.5 text-xs font-medium text-surface-400">
            <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4 .5a.5.5 0 0 0-1 0V1H2a2 2 0 0 0-2 2v1h16V3a2 2 0 0 0-2-2h-1V.5a.5.5 0 0 0-1 0V1H4V.5zM16 14V5H0v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2z" />
            </svg>
            {isViewingToday ? 'Today' : formatDateFull(selectedDate)}
            {!isViewingToday && (
              <span className="rounded-md bg-surface-700/40 px-1.5 py-0.5 text-[10px] font-semibold text-surface-500">
                READ ONLY
              </span>
            )}
          </span>
          <span className="h-px flex-1 bg-surface-700/30" />
        </div>

        {/* ── Stats Row ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-amber-400/10 bg-surface-800/40 px-4 py-4 text-center backdrop-blur-lg">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-400/80">
              Remaining
            </p>
            <p className="mt-1.5 text-3xl font-extrabold tabular-nums text-amber-400">
              {displayStats.remaining}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-400/10 bg-surface-800/40 px-4 py-4 text-center backdrop-blur-lg">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-400/80">
              Treated
            </p>
            <p className="mt-1.5 text-3xl font-extrabold tabular-nums text-emerald-400">
              {displayStats.treated}
            </p>
          </div>
        </div>

        {/* ── Quick Links (today only) ─────────────────────────────────── */}
        {isViewingToday && (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/payments')}
              className="flex items-center justify-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-400 transition hover:bg-emerald-500/20"
            >
              <span>💰</span> View Payments
            </button>
            <button
              onClick={() => navigate('/dues')}
              className="flex items-center justify-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-400 transition hover:bg-rose-500/20"
            >
              <span>📄</span> View Dues
            </button>
          </div>
        )}

        {/* ── History income summary (past date only) ──────────────────── */}
        {!isViewingToday && selectedSnapshot && selectedSnapshot.totalIncome > 0 && (
          <div className="rounded-xl border border-primary-500/10 bg-primary-500/5 px-4 py-3 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-primary-400/70">
              Day's Income
            </p>
            <p className="mt-1 text-xl font-extrabold text-primary-300">
              {formatCurrency(selectedSnapshot.totalIncome)}
            </p>
          </div>
        )}

        {/* ── Remaining List ─────────────────────────────────────────── */}
        {displayRemaining.length > 0 && (
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-400/70">
              <span className="h-px flex-1 bg-amber-400/10" />
              Waiting · {displayRemaining.length}
              <span className="h-px flex-1 bg-amber-400/10" />
            </h2>
            <div className="flex flex-col gap-2">
              {displayRemaining.map(isViewingToday ? renderItem : renderHistoryItem)}
            </div>
          </section>
        )}

        {/* ── Treated List ───────────────────────────────────────────── */}
        {displayTreated.length > 0 && (
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-400/70">
              <span className="h-px flex-1 bg-emerald-400/10" />
              Treated · {displayTreated.length}
              <span className="h-px flex-1 bg-emerald-400/10" />
            </h2>
            <div className="flex flex-col gap-2">
              {displayTreated.map(isViewingToday ? renderItem : renderHistoryItem)}
            </div>
          </section>
        )}

        {/* ── Empty state ────────────────────────────────────────────── */}
        {displayPatients.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <p className="text-4xl">🩺</p>
            <p className="text-sm text-surface-400">
              {isViewingToday ? 'No patients listed yet today' : 'No patients were recorded this day'}
            </p>
            {isViewingToday && (
              <p className="text-xs text-surface-400/50">
                Tap "Add Patient" to add a new call
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Floating "Add Patient" Button (today only) ────────────────── */}
      {isViewingToday && (
        <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-40 flex justify-center pb-6">
          <button
            id="btn-add-patient"
            type="button"
            onClick={() => setShowAddForm(true)}
            className="pointer-events-auto flex cursor-pointer items-center gap-2 rounded-full border border-primary-500/30 bg-primary-600 px-7 py-3.5 text-sm font-bold text-white shadow-xl shadow-primary-600/30 transition-transform active:scale-95"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
            Add Patient
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/*  MODAL: Add Patient Form                                      */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* Visual backdrop — no pointer events */}
          <div className="pointer-events-none absolute inset-0 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease]" />

          {/* Invisible dismiss layer — sits behind modal */}
          <div
            className="absolute inset-0 z-0"
            onClick={() => setShowAddForm(false)}
          />

          {/* Modal card — above dismiss layer */}
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
              <span className="text-lg">🩺</span>
              <h3 className="text-lg font-bold text-surface-50">
                Add New Patient
              </h3>
            </div>
            <p className="mb-5 text-xs text-surface-400">
              Record a new patient call to visit.
            </p>

            <form onSubmit={handleAddSubmit} className="flex flex-col gap-4">
              <div>
                <label
                  htmlFor="input-patient-name"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-surface-300"
                >
                  Patient Name
                </label>
                <input
                  id="input-patient-name"
                  type="text"
                  placeholder="e.g. Rajesh Kumar"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  autoFocus
                  className="w-full rounded-xl border border-surface-700/50 bg-surface-800/60 px-4 py-3 text-sm text-surface-50 placeholder-surface-500 outline-none transition focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20"
                />
              </div>

              <div>
                <label
                  htmlFor="input-patient-place"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-surface-300"
                >
                  Place (Where they live)
                </label>
                <input
                  id="input-patient-place"
                  type="text"
                  placeholder="e.g. Andheri, Mumbai"
                  value={formPlace}
                  onChange={(e) => setFormPlace(e.target.value)}
                  className="w-full rounded-xl border border-surface-700/50 bg-surface-800/60 px-4 py-3 text-sm text-surface-50 placeholder-surface-500 outline-none transition focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20"
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
                  id="btn-submit-patient"
                  type="submit"
                  className="flex-1 cursor-pointer rounded-xl bg-primary-600 py-3 text-sm font-bold text-white transition hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-40 z-100"
                  disabled={!formName.trim() || !formPlace.trim()}
                >
                  Add Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/*  MODAL: Income Popup (on marking treated)                     */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {incomePatientId && incomePatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="pointer-events-none absolute inset-0 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease]" />

          <div
            className="absolute inset-0 z-0"
            onClick={() => {
              setIncomePatientId(null)
              setIncomeAmount('')
            }}
          />

          <div className="relative z-10 w-full max-w-sm animate-[slideUp_0.3s_cubic-bezier(0.16,1,0.3,1)] rounded-2xl border border-surface-700/40 bg-surface-900 p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => {
                setIncomePatientId(null)
                setIncomeAmount('')
              }}
              className="absolute right-4 top-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-surface-400 transition hover:bg-surface-700/50 hover:text-surface-200"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>

            <div className="mb-1 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-base">
                ✅
              </span>
              <div>
                <h3 className="text-base font-bold text-surface-50">
                  Mark as Treated
                </h3>
                <p className="text-xs text-surface-400">
                  {incomePatient.name}
                </p>
              </div>
            </div>

            <form onSubmit={handleIncomeSubmit} className="mt-5 flex flex-col gap-4">
              <div>
                <label
                  htmlFor="input-income"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-surface-300"
                >
                  Income Received (₹)
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-emerald-400">
                    ₹
                  </span>
                  <input
                    id="input-income"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0"
                    value={incomeAmount}
                    onChange={(e) => setIncomeAmount(e.target.value)}
                    autoFocus
                    className="w-full rounded-xl border border-surface-700/50 bg-surface-800/60 py-3 pl-9 pr-4 text-sm text-surface-50 placeholder-surface-500 outline-none transition focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIncomePatientId(null)
                      setIncomeAmount('')
                    }}
                    className="flex-1 cursor-pointer rounded-xl border border-surface-700/50 bg-surface-800/40 py-3 text-sm font-semibold text-surface-300 transition hover:bg-surface-700/60"
                  >
                    Cancel
                  </button>
                  <button
                    id="btn-submit-income"
                    type="submit"
                    className="flex-[1.5] cursor-pointer rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={incomeAmount === '' || parseFloat(incomeAmount) < 0}
                  >
                    Add to Income
                  </button>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    const amount = parseFloat(incomeAmount)
                    if (!incomePatientId || isNaN(amount) || amount < 0) return
                    markTreatedWithDue(incomePatientId, amount)
                    setIncomePatientId(null)
                    setIncomeAmount('')
                  }}
                  className="w-full cursor-pointer rounded-xl border border-amber-500/30 bg-amber-500/10 py-3 text-sm font-bold text-amber-500 transition hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={incomeAmount === '' || parseFloat(incomeAmount) <= 0}
                >
                  Add to Dues
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ══════════════════════════════════════════════════════════════ */}
      {/*  MODAL: Delete Confirmation                                    */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {confirmDeleteId && confirmDeletePatientData && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmDeleteId(null)
          }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease]" />

          <div className="relative z-10 w-full max-w-xs animate-[slideUp_0.25s_cubic-bezier(0.16,1,0.3,1)] rounded-2xl border border-surface-700/40 bg-surface-900 p-6 shadow-2xl">
            <div className="mb-4 flex flex-col items-center gap-2 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-2xl">
                🗑️
              </span>
              <h3 className="text-base font-bold text-surface-50">
                Delete Patient?
              </h3>
              <p className="text-sm text-surface-400">
                Are you sure you want to remove{' '}
                <span className="font-semibold text-surface-200">
                  {confirmDeletePatientData.name}
                </span>
                ? This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 cursor-pointer rounded-xl border border-surface-700/50 bg-surface-800/40 py-2.5 text-sm font-semibold text-surface-300 transition hover:bg-surface-700/60"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-delete"
                type="button"
                onClick={confirmDeletePatient}
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

export default PendingPatientsPage
