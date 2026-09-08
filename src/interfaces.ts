import type { METADATA_STORE, SNAPSHOTS_STORE } from "./store/indexedDB"

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


export interface PaymentRecord {
  id: string
  type: 'income' | 'expense'
  amount: number
  remark: string
  collectedBy?: string
  owner?: string
  createdAt: number
}

export interface DueRecord {
  id: string
  name: string
  amount: number
  remark: string
  collectedBy?: string
  owner?: string
  createdAt: number
}

export interface DailySnapshot {
  date: string           // 'YYYY-MM-DD'
  patients: PatientItem[]
  remaining: number
  treated: number
  totalIncome: number
  totalExpense: number
  paymentRecords: PaymentRecord[]
}


export interface PendingPatients {
  remaining: number
  treated: number
}

export interface Payments {
  income: number
  expense: number
}

export interface Dues {
  totalDueMoney: number
}

export interface AppState {
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
export interface AppActions {
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
  editLocation: (oldName: string, newName: string) => boolean
  deleteLocation: (name: string) => void
  archiveDayIfNeeded: () => Promise<void>
  loadDailyHistory: () => Promise<void>
}


export interface CurrentDayState {
  pendingPatients: PendingPatients;
  payments: Payments;
  dues: Dues;
  patients: PatientItem[];
  paymentRecords: PaymentRecord[];
  dueRecords: DueRecord[];
  locations: string[];
  currentDate: string;
}

export interface DatabaseBackupPayload {
  [SNAPSHOTS_STORE]: DailySnapshot[];
  [METADATA_STORE]: Record<string, unknown>[];
  currentDayState?: CurrentDayState;
  syncKeyInfo?: {
    lastBackedUpAt: number;
  };
}

export interface ApiResponse{
  status: boolean;
  data?: DatabaseBackupPayload | string;
  error?: string;
}
