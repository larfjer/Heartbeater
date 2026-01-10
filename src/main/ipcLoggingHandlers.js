import { ipcMain } from "electron";
import sessionLogger from "./sessionLogger.js";

export default function setupLoggingHandlers() {
  ipcMain.handle("logging:start-session", async (event, groupId) => {
    try {
      const filename = sessionLogger.startSession(groupId);
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
}
