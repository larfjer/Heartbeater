const { contextBridge, ipcRenderer } = require("electron");

const scannerApi = {
  scanNetwork: () => ipcRenderer.invoke("scan-network"),
  scanDeviceDetails: (ip) => ipcRenderer.invoke("scan-device-details", ip),
};

const deviceStorageApi = {
  addDevice: (device) => ipcRenderer.invoke("storage:addDevice", device),
  updateDeviceFriendlyName: (deviceId, friendlyName) =>
    ipcRenderer.invoke(
      "storage:updateDeviceFriendlyName",
      deviceId,
      friendlyName,
    ),
  getDevice: (deviceId) => ipcRenderer.invoke("storage:getDevice", deviceId),
  getDeviceByMac: (mac) => ipcRenderer.invoke("storage:getDeviceByMac", mac),
  getAllDevices: () => ipcRenderer.invoke("storage:getAllDevices"),
  getDeviceDisplayName: (deviceId) =>
    ipcRenderer.invoke("storage:getDeviceDisplayName", deviceId),
  removeDevice: (deviceId) =>
    ipcRenderer.invoke("storage:removeDevice", deviceId),
};

const groupStorageApi = {
  createGroup: (name, description) =>
    ipcRenderer.invoke("storage:createGroup", name, description),
  updateGroup: (groupId, name, description) =>
    ipcRenderer.invoke("storage:updateGroup", groupId, name, description),
  getGroup: (groupId) => ipcRenderer.invoke("storage:getGroup", groupId),
  getAllGroups: () => ipcRenderer.invoke("storage:getAllGroups"),
  deleteGroup: (groupId) => ipcRenderer.invoke("storage:deleteGroup", groupId),
};

const groupDeviceRelationApi = {
  addDeviceToGroup: (deviceId, groupId) =>
    ipcRenderer.invoke("storage:addDeviceToGroup", deviceId, groupId),
  removeDeviceFromGroup: (deviceId, groupId) =>
    ipcRenderer.invoke("storage:removeDeviceFromGroup", deviceId, groupId),
  getDevicesInGroup: (groupId) =>
    ipcRenderer.invoke("storage:getDevicesInGroup", groupId),
  getGroupsForDevice: (deviceId) =>
    ipcRenderer.invoke("storage:getGroupsForDevice", deviceId),
};

const pingApi = {
  startPing: (deviceId, ipAddress, intervalMs, config) =>
    ipcRenderer.invoke("ping:start", deviceId, ipAddress, intervalMs, config),
  stopPing: (deviceId) => ipcRenderer.invoke("ping:stop", deviceId),
  stopAllPings: () => ipcRenderer.invoke("ping:stopAll"),
  getStatus: (deviceId) => ipcRenderer.invoke("ping:getStatus", deviceId),
  getActivePingCount: () => ipcRenderer.invoke("ping:getActivePingCount"),
  getActivePings: () => ipcRenderer.invoke("ping:getActivePings"),
  getDetailedStatus: (deviceId) =>
    ipcRenderer.invoke("ping:getDetailedStatus", deviceId),
  getStatusMetrics: (deviceId) =>
    ipcRenderer.invoke("ping:getStatusMetrics", deviceId),
  onAvailabilityChanged: (callback) =>
    ipcRenderer.on("device:availability-changed", (_event, data) =>
      callback(data),
    ),
  onStatusUpdated: (callback) =>
    ipcRenderer.on("device:status-updated", (_event, data) => callback(data)),
};

contextBridge.exposeInMainWorld("api", {
  scanNetwork: scannerApi.scanNetwork,
  scanDeviceDetails: scannerApi.scanDeviceDetails,
  storage: {
    addDevice: deviceStorageApi.addDevice,
    updateDeviceFriendlyName: deviceStorageApi.updateDeviceFriendlyName,
    getDevice: deviceStorageApi.getDevice,
    getDeviceByMac: deviceStorageApi.getDeviceByMac,
    getAllDevices: deviceStorageApi.getAllDevices,
    getDeviceDisplayName: deviceStorageApi.getDeviceDisplayName,
    removeDevice: deviceStorageApi.removeDevice,
    createGroup: groupStorageApi.createGroup,
    updateGroup: groupStorageApi.updateGroup,
    getGroup: groupStorageApi.getGroup,
    getAllGroups: groupStorageApi.getAllGroups,
    deleteGroup: groupStorageApi.deleteGroup,
    addDeviceToGroup: groupDeviceRelationApi.addDeviceToGroup,
    removeDeviceFromGroup: groupDeviceRelationApi.removeDeviceFromGroup,
    getDevicesInGroup: groupDeviceRelationApi.getDevicesInGroup,
    getGroupsForDevice: groupDeviceRelationApi.getGroupsForDevice,
  },
  ping: {
    start: pingApi.startPing,
    stop: pingApi.stopPing,
    stopAll: pingApi.stopAllPings,
    getStatus: pingApi.getStatus,
    getActivePingCount: pingApi.getActivePingCount,
    getActivePings: pingApi.getActivePings,
    getDetailedStatus: pingApi.getDetailedStatus,
    getStatusMetrics: pingApi.getStatusMetrics,
    onAvailabilityChanged: pingApi.onAvailabilityChanged,
    onStatusUpdated: pingApi.onStatusUpdated,
  },
});
