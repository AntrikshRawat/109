import { openDB } from "../store/indexedDB"
import type { DatabaseBackupPayload, CurrentDayState } from "../interfaces"
import { SNAPSHOTS_STORE, METADATA_STORE } from "../store/indexedDB"

export async function exportDatabaseForBackup(): Promise<DatabaseBackupPayload> {
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const storeNames = [SNAPSHOTS_STORE, METADATA_STORE]
    const backupData: Partial<DatabaseBackupPayload> = {}
    let completedStores = 0

    const tx = db.transaction(storeNames, 'readonly')
    tx.onerror = () => reject(tx.error)

    for (const storeName of storeNames) {
      const store = tx.objectStore(storeName)
      const request = store.getAll()

      request.onsuccess = () => {
        backupData[storeName as keyof DatabaseBackupPayload] = request.result as any
        completedStores++

        if (completedStores === storeNames.length) {
          // Also capture current-day state from localStorage (Zustand persisted data)
          try {
            const raw = localStorage.getItem('app-storage-v6')
            if (raw) {
              const parsed = JSON.parse(raw)
              const state = parsed.state
              if (state) {
                backupData.currentDayState = {
                  pendingPatients: state.pendingPatients,
                  payments: state.payments,
                  dues: state.dues,
                  patients: state.patients || [],
                  paymentRecords: state.paymentRecords || [],
                  dueRecords: state.dueRecords || [],
                  locations: state.locations || [],
                  currentDate: state.currentDate,
                } satisfies CurrentDayState
              }
            }
          } catch (err) {
            console.warn('Could not capture current-day state for backup:', err)
          }

          // Attach sync metadata
          backupData.syncKeyInfo = { lastBackedUpAt: Date.now() }
          resolve(backupData as DatabaseBackupPayload)
        }
      }
      request.onerror = () => reject(request.error)
    }
  })
}