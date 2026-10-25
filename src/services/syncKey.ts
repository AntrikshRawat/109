function generateUUID(): string {
  // Use crypto.randomUUID if available (Secure Contexts / HTTPS)
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for non-HTTPS / older environments
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function getOrInitializeSyncKey(): string {
  let syncKey = localStorage.getItem('syncKey');
  if (!syncKey) {
    syncKey = generateUUID();
    localStorage.setItem('syncKey', syncKey);
  }
  return syncKey;
}