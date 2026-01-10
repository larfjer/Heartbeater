/**
 * Ping Manager - Handles background pinging of devices
 * Each device runs in its own worker thread for true parallel execution
 */

import { ipcMain } from "electron";
import { log } from "./logger.js";
import sessionLogger from "./sessionLogger.js";
import eventLogger, { EventCategory, EventLevel } from "./eventLogger.js";
import { pingWorkerManager } from "./pingWorkerManager.js";

class PingManager {
  constructor() {
    this.activeWorkers = new Map(); // Maps deviceId -> { worker, isAvailable }
  }

  /**
   * Start pinging a device in a new worker thread
   * @param {string} deviceId - Unique device identifier
   * @param {string} ipAddress - IP address to ping
   * @param {number} intervalMs - Interval between pings in milliseconds
   * @param {BrowserWindow} mainWindow - Main window to send updates to
   * @param {Object} config - Configuration object with cvThreshold and responseTimeThreshold
   */
  startPing(deviceId, ipAddress, intervalMs, mainWindow, config) {
    // Delegate worker orchestration to pingWorkerManager
    return pingWorkerManager.startPing(
      deviceId,
      ipAddress,
      intervalMs,
      mainWindow,
      config,
    );
  }

  /**
   * Stop pinging a device
   * @param {string} deviceId - Device identifier
   */
  stopPing(deviceId) {
    const workerInfo = this.activeWorkers.get(deviceId);

    if (workerInfo) {
      const { worker } = workerInfo;
      // Send stop command to worker
      worker.postMessage({ command: "stop" });
      // Terminate the worker
      worker.terminate();
      this.activeWorkers.delete(deviceId);
      log.info(`Stopped pinging device ${deviceId}`);
    }
  }

  /**
   * Stop all active pings
   */
  stopAllPings() {
    for (const [deviceId] of this.activeWorkers) {
      this.stopPing(deviceId);
    }
    log.info("Stopped all pings");
  }

  /**
   * Get availability status of a device
   * @param {string} deviceId - Device identifier
   * @returns {boolean|null} true if available, false if unavailable, null if not pinging
   */
  getAvailabilityStatus(deviceId) {
    const workerInfo = this.activeWorkers.get(deviceId);
    return workerInfo ? workerInfo.isAvailable : null;
  }

  /**
   * Get detailed status information for a device
   * @param {string} deviceId - Device identifier
   * @returns {object|null} Detailed status object or null if not pinging
   */
  getDetailedStatus(deviceId) {
    const workerInfo = this.activeWorkers.get(deviceId);
    if (!workerInfo) return null;

    return {
      deviceId,
      ipAddress: workerInfo.ipAddress,
      isAvailable: workerInfo.isAvailable,
      lastStatusUpdate: workerInfo.lastStatusUpdate,
    };
  }

  /**
   * Get status history for a device
   * @param {string} deviceId - Device identifier
   * @returns {object|null} Status metrics including ping counts and failures
   */
  getStatusMetrics(deviceId) {
    const workerInfo = this.activeWorkers.get(deviceId);
    if (!workerInfo || !workerInfo.lastStatusUpdate) return null;

    const {
      totalPings,
      totalFailures,
      consecutiveSuccesses,
      consecutiveFailures,
    } = workerInfo.lastStatusUpdate;

    return {
      deviceId,
      totalPings: totalPings || 0,
      totalFailures: totalFailures || 0,
      successRate: totalPings
        ? (((totalPings - totalFailures) / totalPings) * 100).toFixed(2)
        : 0,
      consecutiveSuccesses: consecutiveSuccesses || 0,
      consecutiveFailures: consecutiveFailures || 0,
      responseTime: workerInfo.lastStatusUpdate.responseTime || null,
    };
  }

  /**
   * Get count of active pings
   * @returns {number} Number of devices currently being pinged
   */
  getActivePingCount() {
    return this.activeWorkers.size;
  }

  /**
   * Get list of devices being pinged
   * @returns {Array<{deviceId, ipAddress}>} List of devices being pinged
   */
  getActivePings() {
    const pings = [];
    for (const [deviceId, workerInfo] of this.activeWorkers) {
      pings.push({
        deviceId,
        ipAddress: workerInfo.ipAddress,
      });
    }
    return pings;
  }
}

// Export singleton instance
const pingManager = new PingManager();

/**
 * Register IPC handlers for ping management
 * @param {BrowserWindow} mainWindow - Main application window
 */
export function registerPingHandlers(mainWindow) {
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
      const workerInfo = pingManager.activeWorkers.get(deviceId);
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

export { pingManager };
