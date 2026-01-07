const { contextBridge, ipcRenderer } = require('electron');

console.log('[Preload] Initializing preload script');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('api', {
  scanNetwork: () => {
    console.log('[Preload] scanNetwork called, invoking IPC');
    return ipcRenderer.invoke('scan-network');
  },
});

console.log('[Preload] API exposed to renderer');
