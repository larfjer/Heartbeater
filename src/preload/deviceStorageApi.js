/**
 * Device Storage API Bridge
 * Exposes device storage/CRUD IPC operations to renderer process
 */

import pkg from "electron";
const { ipcRenderer } = pkg;

/**
 * Device storage API object with CRUD operations
 */
const deviceStorageApi = {
  /**
   * Add a new device to storage
   * @param {Object} device - Device object
   * @returns {Promise} Added device
   */
  addDevice: (device) => ipcRenderer.invoke("storage:addDevice", device),

  /**
   * Update device friendly name
   * @param {string} deviceId - Device ID
   * @param {string} friendlyName - New friendly name
   * @returns {Promise} Update result
   */
  updateDeviceFriendlyName: (deviceId, friendlyName) =>
    ipcRenderer.invoke(
      "storage:updateDeviceFriendlyName",
      deviceId,
      friendlyName,
    ),

  /**
   * Get device by ID
   * @param {string} deviceId - Device ID
   * @returns {Promise} Device object
   */
  getDevice: (deviceId) => ipcRenderer.invoke("storage:getDevice", deviceId),

  /**
   * Get device by MAC address
   * @param {string} mac - MAC address
   * @returns {Promise} Device object
   */
  getDeviceByMac: (mac) => ipcRenderer.invoke("storage:getDeviceByMac", mac),

  /**
   * Get all devices
   * @returns {Promise} Array of devices
   */
  getAllDevices: () => ipcRenderer.invoke("storage:getAllDevices"),

  /**
   * Get device display name (friendly name or original name)
   * @param {string} deviceId - Device ID
   * @returns {Promise} Display name
   */
  getDeviceDisplayName: (deviceId) =>
    ipcRenderer.invoke("storage:getDeviceDisplayName", deviceId),

  /**
   * Remove device from storage
   * @param {string} deviceId - Device ID
   * @returns {Promise} Removal result
   */
  removeDevice: (deviceId) =>
    ipcRenderer.invoke("storage:removeDevice", deviceId),
};

export default deviceStorageApi;
