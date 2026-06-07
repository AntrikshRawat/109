import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/* ── Patient Item ────────────────────────────────────────────────────── */
export interface PatientItem {
  id: string
  name: string
  place: string
  status: 'remaining' | 'treated'
  income: number
  dueAmount?: number
  collectedBy?: string
  owner?: string
  createdAt: number
  treatedAt?: number
}

/* ── Payment Record ──────────────────────────────────────────────────── */
export interface PaymentRecord {
  id: string
  type: 'income' | 'expense'
  amount: number
  remark: string
  collectedBy?: string
  owner?: string
  createdAt: number
}

/* ── Due Record ──────────────────────────────────────────────────────── */
export interface DueRecord {
  id: string
  name: string
  amount: number
  remark: string
  collectedBy?: string
  owner?: string
  createdAt: number
}

/* ── Daily Snapshot (history per day) ────────────────────────────────── */
export interface DailySnapshot {
  date: string           // 'YYYY-MM-DD'
  patients: PatientItem[]
  remaining: number
  treated: number
  totalIncome: number
}

/* ── State Shape ─────────────────────────────────────────────────────── */
interface PendingPatients {
  remaining: number
  treated: number
}

interface Payments {
  income: number
  expense: number
}

interface Dues {
  totalDueMoney: number
}

interface AppState {
  pendingPatients: PendingPatients
  payments: Payments
  dues: Dues
  patients: PatientItem[]
  paymentRecords: PaymentRecord[]
  dueRecords: DueRecord[]
  dailyHistory: DailySnapshot[]
  locations: string[]
  currentDate: string   // 'YYYY-MM-DD' of the active day
}

/* ── Actions ─────────────────────────────────────────────────────────── */
interface AppActions {
  setPendingPatients: (data: Partial<PendingPatients>) => void
  setPayments: (data: Partial<Payments>) => void
  setDues: (data: Partial<Dues>) => void
  addPatient: (name: string, place: string) => boolean
  markTreated: (id: string, income: number, collectedBy: string) => void
  markTreatedWithDue: (id: string, dueAmount: number, collectedBy: string) => void
  updatePatientPayment: (id: string, type: 'income' | 'due', amount: number, collectedBy: string) => void
  markRemaining: (id: string) => void
  deletePatient: (id: string) => void
  addPaymentRecord: (type: 'income' | 'expense', amount: number, remark: string) => void
  deletePaymentRecord: (id: string) => void
  addDueRecord: (name: string, amount: number, remark: string) => void
  collectDueRecord: (id: string, partialAmount?: number, collectedBy?: string) => void
  deleteDueRecord: (id: string) => void
  addLocation: (name: string) => boolean
  deleteLocation: (name: string) => void
  archiveDayIfNeeded: () => void
}

/* ── Derived Helpers ─────────────────────────────────────────────────── */
export const selectNetRevenue = (state: AppState) =>
  state.payments.income - state.payments.expense

export const selectUniqueLocationCount = (state: AppState): number => {
  const places = new Set<string>(state.locations || [])
  for (const p of state.patients) {
    if (p.place) places.add(p.place)
  }
  for (const snap of state.dailyHistory) {
    for (const p of snap.patients) {
      if (p.place) places.add(p.place)
    }
  }
  return places.size
}

/* ── Helpers ─────────────────────────────────────────────────────────── */
const getTodayString = (): string => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

/* ── Test / Seed Data ────────────────────────────────────────────────── */
const TODAY = getTodayString() // 2026-06-06


const SEED_HISTORY: DailySnapshot[] = []

