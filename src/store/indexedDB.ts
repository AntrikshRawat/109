import type { DailySnapshot } from './useAppStore'

/* ── Constants ───────────────────────────────────────────────────────── */
const DB_NAME = 'medical-dashboard-db'
const DB_VERSION = 1
const SNAPSHOTS_STORE = 'dailySnapshots'
const METADATA_STORE = 'metadata'

/* ── Database Connection (singleton) ─────────────────────────────────── */
let dbInstance: IDBDatabase | null = null

function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance)

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      dbInstance = request.result
      resolve(dbInstance)
    }
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(SNAPSHOTS_STORE)) {
        db.createObjectStore(SNAPSHOTS_STORE, { keyPath: 'date' })
      }
      if (!db.objectStoreNames.contains(METADATA_STORE)) {
        db.createObjectStore(METADATA_STORE, { keyPath: 'key' })
      }
    }
  })
}

/* ── Snapshot CRUD ───────────────────────────────────────────────────── */

/** Save or overwrite a single daily snapshot (keyed by date). */
export async function saveSnapshot(snapshot: DailySnapshot): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SNAPSHOTS_STORE, 'readwrite')
    tx.objectStore(SNAPSHOTS_STORE).put(snapshot)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/** Load every snapshot, sorted newest-first. */
export async function getAllSnapshots(): Promise<DailySnapshot[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SNAPSHOTS_STORE, 'readonly')
    const request = tx.objectStore(SNAPSHOTS_STORE).getAll()
    request.onsuccess = () => {
      const snapshots = request.result as DailySnapshot[]
      snapshots.sort((a, b) => b.date.localeCompare(a.date))
      resolve(snapshots)
    }
    request.onerror = () => reject(request.error)
  })
}

/** Return the total number of stored snapshots. */
export async function getSnapshotCount(): Promise<number> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SNAPSHOTS_STORE, 'readonly')
    const request = tx.objectStore(SNAPSHOTS_STORE).count()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/** Apply an updater function to every snapshot (e.g. location rename). */
export async function updateAllSnapshots(
  updater: (snapshot: DailySnapshot) => DailySnapshot,
): Promise<void> {
  const db = await openDB()
  const snapshots = await getAllSnapshots()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SNAPSHOTS_STORE, 'readwrite')
    const store = tx.objectStore(SNAPSHOTS_STORE)
    for (const snap of snapshots) {
      store.put(updater(snap))
    }
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/* ── Migration ───────────────────────────────────────────────────────── */

export interface MigrationResult {
  success: boolean
  snapshotsMigrated: number
  alreadyMigrated: boolean
  backupKey: string | null
  error?: string
}

/**
 * Migrate `dailyHistory` from localStorage → IndexedDB.
 *
 * Safety guarantees:
 *  1. Creates a full backup at `app-storage-v6-backup` before touching anything.
 *  2. Does NOT delete the original localStorage key.
 *  3. Verifies the snapshot count after writing.
 *  4. Records a migration flag in IndexedDB metadata so it only runs once.
 */
export async function migrateFromLocalStorage(): Promise<MigrationResult> {
  try {
    const db = await openDB()

    // ── Check if migration already completed ──
    const existingMeta = await new Promise<Record<string, unknown> | undefined>(
      (resolve, reject) => {
        const tx = db.transaction(METADATA_STORE, 'readonly')
        const request = tx.objectStore(METADATA_STORE).get('migration-v6')
        request.onsuccess = () => resolve(request.result as Record<string, unknown> | undefined)
        request.onerror = () => reject(request.error)
      },
    )

    if (existingMeta?.completed) {
      return {
        success: true,
        snapshotsMigrated: (existingMeta.snapshotCount as number) || 0,
        alreadyMigrated: true,
        backupKey: (existingMeta.backupKey as string) || null,
      }
    }

    // ── Read current localStorage data ──
    const raw = localStorage.getItem('app-storage-v6')
    if (!raw) {
      return { success: true, snapshotsMigrated: 0, alreadyMigrated: false, backupKey: null }
    }

    const parsed = JSON.parse(raw)
    const state = parsed.state
    const dailyHistory: DailySnapshot[] = state?.dailyHistory || []

    if (dailyHistory.length === 0) {
      // Nothing to migrate — mark as done so we don't re-check every load
      const metaTx = db.transaction(METADATA_STORE, 'readwrite')
      metaTx.objectStore(METADATA_STORE).put({
        key: 'migration-v6',
        completed: true,
        completedAt: Date.now(),
        snapshotCount: 0,
        sourceKey: 'app-storage-v6',
        backupKey: null,
      })
      return { success: true, snapshotsMigrated: 0, alreadyMigrated: false, backupKey: null }
    }

    // ── Step 1: Create backup in localStorage ──
    const backupKey = 'app-storage-v6-backup'
    localStorage.setItem(backupKey, raw)
    console.log(`📋 Backup created at localStorage key: "${backupKey}"`)

    // ── Step 2: Write all snapshots to IndexedDB ──
    const writeTx = db.transaction(SNAPSHOTS_STORE, 'readwrite')
    const store = writeTx.objectStore(SNAPSHOTS_STORE)
    for (const snapshot of dailyHistory) {
      store.put(snapshot)
    }
    await new Promise<void>((resolve, reject) => {
      writeTx.oncomplete = () => resolve()
      writeTx.onerror = () => reject(writeTx.error)
    })

    // ── Step 3: Verify migration ──
    const count = await getSnapshotCount()
    if (count < dailyHistory.length) {
      return {
        success: false,
        snapshotsMigrated: count,
        alreadyMigrated: false,
        backupKey,
        error: `Verification failed: only ${count} of ${dailyHistory.length} snapshots were written`,
      }
    }

    // ── Step 4: Mark migration as complete ──
    const metaTx = db.transaction(METADATA_STORE, 'readwrite')
    metaTx.objectStore(METADATA_STORE).put({
      key: 'migration-v6',
      completed: true,
      completedAt: Date.now(),
      snapshotCount: dailyHistory.length,
      sourceKey: 'app-storage-v6',
      backupKey,
    })
    await new Promise<void>((resolve, reject) => {
      metaTx.oncomplete = () => resolve()
      metaTx.onerror = () => reject(metaTx.error)
    })

    console.log(`✅ Migration complete: ${dailyHistory.length} snapshots moved to IndexedDB`)
    console.log(`📋 Backup preserved at localStorage key: "${backupKey}"`)
    console.log(`🔒 Original "app-storage-v6" key left untouched in localStorage`)

    return {
      success: true,
      snapshotsMigrated: dailyHistory.length,
      alreadyMigrated: false,
      backupKey,
    }
  } catch (error) {
    console.error('❌ Migration failed:', error)
    return {
      success: false,
      snapshotsMigrated: 0,
      alreadyMigrated: false,
      backupKey: null,
      error: String(error),
    }
  }
}
