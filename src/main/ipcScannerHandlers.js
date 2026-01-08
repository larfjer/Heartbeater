/**
 * IPC handlers for network scanning
 */

import { ipcMain } from "electron";
import { scanNetwork, scanDeviceDetails } from "./scanner.js";
import { log } from "./logger.js";

export function registerScannerHandlers() {
  ipcMain.handle("scan-network", async () => {
    return await scanNetwork();
  });

  ipcMain.handle("scan-device-details", async (event, ip) => {
    log.info(`Detailed scan requested for ${ip}`);
    try {
      const details = await scanDeviceDetails(ip);
      return { success: true, ...details };
    } catch (error) {
      log.error(`Detailed scan failed for ${ip}:`, error.message);
      return { success: false, error: error.message };
    }
  });
}
