/**
 * IPC handlers for group-device relationships
 */

import { ipcMain } from "electron";
import { log } from "./logger.js";

export function registerGroupDeviceHandlers(storage) {
  ipcMain.handle("storage:addDeviceToGroup", (event, deviceId, groupId) => {
    try {
      const success = storage.addDeviceToGroup(deviceId, groupId);
      return { success };
    } catch (error) {
      log.error("Error adding device to group:", error.message);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("storage:removeDeviceFromGroup", (event, deviceId, groupId) => {
    try {
      const success = storage.removeDeviceFromGroup(deviceId, groupId);
      return { success };
    } catch (error) {
      log.error("Error removing device from group:", error.message);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("storage:getDevicesInGroup", (event, groupId) => {
    try {
      const devices = storage.getDevicesInGroup(groupId);
      return { success: true, devices };
    } catch (error) {
      log.error("Error getting devices in group:", error.message);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("storage:getGroupsForDevice", (event, deviceId) => {
    try {
      const groups = storage.getGroupsForDevice(deviceId);
      return { success: true, groups };
    } catch (error) {
      log.error("Error getting groups for device:", error.message);
      return { success: false, error: error.message };
    }
  });
}
