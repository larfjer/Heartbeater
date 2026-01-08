/**
 * DOM element selectors and references
 */

export const domElements = {
  // Main UI
  scanBtn: document.getElementById("scanBtn"),
  status: document.getElementById("status"),
  results: document.getElementById("results"),
  tabs: document.querySelectorAll(".tab"),
  tabContents: document.querySelectorAll(".tab-content"),
  groupsContainer: document.getElementById("groups-container"),

  // Add to Group Modal
  addToGroupModal: document.getElementById("addToGroupModal"),
  groupList: document.getElementById("groupList"),
  addToGroupCancel: document.getElementById("addToGroupCancel"),
  addToGroupConfirm: document.getElementById("addToGroupConfirm"),
  createNewGroupBtn: document.getElementById("createNewGroupBtn"),
  newGroupName: document.getElementById("newGroupName"),
  newGroupDescription: document.getElementById("newGroupDescription"),

  // Add Device Manually Modal
  addDeviceManuallyBtn: document.getElementById("addDeviceManuallyBtn"),
  addDeviceManuallyModal: document.getElementById("addDeviceManuallyModal"),
  manualDeviceName: document.getElementById("manualDeviceName"),
  manualDeviceIp: document.getElementById("manualDeviceIp"),
  manualDeviceMac: document.getElementById("manualDeviceMac"),
  manualDeviceManufacturer: document.getElementById("manualDeviceManufacturer"),
  manualDeviceFriendlyName: document.getElementById("manualDeviceFriendlyName"),
  manualDeviceGroupList: document.getElementById("manualDeviceGroupList"),
  addDeviceManuallyCancel: document.getElementById("addDeviceManuallyCancel"),
  addDeviceManuallyConfirm: document.getElementById("addDeviceManuallyConfirm"),
};

/**
 * Application state
 */
export const appState = {
  currentScannedDevices: [],
  selectedDeviceForGroup: null,
  selectedGroupIds: new Set(),
  originalGroupIds: new Set(),
  selectedGroupIdsForManualDevice: new Set(),
  originalGroupIdsForManualDevice: new Set(),
};
