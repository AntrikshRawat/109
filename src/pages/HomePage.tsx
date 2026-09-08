import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'

/* ── Helpers ─────────────────────────────────────────────────────────── */
const formatCurrency = (n: number) =>
  '₹' +
  Math.abs(n).toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })

const formatDate = (d: Date) => {
  const day = d.getDate()
  const month = d.toLocaleString('en-US', { month: 'long' })
  const year = d.getFullYear()
  const weekday = d.toLocaleString('en-US', { weekday: 'long' })
  return { day, month, year, weekday }
}

/* ── Home Page ───────────────────────────────────────────────────────── */
function HomePage() {
  const { pendingPatients, dues, paymentRecords, dailyHistory } = useAppStore()
  const navigate = useNavigate()
  const now = new Date()
  const { day, month, year, weekday } = formatDate(now)

  // Compute monthly totals from current + archived payment records
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const allMonthRecords = (() => {
    const records = [...(paymentRecords || [])]
    for (const snap of dailyHistory) {
      if (snap.paymentRecords) {
        records.push(...snap.paymentRecords)
      }
    }
    return records.filter((r) => {
      const d = new Date(r.createdAt)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === currentMonthStr
    })
  })()
  const monthlyIncome = allMonthRecords.filter((r) => r.type === 'income').reduce((sum, r) => sum + r.amount, 0)
  const monthlyExpense = allMonthRecords.filter((r) => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0)
  const netRevenue = monthlyIncome - monthlyExpense

  return (
    <div className="relative min-h-dvh bg-surface-950 text-surface-50 font-sans">
      {/* ── Ambient background glows ─────────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="animate-pulse-glow absolute -left-32 top-0 h-[500px] w-[500px] rounded-full bg-primary-500/20 blur-[140px]" />
        <div className="animate-pulse-glow absolute -right-32 top-1/3 h-[400px] w-[400px] rounded-full bg-emerald-500/15 blur-[120px]" style={{ animationDelay: '2s' }} />
        <div className="animate-pulse-glow absolute bottom-0 left-1/2 h-[350px] w-[350px] -translate-x-1/2 rounded-full bg-amber-500/10 blur-[100px]" style={{ animationDelay: '3s' }} />
      </div>

      {/* ── Page container ───────────────────────────────────────────── */}
      <div className="mx-auto flex max-w-lg flex-col gap-6 px-3 py-8 sm:px-5">

        {/* ── Top bar with Locations link ─────────────────────────────── */}
        <div className="flex items-center justify-end gap-2">
          <button
            id="btn-settings"
            type="button"
            onClick={() => navigate('/settings')}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-surface-700/40 px-3 py-1.5 text-xs font-semibold text-surface-300 transition hover:border-primary-500/30 hover:text-primary-400"
          >
            ⚙️ Sync
          </button>
          <button
            id="btn-locations"
            type="button"
            onClick={() => navigate('/locations')}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-surface-700/40 px-3 py-1.5 text-xs font-semibold text-surface-300 transition hover:border-sky-500/30 hover:text-sky-400"
          >
            📍 Locations
          </button>
        </div>

        {/* ── Date Header ────────────────────────────────────────────── */}
        <header id="date-header" className="text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-primary-400">
            {weekday}
          </p>
          <h1 className="mt-1 text-4xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-r from-surface-50 to-surface-300 bg-clip-text text-transparent">
              {day}
            </span>{' '}
            <span className="bg-gradient-to-r from-primary-300 to-primary-500 bg-clip-text text-transparent">
              {month}
            </span>{' '}
            <span className="text-surface-400">{year}</span>
          </h1>
          <div className="mx-auto mt-3 h-px w-20 bg-gradient-to-r from-transparent via-primary-500/60 to-transparent" />
        </header>

        {/* ── Card 1 · Pending Patients (clickable) ──────────────────── */}
        <section
          id="card-pending-patients"
          onClick={() => navigate('/pending-patients')}
          className="animate-card-in cursor-pointer rounded-2xl border border-surface-700/40 bg-surface-800/40 p-6 shadow-2xl shadow-primary-500/5 backdrop-blur-lg transition-all duration-200 hover:border-primary-500/30 hover:shadow-primary-500/10 active:scale-[0.98]"
          style={{ animationDelay: '0.05s' }}
        >
          {/* Card title */}
          <div className="mb-5 flex items-center justify-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600/20 text-base">
              🩺
            </span>
            <h2 className="text-lg font-bold tracking-wide text-surface-50">
              Pending Patients
            </h2>
            <span className="rounded-md bg-primary-500/15 border border-primary-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-300">
              Today
            </span>
            <svg className="ml-auto h-4 w-4 text-surface-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
            </svg>
          </div>

          {/* Subdivisions */}
          <div className="grid grid-cols-2 gap-4">
            {/* Remaining */}
            <div
              id="stat-remaining"
              className="group relative overflow-hidden rounded-xl border border-amber-400/10 bg-surface-900/60 px-4 py-5 text-center transition hover:border-amber-400/30"
            >
              <div className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full bg-amber-400/10 blur-2xl transition group-hover:bg-amber-400/20" />
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-400/80">
                Remaining
              </p>
              <p className="mt-2 text-3xl font-extrabold tabular-nums text-amber-400">
                {pendingPatients.remaining}
              </p>
            </div>

            {/* Treated */}
            <div
              id="stat-treated"
              className="group relative overflow-hidden rounded-xl border border-emerald-400/10 bg-surface-900/60 px-4 py-5 text-center transition hover:border-emerald-400/30"
            >
              <div className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full bg-emerald-400/10 blur-2xl transition group-hover:bg-emerald-400/20" />
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400/80">
                Treated
              </p>
              <p className="mt-2 text-3xl font-extrabold tabular-nums text-emerald-400">
                {pendingPatients.treated}
              </p>
            </div>
          </div>
        </section>

        {/* ── Card 2 · Payments ──────────────────────────────────────── */}
        <section
          id="card-payments"
          onClick={() => navigate('/payments')}
          className="animate-card-in cursor-pointer rounded-2xl border border-surface-700/40 bg-surface-800/40 p-6 shadow-2xl shadow-emerald-500/5 backdrop-blur-lg transition-all duration-200 hover:border-emerald-500/30 hover:shadow-emerald-500/10 active:scale-[0.98]"
          style={{ animationDelay: '0.15s' }}
        >
          {/* Card title */}
          <div className="mb-5 flex items-center justify-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600/20 text-base">
              💰
            </span>
            <h2 className="text-lg font-bold tracking-wide text-surface-50">
              Payments
            </h2>
            <span className="rounded-md bg-emerald-500/15 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
              {month}
            </span>
            <svg className="ml-auto h-4 w-4 text-surface-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
            </svg>
          </div>

          {/* Three subsections */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {/* Income */}
            <div
              id="stat-income"
              className="group relative overflow-hidden rounded-xl border border-emerald-400/10 bg-surface-900/60 px-2 py-4 text-center transition hover:border-emerald-400/30 sm:px-3 sm:py-5"
            >
              <div className="pointer-events-none absolute -right-4 -top-4 h-14 w-14 rounded-full bg-emerald-400/10 blur-2xl transition group-hover:bg-emerald-400/20" />
              <p className="text-[9px] font-semibold uppercase tracking-wider text-emerald-400/80 sm:text-[10px] sm:tracking-widest">
                Income
              </p>
              <p className="mt-1.5 flex items-baseline justify-center gap-0.5 text-sm font-extrabold tabular-nums text-emerald-400 sm:mt-2 sm:text-lg">
                <span className="text-xs font-bold">↑</span>
                {formatCurrency(monthlyIncome)}
              </p>
            </div>

            {/* Expense */}
            <div
              id="stat-expense"
              className="group relative overflow-hidden rounded-xl border border-rose-400/10 bg-surface-900/60 px-2 py-4 text-center transition hover:border-rose-400/30 sm:px-3 sm:py-5"
            >
              <div className="pointer-events-none absolute -right-4 -top-4 h-14 w-14 rounded-full bg-rose-400/10 blur-2xl transition group-hover:bg-rose-400/20" />
              <p className="text-[9px] font-semibold uppercase tracking-wider text-rose-400/80 sm:text-[10px] sm:tracking-widest">
                Expense
              </p>
              <p className="mt-1.5 flex items-baseline justify-center gap-0.5 text-sm font-extrabold tabular-nums text-rose-400 sm:mt-2 sm:text-lg">
                <span className="text-xs font-bold">↓</span>
                {formatCurrency(monthlyExpense)}
              </p>
            </div>

            {/* Net Revenue */}
            <div
              id="stat-net-revenue"
              className={`group relative overflow-hidden rounded-xl border bg-surface-900/60 px-2 py-4 text-center transition sm:px-3 sm:py-5 ${
                netRevenue >= 0
                  ? 'border-primary-400/10 hover:border-primary-400/30'
                  : 'border-rose-400/10 hover:border-rose-400/30'
              }`}
            >
              <div
                className={`pointer-events-none absolute -right-4 -top-4 h-14 w-14 rounded-full blur-2xl transition ${
                  netRevenue >= 0
                    ? 'bg-primary-400/10 group-hover:bg-primary-400/20'
                    : 'bg-rose-400/10 group-hover:bg-rose-400/20'
                }`}
              />
              <p className="text-[9px] font-semibold uppercase tracking-wider text-primary-300/80 sm:text-[10px] sm:tracking-widest">
                Net Revenue
              </p>
              <p
                className={`mt-1.5 text-sm font-extrabold tabular-nums sm:mt-2 sm:text-lg ${
                  netRevenue >= 0 ? 'text-primary-400' : 'text-rose-400'
                }`}
              >
                {netRevenue >= 0 ? '+' : '−'}
                {formatCurrency(netRevenue)}
              </p>
            </div>
          </div>
        </section>

        {/* ── Card 3 · Dues ──────────────────────────────────────────── */}
        <section
          id="card-dues"
          onClick={() => navigate('/dues')}
          className="animate-card-in cursor-pointer rounded-2xl border border-surface-700/40 bg-surface-800/40 p-6 shadow-2xl shadow-rose-500/5 backdrop-blur-lg transition-all duration-200 hover:border-rose-500/30 hover:shadow-rose-500/10 active:scale-[0.98]"
          style={{ animationDelay: '0.25s' }}
        >
          {/* Card title */}
          <div className="mb-5 flex items-center justify-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-600/20 text-base">
              📄
            </span>
            <h2 className="text-lg font-bold tracking-wide text-surface-50">
              Dues
            </h2>
            <svg className="ml-auto h-4 w-4 text-surface-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
            </svg>
          </div>

          {/* Total Due Money */}
          <div
            id="stat-total-due"
            className="group relative overflow-hidden rounded-xl border border-rose-400/10 bg-surface-900/60 px-5 py-6 text-center transition hover:border-rose-400/30"
          >
            <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-rose-400/10 blur-2xl transition group-hover:bg-rose-400/20" />
            <p className="text-xs font-semibold uppercase tracking-widest text-rose-400/80">
              Total Due Money
            </p>
            <p className="mt-3 text-3xl font-extrabold tabular-nums text-rose-400">
              {formatCurrency(dues.totalDueMoney)}
            </p>
          </div>
        </section>

      </div>
    </div>
  )
}

export default HomePage
