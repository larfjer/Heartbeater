/**
 * Ping Manager - Handles background pinging of devices
 * Each device runs in its own worker thread for true parallel execution
 */

import { log } from "./logger.js";
import { pingWorkerManager } from "./pingWorkerManager.js";

class PingManager {
  constructor() {
    this.activeWorkers = new Map(); // Maps deviceId -> { worker, isAvailable }
    this._initialized = false;
    this._app = null;
  }

  /**
   * Initialize PingManager with optional app or options.
   * This is a no-op for backward compatibility but provides an explicit
   * initialization entrypoint for tests and runtime.
   */
  initialize(options = {}) {
    this._initialized = true;
    if (options.app) this._app = options.app;
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
// IPC registration has been moved to src/main/ipcPingHandlers.js

export { pingManager };
