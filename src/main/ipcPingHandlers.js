import { ipcMain } from "electron";
import { log } from "./logger.js";
import { pingManager } from "./pingManager.js";
import eventLogger, { EventCategory } from "./eventLogger.js";

export function initializePingHandlers(mainWindow) {
  ipcMain.handle(
    "ping:start",
    (event, deviceId, ipAddress, intervalMs, config) => {
      try {
        pingManager.startPing(
          deviceId,
          ipAddress,
          intervalMs,
          mainWindow,
          config,
        );

        // Log ping start event
        eventLogger.info(
          EventCategory.PING,
          "ping_started",
          `Started pinging device ${ipAddress}`,
          {
            deviceId,
            deviceIp: ipAddress,
            groupId: config?.logging?.groupId || null,
            groupName: config?.logging?.groupName || null,
            source: "pingManager",
            metadata: { intervalMs },
          },
        );

        return { success: true };
      } catch (error) {
        log.error(`Error starting ping for device ${deviceId}:`, error.message);
        return { success: false, error: error.message };
      }
    },
  );

  ipcMain.handle("ping:stop", (event, deviceId) => {
    try {
      const workerInfo = pingManager.activeWorkers?.get(deviceId);
      const ipAddress = workerInfo?.ipAddress;

      pingManager.stopPing(deviceId);

      // Log ping stop event
      if (ipAddress) {
        eventLogger.info(
          EventCategory.PING,
          "ping_stopped",
          `Stopped pinging device ${ipAddress}`,
          {
            deviceId,
            deviceIp: ipAddress,
            source: "pingManager",
          },
        );
      }

      return { success: true };
    } catch (error) {
      log.error(`Error stopping ping for device ${deviceId}:`, error.message);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("ping:stopAll", (_event) => {
    try {
      pingManager.stopAllPings();
      return { success: true };
    } catch (error) {
      log.error("Error stopping all pings:", error.message);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("ping:getStatus", (event, deviceId) => {
    try {
      const status = pingManager.getAvailabilityStatus(deviceId);
      return { success: true, available: status };
    } catch (error) {
      log.error(
        `Error getting ping status for device ${deviceId}:`,
        error.message,
      );
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("ping:getActivePingCount", (_event) => {
    try {
      const count = pingManager.getActivePingCount();
      return { success: true, count };
    } catch (error) {
      log.error("Error getting active ping count:", error.message);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("ping:getActivePings", (_event) => {
    try {
      const pings = pingManager.getActivePings();
      return { success: true, pings };
    } catch (error) {
      log.error("Error getting active pings:", error.message);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("ping:getDetailedStatus", (event, deviceId) => {
    try {
      const status = pingManager.getDetailedStatus(deviceId);
      return { success: true, status };
    } catch (error) {
      log.error(
        `Error getting detailed status for device ${deviceId}:`,
        error.message,
      );
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("ping:getStatusMetrics", (event, deviceId) => {
    try {
      const metrics = pingManager.getStatusMetrics(deviceId);
      return { success: true, metrics };
    } catch (error) {
      log.error(
        `Error getting status metrics for device ${deviceId}:`,
        error.message,
      );
      return { success: false, error: error.message };
    }
  });
}

export default initializePingHandlers;
