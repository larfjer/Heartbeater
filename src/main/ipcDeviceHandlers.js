/**
 * IPC handlers for device storage operations
 */

import { ipcMain } from "electron";
import { log } from "./logger.js";

export function registerDeviceStorageHandlers(storage) {
  ipcMain.handle("storage:addDevice", (event, device) => {
    try {
      const result = storage.addDevice(device);
      return { success: true, data: { id: result.id } };
    } catch (error) {
      log.error("Error adding device:", error.message);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(
    "storage:updateDeviceFriendlyName",
    (event, deviceId, friendlyName) => {
      try {
        const success = storage.updateDeviceFriendlyName(
          deviceId,
          friendlyName,
        );
        return { success };
      } catch (error) {
        log.error("Error updating friendly name:", error.message);
        return { success: false, error: error.message };
      }
    },
  );

  ipcMain.handle("storage:getDevice", (event, deviceId) => {
    try {
      const device = storage.getDevice(deviceId);
      return { success: true, device };
    } catch (error) {
      log.error("Error getting device:", error.message);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("storage:getDeviceByMac", (event, mac) => {
    try {
      const device = storage.getDeviceByMac(mac);
      return { success: true, device };
    } catch (error) {
      log.error("Error getting device by MAC:", error.message);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("storage:getAllDevices", () => {
    try {
      const devices = storage.getAllDevices();
      return { success: true, devices };
    } catch (error) {
      log.error("Error getting all devices:", error.message);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("storage:getDeviceDisplayName", (event, deviceId) => {
    try {
      const name = storage.getDeviceDisplayName(deviceId);
      return { success: true, name };
    } catch (error) {
      log.error("Error getting device display name:", error.message);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("storage:removeDevice", (event, deviceId) => {
    try {
      const success = storage.removeDevice(deviceId);
      return { success };
    } catch (error) {
      log.error("Error removing device:", error.message);
      return { success: false, error: error.message };
    }
  });
}
