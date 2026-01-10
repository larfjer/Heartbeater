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
const loggingApi = {
  startSession: (groupId, groupName) =>
    ipcRenderer.invoke("logging:start-session", groupId, groupName),
  stopSession: (groupId) => ipcRenderer.invoke("logging:stop-session", groupId),
};

const eventsApi = {
  log: (eventData) => ipcRenderer.invoke("events:log", eventData),
  queryByTime: (startTime, endTime, filters) =>
    ipcRenderer.invoke("events:query-by-time", startTime, endTime, filters),
  queryByGroup: (groupId, options) =>
    ipcRenderer.invoke("events:query-by-group", groupId, options),
  queryByDevice: (deviceId, options) =>
    ipcRenderer.invoke("events:query-by-device", deviceId, options),
  getRecent: (limit, filters) =>
    ipcRenderer.invoke("events:get-recent", limit, filters),
  getStatistics: (startTime, endTime, groupId) =>
    ipcRenderer.invoke("events:get-statistics", startTime, endTime, groupId),
  getTimeRange: () => ipcRenderer.invoke("events:get-time-range"),
  prune: (beforeDate) => ipcRenderer.invoke("events:prune", beforeDate),
  getLevels: () => ipcRenderer.invoke("events:get-levels"),
  getCategories: () => ipcRenderer.invoke("events:get-categories"),
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
  logging: {
    startSession: loggingApi.startSession,
    stopSession: loggingApi.stopSession,
  },
  events: {
    log: eventsApi.log,
    queryByTime: eventsApi.queryByTime,
    queryByGroup: eventsApi.queryByGroup,
    queryByDevice: eventsApi.queryByDevice,
    getRecent: eventsApi.getRecent,
    getStatistics: eventsApi.getStatistics,
    getTimeRange: eventsApi.getTimeRange,
    prune: eventsApi.prune,
    getLevels: eventsApi.getLevels,
    getCategories: eventsApi.getCategories,
  },
  history: {
    getSessions: (groupName) =>
      ipcRenderer.invoke("logging:get-sessions", groupName),
    getSessionData: (filename) =>
      ipcRenderer.invoke("logging:get-session-data", filename),
  },
});
