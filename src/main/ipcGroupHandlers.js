/**
 * IPC handlers for group storage operations
 */

import { ipcMain } from "electron";
import { log } from "./logger.js";

export function registerGroupStorageHandlers(storage) {
  ipcMain.handle("storage:createGroup", (event, name, description) => {
    try {
      const group = storage.createGroup(name, description);
      return { success: true, group };
    } catch (error) {
      log.error("Error creating group:", error.message);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("storage:updateGroup", (event, groupId, name, description) => {
    try {
      const success = storage.updateGroup(groupId, name, description);
      return { success };
    } catch (error) {
      log.error("Error updating group:", error.message);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("storage:getGroup", (event, groupId) => {
    try {
      const group = storage.getGroup(groupId);
      return { success: true, group };
    } catch (error) {
      log.error("Error getting group:", error.message);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("storage:getAllGroups", () => {
    try {
      const groups = storage.getAllGroups();
      return { success: true, groups };
    } catch (error) {
      log.error("Error getting all groups:", error.message);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("storage:deleteGroup", (event, groupId) => {
    try {
      const success = storage.deleteGroup(groupId);
      return { success };
    } catch (error) {
      log.error("Error deleting group:", error.message);
      return { success: false, error: error.message };
    }
  });
}
