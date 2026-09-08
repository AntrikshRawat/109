export default function getOrInitializeSyncKey() {
  let syncKey = localStorage.getItem('syncKey');
  if (!syncKey) {
    syncKey = crypto.randomUUID(); 
    localStorage.setItem('syncKey', syncKey);
  }
  return syncKey;
}