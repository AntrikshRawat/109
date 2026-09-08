import getOrInitializeSyncKey from "./syncKey";
import type { ApiResponse } from "../interfaces";
import { exportDatabaseForBackup } from "./extractData";
import { API_BASE_URL } from "../config";


export async function performDailySync(): Promise<void> {
  const today = new Date().toDateString();
  const lastSyncDate = localStorage.getItem('lastSyncDate');

  if (lastSyncDate !== today) {
    const syncKey = getOrInitializeSyncKey(); 

    try {
      // 1. Extract the data using the function
      const fullDatabaseJSON = await exportDatabaseForBackup();

      // 2. Send it to the server
      const response = await fetch(`${API_BASE_URL}/data/backup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ syncKey, data: fullDatabaseJSON })
      });
      
      // 3. Parse the standardized response
      const result: ApiResponse = await response.json();

      // 4. Handle based on status 
      if (result.status === true) {
        localStorage.setItem('lastSyncDate', today);
        console.log('Daily backup completed',);
      } else {
        console.error('Server rejected the backup:', result.error);
      }

    } catch (networkError) {
      console.error('Network error during backup:', networkError);
    }
  }
}