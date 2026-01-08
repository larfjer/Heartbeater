/**
 * Scanner API Bridge
 * Exposes scanner IPC operations to renderer process
 */

import pkg from "electron";
const { ipcRenderer } = pkg;

/**
 * Scanner API object with network scanning operations
 */
const scannerApi = {
  /**
   * Scan network for devices
   * @returns {Promise} Network scan results
   */
  scanNetwork: () => {
    console.log("[Preload] scanNetwork called, invoking IPC");
    return ipcRenderer.invoke("scan-network");
  },

  /**
   * Scan device details at IP address
   * @param {string} ip - IP address to scan
   * @returns {Promise} Device details
   */
  scanDeviceDetails: (ip) => {
    console.log("[Preload] scanDeviceDetails called for", ip);
    return ipcRenderer.invoke("scan-device-details", ip);
  },
};

export default scannerApi;