/* ── Store ───────────────────────────────────────────────────────────── */
export const useAppStore = create<AppState & AppActions>()(
  persist(
    (set) => ({
      // ─ initial state (blank slate)
      pendingPatients: {
        remaining: 0,
        treated: 0,
      },
      payments: {
        income: 0,
        expense: 0,
      },
      dues: {
        totalDueMoney: 0,
      },
      patients: [],
      paymentRecords: [],
      dueRecords: [],
      dailyHistory: SEED_HISTORY,
      locations: [],
      currentDate: TODAY,

      // ─ actions
      setPendingPatients: (data) =>
        set((s) => ({ pendingPatients: { ...s.pendingPatients, ...data } })),
      setPayments: (data) =>
        set((s) => ({ payments: { ...s.payments, ...data } })),
      setDues: (data) =>
        set((s) => ({ dues: { ...s.dues, ...data } })),

      addPatient: (name, place) =>
        {set((s) => {
          const newItem: PatientItem = {
            id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).substring(2),
            name,
            place,
            status: 'remaining',
            income: 0,
            createdAt: Date.now(),
          }
          return {
            patients: [newItem, ...s.patients],
            pendingPatients: {
              ...s.pendingPatients,
              remaining: s.pendingPatients.remaining + 1,
            },
          }
        });
        return true;
      },

      markTreated: (id, income, collectedBy) =>
        set((s) => {
          const patients = s.patients.map((p) =>
            p.id === id
              ? { ...p, status: 'treated' as const, income, collectedBy, treatedAt: Date.now() }
              : p,
          )
          const patientName = s.patients.find((p) => p.id === id)?.name || 'Patient'
          const record: PaymentRecord = {
            id: `patient_${id}`,
            type: 'income',
            amount: income,
            remark: `Treatment: ${patientName}`,
            collectedBy,
            owner: collectedBy,
            createdAt: Date.now(),
          }
          return {
            patients,
            pendingPatients: {
              remaining: s.pendingPatients.remaining - 1,
              treated: s.pendingPatients.treated + 1,
            },
            payments: {
              ...s.payments,
              income: s.payments.income + income,
            },
            paymentRecords: [record, ...(s.paymentRecords || [])],
          }
        }),

      markTreatedWithDue: (id, dueAmount, collectedBy) =>
        set((s) => {
          const patients = s.patients.map((p) =>
            p.id === id
              ? { ...p, status: 'treated' as const, income: 0, dueAmount, collectedBy, treatedAt: Date.now() }
              : p,
          )
          const patientName = s.patients.find((p) => p.id === id)?.name || 'Patient'
          const record: DueRecord = {
            id: `patient_${id}`,
            name: patientName,
            amount: dueAmount,
            remark: 'Treatment Due',
            collectedBy,
            owner: collectedBy,
            createdAt: Date.now(),
          }
          return {
            patients,
            pendingPatients: {
              remaining: s.pendingPatients.remaining - 1,
              treated: s.pendingPatients.treated + 1,
            },
            dues: {
              ...s.dues,
              totalDueMoney: s.dues.totalDueMoney + dueAmount,
            },
            dueRecords: [record, ...(s.dueRecords || [])],
          }
        }),

      updatePatientPayment: (id, type, amount, collectedBy) =>
        set((s) => {
          const patient = s.patients.find((p) => p.id === id)
          if (!patient || patient.status !== 'treated') return {}

          const prevIncome = patient.income || 0
          const prevDue = patient.dueAmount || 0

          const newIncome = type === 'income' ? amount : 0
          const newDue = type === 'due' ? amount : 0

          const patients = s.patients.map((p) =>
            p.id === id
              ? { ...p, income: newIncome, dueAmount: newDue, collectedBy }
              : p,
          )

          // Filter out old records for this patient
          let paymentRecords = (s.paymentRecords || []).filter((r) => !r.id.includes(`patient_${id}`))
          let dueRecords = (s.dueRecords || []).filter((r) => r.id !== `patient_${id}`)

          // Add new record
          const patientName = patient.name || 'Patient'
          if (type === 'income') {
            const record: PaymentRecord = {
              id: `patient_${id}`,
              type: 'income',
              amount: newIncome,
              remark: `Treatment: ${patientName}`,
              collectedBy,
              createdAt: Date.now(),
            }
            paymentRecords = [record, ...paymentRecords]
          } else {
            const record: DueRecord = {
              id: `patient_${id}`,
              name: patientName,
              amount: newDue,
              remark: 'Treatment Due',
              collectedBy,
              createdAt: Date.now(),
            }
            dueRecords = [record, ...dueRecords]
          }

          return {
            patients,
            payments: {
              ...s.payments,
              income: s.payments.income - prevIncome + newIncome,
            },
            dues: {
              ...s.dues,
              totalDueMoney: s.dues.totalDueMoney - prevDue + newDue,
            },
            paymentRecords,
            dueRecords,
          }
        }),

      markRemaining: (id) =>
        set((s) => {
          const patient = s.patients.find((p) => p.id === id)
          if (!patient) return {}
          const prevIncome = patient.income || 0
          const prevDue = patient.dueAmount || 0
          const patients = s.patients.map((p) =>
            p.id === id
              ? { ...p, status: 'remaining' as const, income: 0, dueAmount: 0, treatedAt: undefined }
              : p,
          )
          return {
            patients,
            pendingPatients: {
              remaining: s.pendingPatients.remaining + 1,
              treated: s.pendingPatients.treated - 1,
            },
            payments: {
              ...s.payments,
              income: s.payments.income - prevIncome,
            },
            dues: {
              ...s.dues,
              totalDueMoney: s.dues.totalDueMoney - prevDue,
            },
            paymentRecords: (s.paymentRecords || []).filter((r) => !r.id.includes(`patient_${id}`)),
            dueRecords: (s.dueRecords || []).filter((r) => r.id !== `patient_${id}`),
          }
        }),

      deletePatient: (id) =>
        set((s) => {
          const patient = s.patients.find((p) => p.id === id)
          if (!patient) return {}
          return {
            patients: s.patients.filter((p) => p.id !== id),
            pendingPatients: {
              remaining: s.pendingPatients.remaining - (patient.status === 'remaining' ? 1 : 0),
              treated: s.pendingPatients.treated - (patient.status === 'treated' ? 1 : 0),
            },
            // also subtract income if treated patient is deleted
            payments: patient.status === 'treated'
              ? { ...s.payments, income: s.payments.income - (patient.income || 0) }
              : s.payments,
            dues: patient.status === 'treated' && patient.dueAmount
              ? { ...s.dues, totalDueMoney: s.dues.totalDueMoney - patient.dueAmount }
              : s.dues,
            paymentRecords: (s.paymentRecords || []).filter((r) => !r.id.includes(`patient_${id}`)),
            dueRecords: (s.dueRecords || []).filter((r) => r.id !== `patient_${id}`),
          }
        }),

      addPaymentRecord: (type, amount, remark) =>
        set((s) => {
          const record: PaymentRecord = {
            id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).substring(2),
            type,
            amount,
            remark,
            createdAt: Date.now(),
          }
          return {
            paymentRecords: [record, ...(s.paymentRecords || [])],
            payments: {
              ...s.payments,
              [type]: s.payments[type] + amount,
            },
          }
        }),

      deletePaymentRecord: (id) =>
        set((s) => {
          const record = (s.paymentRecords || []).find((r) => r.id === id)
          if (!record) return {}
          
          const isPatientDueCollect = id.startsWith('patient_') && id.endsWith('_collected')
          const patientId = isPatientDueCollect ? id.replace('patient_', '').replace('_collected', '') : null

          return {
            paymentRecords: s.paymentRecords.filter((r) => r.id !== id),
            payments: {
              ...s.payments,
              [record.type]: s.payments[record.type] - record.amount,
            },
            patients: isPatientDueCollect
              ? s.patients.map(p => p.id === patientId ? { ...p, income: 0 } : p)
              : s.patients
          }
        }),

      addDueRecord: (name, amount, remark) =>
        set((s) => {
          const record: DueRecord = {
            id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).substring(2),
            name,
            amount,
            remark,
            createdAt: Date.now(),
          }
          return {
            dueRecords: [record, ...(s.dueRecords || [])],
            dues: {
              ...s.dues,
              totalDueMoney: s.dues.totalDueMoney + amount,
            },
          }
        }),

      collectDueRecord: (id, partialAmount, collectedBy) =>
        set((s) => {
          const record = (s.dueRecords || []).find((r) => r.id === id)
          if (!record) return {}
          
          const amountToCollect = partialAmount !== undefined && partialAmount > 0 && partialAmount <= record.amount
            ? partialAmount
            : record.amount

          const isPartial = amountToCollect < record.amount

          const payRecord: PaymentRecord = {
            id: id.startsWith('patient_') ? `${id}_collected_${Date.now()}` : (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString()),
            type: 'income',
            amount: amountToCollect,
            remark: `Due Collect${isPartial ? ' (Partial)' : ''}: ${record.name}`,
            collectedBy,
            owner: collectedBy,
            createdAt: Date.now(),
          }

          const isPatientDue = id.startsWith('patient_')
          const patientId = isPatientDue ? id.replace('patient_', '') : null

          return {
            dueRecords: isPartial
              ? s.dueRecords.map(r => r.id === id ? { ...r, amount: r.amount - amountToCollect } : r)
              : s.dueRecords.filter((r) => r.id !== id),
            dues: {
              ...s.dues,
              totalDueMoney: s.dues.totalDueMoney - amountToCollect,
            },
            paymentRecords: [payRecord, ...(s.paymentRecords || [])],
            payments: {
              ...s.payments,
              income: s.payments.income + amountToCollect,
            },
            patients: isPatientDue
              ? s.patients.map(p => p.id === patientId ? { 
                  ...p, 
                  income: p.income + amountToCollect, 
                  dueAmount: (p.dueAmount || record.amount) - amountToCollect,
                  collectedBy: collectedBy || p.collectedBy,
                  owner: collectedBy || p.owner
                } : p)
              : s.patients
          }
        }),

      deleteDueRecord: (id) =>
        set((s) => {
          const record = (s.dueRecords || []).find((r) => r.id === id)
          if (!record) return {}
          return {
            dueRecords: s.dueRecords.filter((r) => r.id !== id),
            dues: {
              ...s.dues,
              totalDueMoney: s.dues.totalDueMoney - record.amount,
            },
          }
        }),

      addLocation: (name) => {
        const trimmed = name.trim()
        if (!trimmed) return false
        const state = useAppStore.getState()
        const existing = (state.locations || []).map((l) => l.toLowerCase())
        if (existing.includes(trimmed.toLowerCase())) return false
        set((s) => ({
          locations: [...(s.locations || []), trimmed],
        }))
        return true
      },

      deleteLocation: (name) =>
        set((s) => ({
          locations: (s.locations || []).filter((l) => l !== name),
        })),

      archiveDayIfNeeded: () =>
        set((s) => {
          const today = getTodayString()
          if (s.currentDate === today) return {}

          // Archive the previous day's patients into history
          const prevDate = s.currentDate
          const totalIncome = s.patients
            .filter((p) => p.status === 'treated')
            .reduce((sum, p) => sum + (p.income || 0), 0)
          const snapshot: DailySnapshot = {
            date: prevDate,
            patients: s.patients,
            remaining: s.patients.filter((p) => p.status === 'remaining').length,
            treated: s.patients.filter((p) => p.status === 'treated').length,
            totalIncome,
          }

          // Prevent duplicate snapshots for the same date
          const existingIdx = s.dailyHistory.findIndex((d) => d.date === prevDate)
          const newHistory =
            existingIdx >= 0
              ? s.dailyHistory.map((d, i) => (i === existingIdx ? snapshot : d))
              : [snapshot, ...s.dailyHistory]

          return {
            dailyHistory: newHistory,
            currentDate: today,
            patients: [],
            pendingPatients: { remaining: 0, treated: 0 },
          }
        }),
    }),
    {
      name: 'app-storage-v6',
    },
  ),
)
