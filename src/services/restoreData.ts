import type { DatabaseBackupPayload } from "../interfaces"
import { METADATA_STORE, openDB, SNAPSHOTS_STORE } from "../store/indexedDB"

/** Match the same format used in useAppStore. */
const getTodayString = (): string => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export async function restoreDatabaseFromBackup(backupData: DatabaseBackupPayload): Promise<void> {
  const db = await openDB();
  // 1. Restore IndexedDB stores (dailySnapshots + metadata)
  await new Promise<void>((resolve, reject) => {
    const storeNames = [SNAPSHOTS_STORE, METADATA_STORE]
    const tx = db.transaction(storeNames, 'readwrite')

    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)

    // Restore Daily Snapshots
    if (backupData[SNAPSHOTS_STORE] && Array.isArray(backupData[SNAPSHOTS_STORE])) {
      const snapshotStore = tx.objectStore(SNAPSHOTS_STORE)
      snapshotStore.clear()
      for (const snapshot of backupData[SNAPSHOTS_STORE]) {
        snapshotStore.put(snapshot)
      }
    }

    // Restore Metadata (like migration flags or configuration)
    if (backupData[METADATA_STORE] && Array.isArray(backupData[METADATA_STORE])) {
      const metaStore = tx.objectStore(METADATA_STORE)
      metaStore.clear()
      for (const meta of backupData[METADATA_STORE]) {
        metaStore.put(meta)
      }
    }
  })

  // 2. Restore current-day state into localStorage (Zustand persist layer)
  if (backupData.currentDayState) {
    try {
      const s = backupData.currentDayState

      // IMPORTANT: Always set currentDate to TODAY so that archiveDayIfNeeded()
      // (which runs on every page load) sees currentDate === today and does NOT
      // wipe the restored data by resetting patients/payments/etc. to empty.
      const persistedData = {
        state: {
          pendingPatients: s.pendingPatients ?? { remaining: 0, treated: 0 },
          payments: s.payments ?? { income: 0, expense: 0 },
          dues: s.dues ?? { totalDueMoney: 0 },
          patients: s.patients ?? [],
          paymentRecords: s.paymentRecords ?? [],
          dueRecords: s.dueRecords ?? [],
          locations: s.locations ?? [],
          currentDate: getTodayString(),
        },
        version: 0,
      }

      localStorage.setItem('app-storage-v6', JSON.stringify(persistedData))
      console.log('✅ Restored currentDayState to localStorage')
    } catch (err) {
      console.error('Failed to restore current-day state to localStorage:', err)
    }
  }
}