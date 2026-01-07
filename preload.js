import { contextBridge, ipcRenderer } from 'electron';

console.log('[Preload] Initializing preload script');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('api', {
  scanNetwork: () => {
    console.log('[Preload] scanNetwork called, invoking IPC');
    return ipcRenderer.invoke('scan-network');
  },
  scanDeviceDetails: (ip) => {
    console.log('[Preload] scanDeviceDetails called for', ip);
    return ipcRenderer.invoke('scan-device-details', ip);
  },
});

console.log('[Preload] API exposed to renderer');
