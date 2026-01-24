import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Folder selection
  selectDataFolder: () => ipcRenderer.invoke('select-data-folder'),
  getDataPath: () => ipcRenderer.invoke('get-data-path'),

  // Password/Encryption
  setPassword: (password: string, remember: boolean) =>
    ipcRenderer.invoke('set-password', password, remember),
  verifyPassword: (password: string) =>
    ipcRenderer.invoke('verify-password', password),
  getSavedPassword: () => ipcRenderer.invoke('get-saved-password'),
  clearSavedPassword: () => ipcRenderer.invoke('clear-saved-password'),

  // Daily entries
  getDailyEntries: (startDate?: string, endDate?: string) =>
    ipcRenderer.invoke('get-daily-entries', startDate, endDate),
  saveDailyEntry: (entry: any) =>
    ipcRenderer.invoke('save-daily-entry', entry),
  deleteDailyEntry: (entryId: string) =>
    ipcRenderer.invoke('delete-daily-entry', entryId),

  // App data
  getAppData: () => ipcRenderer.invoke('get-app-data'),
  saveAppData: (data: any) =>
    ipcRenderer.invoke('save-app-data', data),

  // Search
  searchEntries: (query: string, tags: string[]) =>
    ipcRenderer.invoke('search-entries', query, tags),

  // Export
  exportData: (format: 'csv' | 'json', startDate: string, endDate: string) =>
    ipcRenderer.invoke('export-data', format, startDate, endDate),
});
