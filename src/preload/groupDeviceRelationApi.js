/**
 * Group-Device Relationship API Bridge
 * Exposes group-device relationship IPC operations to renderer process
 */

import pkg from "electron";
const { ipcRenderer } = pkg;

/**
 * Group-device relationship API object
 */
const groupDeviceRelationApi = {
  /**
   * Add device to group
   * @param {string} deviceId - Device ID
   * @param {string} groupId - Group ID
   * @returns {Promise} Relationship result
   */
  addDeviceToGroup: (deviceId, groupId) =>
    ipcRenderer.invoke("storage:addDeviceToGroup", deviceId, groupId),

  /**
   * Remove device from group
   * @param {string} deviceId - Device ID
   * @param {string} groupId - Group ID
   * @returns {Promise} Removal result
   */
  removeDeviceFromGroup: (deviceId, groupId) =>
    ipcRenderer.invoke("storage:removeDeviceFromGroup", deviceId, groupId),

  /**
   * Get all devices in a group
   * @param {string} groupId - Group ID
   * @returns {Promise} Array of devices in group
   */
  getDevicesInGroup: (groupId) => ipcRenderer.invoke("storage:getDevicesInGroup", groupId),

  /**
   * Get all groups for a device
   * @param {string} deviceId - Device ID
   * @returns {Promise} Array of groups for device
   */
  getGroupsForDevice: (deviceId) => ipcRenderer.invoke("storage:getGroupsForDevice", deviceId),
};

export default groupDeviceRelationApi;
