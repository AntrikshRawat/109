import { restoreDatabaseFromBackup } from "./restoreData";
import type { ApiResponse, DatabaseBackupPayload } from "../interfaces";
import { API_BASE_URL } from "../config";

export async function handleCloudRestore(syncKey: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/data/restore/${syncKey}`);
    const result: ApiResponse = await response.json();

    if (result.status === true && result.data) {
      // Server returned true and gave the JSON payload
      await restoreDatabaseFromBackup(result.data as DatabaseBackupPayload);
      return true; 
    } else {
      // Server returned false, show the error to the user
      console.error('Restore failed:', result.error);
      return false;
    }

  } catch (networkError) {
    console.error('Network error during restore:', networkError);
    return false;
  }
}