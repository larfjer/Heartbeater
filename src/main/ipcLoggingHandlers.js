import { ipcMain } from "electron";
import sessionLogger from "./sessionLogger.js";

export default function setupLoggingHandlers() {
  ipcMain.handle("logging:start-session", async (event, groupId, groupName) => {
    try {
      const filename = sessionLogger.startSession(groupId, groupName);
      return { success: true, filename };
    } catch (error) {
      console.error("Error starting logging session:", error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("logging:stop-session", (event, groupId) => {
    try {
      sessionLogger.stopSession(groupId);
      return { success: true };
    } catch (error) {
      console.error("Error stopping logging session:", error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("logging:get-sessions", (event, groupName) => {
    try {
      console.log("Getting sessions for group:", groupName);
      const sessions = sessionLogger.getAvailableSessions(groupName);
      return { success: true, sessions };
    } catch (error) {
      console.error("Error getting sessions:", error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("logging:get-session-data", (event, filename) => {
    try {
      const data = sessionLogger.getSessionData(filename);
      return { success: true, data };
    } catch (error) {
      console.error("Error getting session data:", error);
      return { success: false, error: error.message };
    }
  });
}
