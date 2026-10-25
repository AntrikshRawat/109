import getOrInitializeSyncKey from "./syncKey";
import type { ApiResponse } from "../interfaces";
import { exportDatabaseForBackup } from "./extractData";
import { API_BASE_URL } from "../config";

/**
 * Performs a cloud backup of the database.
 * @param force If true, skips the "already synced today" check.
 * @returns true if backup succeeded, false otherwise.
 */
export async function performDailySync(force: boolean = false): Promise<boolean> {
  const today = new Date().toDateString();
  const lastSyncDate = localStorage.getItem('lastSyncDate');

  if (!force && lastSyncDate === today) {
    console.log('Daily backup already completed today:', today);
    return true;
  }

  const syncKey = getOrInitializeSyncKey();

  try {
    // 1. Extract database snapshot + current state
    const fullDatabase = await exportDatabaseForBackup();

    // 2. Setup 90s abort controller to accommodate Render free-tier cold starts
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);

    // 3. Send to server
    const response = await fetch(`${API_BASE_URL}/data/backup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ syncKey, data: fullDatabase }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    // 4. Validate HTTP status
    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.error(`Backup server returned HTTP ${response.status}:`, errText);
      return false;
    }

    // 5. Parse response
    const result: ApiResponse = await response.json();

    if (result.status === true) {
      localStorage.setItem('lastSyncDate', today);
      console.log('✅ Daily backup completed successfully');
      return true;
    } else {
      console.error('Server rejected the backup:', result.error);
      return false;
    }
  } catch (error) {
    console.error('Network or execution error during backup:', error);
    return false;
  }
}