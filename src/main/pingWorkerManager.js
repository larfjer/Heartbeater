import { Worker } from "worker_threads";
import path from "path";
import { fileURLToPath } from "url";
import { log } from "./logger.js";
import sessionLogger from "./sessionLogger.js";
import eventLogger, { EventCategory, EventLevel } from "./eventLogger.js";

const __filename = (() => {
  try {
    return fileURLToPath(import.meta.url);
  } catch {
    return path.join(process.cwd(), "index.js");
  }
})();
const __dirname = path.dirname(__filename);

class PingWorkerManager {
  constructor() {
    this.activeWorkers = new Map();
  }

  handleWorkerMessage(deviceId, message, mainWindow, config, state) {
    const { type, status, available, message: msg, ...statusData } = message;

    if (type === "started") {
      log.info(msg);
    } else if (type === "stopped") {
      log.info(msg);
    } else if (type === "status") {
      const previouslyAvailable = state.isAvailable;

      state.isAvailable = status === "available" || status === "responding";
      state.lastStatusUpdate = {
        ...statusData,
        status,
        deviceId,
        timestamp: message.timestamp,
      };

      if (previouslyAvailable !== state.isAvailable) {
        eventLogger.log({
          level: state.isAvailable ? EventLevel.INFO : EventLevel.WARNING,
          category: EventCategory.DEVICE,
          eventType: state.isAvailable
            ? "device_available"
            : "device_unavailable",
          message: `Device ${statusData.ipAddress} became ${state.isAvailable ? "available" : "unavailable"}`,
          deviceId,
          deviceIp: statusData.ipAddress,
          groupId: config?.logging?.groupId || null,
          groupName: config?.logging?.groupName || null,
          source: "pingWorker",
          metadata: {
            status,
            responseTime: statusData.responseTime,
            consecutiveFailures: statusData.consecutiveFailures,
            consecutiveSuccesses: statusData.consecutiveSuccesses,
            coefficientOfVariation: statusData.coefficientOfVariation,
          },
        });
      }

      if (status === "poor-connection") {
        eventLogger.log({
          level: EventLevel.WARNING,
          category: EventCategory.PING,
          eventType: "poor_connection",
          message: `Poor connection detected for ${statusData.ipAddress}`,
          deviceId,
          deviceIp: statusData.ipAddress,
          groupId: config?.logging?.groupId || null,
          groupName: config?.logging?.groupName || null,
          source: "pingWorker",
          metadata: {
            responseTime: statusData.responseTime,
            coefficientOfVariation: statusData.coefficientOfVariation,
          },
        });
      }

      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("device:status-updated", {
          deviceId,
          ...state.lastStatusUpdate,
        });
      }
    } else if (type === "log_attempt") {
      if (config?.logging?.enabled && config?.logging?.groupId) {
        sessionLogger.logPing(config.logging.groupId, message.data);
      }
    } else if (type === "full-status") {
      state.isAvailable = available;
    }
  }

  startPing(deviceId, ipAddress, intervalMs, mainWindow, config) {
    if (this.activeWorkers.has(deviceId)) {
      this.stopPing(deviceId);
    }

    const workerPath = path.join(__dirname, "pingWorker.js");
    const worker = new Worker(workerPath);

    const state = {
      worker,
      isAvailable: true,
      ipAddress,
      lastStatusUpdate: null,
    };

    worker.on("message", (message) => {
      this.handleWorkerMessage(deviceId, message, mainWindow, config, state);
    });

    worker.on("error", (error) => {
      log.error(`Worker error for device ${deviceId}:`, error);
      eventLogger.error(
        EventCategory.PING,
        "worker_error",
        `Worker error for device ${ipAddress}: ${error.message}`,
        {
          deviceId,
          deviceIp: ipAddress,
          groupId: config?.logging?.groupId || null,
          groupName: config?.logging?.groupName || null,
          source: "pingWorker",
          metadata: { error: error.message },
        },
      );
    });

    worker.on("exit", (code) => {
      log.debug(`Worker for device ${deviceId} exited with code ${code}`);
      this.activeWorkers.delete(deviceId);
    });

    this.activeWorkers.set(deviceId, state);

    worker.postMessage({ command: "start", ipAddress, intervalMs, config });

    log.info(
      `Started pinging device ${deviceId} (${ipAddress}) every ${intervalMs}ms in worker thread`,
    );
  }

  stopPing(deviceId) {
    const state = this.activeWorkers.get(deviceId);
    if (!state) return;
    const { worker } = state;
    worker.postMessage({ command: "stop" });
    worker.terminate();
    this.activeWorkers.delete(deviceId);
    log.info(`Stopped pinging device ${deviceId}`);
  }

  stopAllPings() {
    for (const [deviceId] of this.activeWorkers) this.stopPing(deviceId);
    log.info("Stopped all pings");
  }

  getAvailabilityStatus(deviceId) {
    const state = this.activeWorkers.get(deviceId);
    return state ? state.isAvailable : null;
  }

  getDetailedStatus(deviceId) {
    const state = this.activeWorkers.get(deviceId);
    if (!state) return null;
    return {
      deviceId,
      ipAddress: state.ipAddress,
      isAvailable: state.isAvailable,
      lastStatusUpdate: state.lastStatusUpdate,
    };
  }

  getStatusMetrics(deviceId) {
    const state = this.activeWorkers.get(deviceId);
    if (!state || !state.lastStatusUpdate) return null;
    const {
      totalPings,
      totalFailures,
      consecutiveSuccesses,
      consecutiveFailures,
    } = state.lastStatusUpdate;
    return {
      deviceId,
      totalPings: totalPings || 0,
      totalFailures: totalFailures || 0,
      successRate: totalPings
        ? (((totalPings - totalFailures) / totalPings) * 100).toFixed(2)
        : 0,
      consecutiveSuccesses: consecutiveSuccesses || 0,
      consecutiveFailures: consecutiveFailures || 0,
      responseTime: state.lastStatusUpdate.responseTime || null,
    };
  }

  getActivePingCount() {
    return this.activeWorkers.size;
  }

  getActivePings() {
    const pings = [];
    for (const [deviceId, state] of this.activeWorkers) {
      pings.push({ deviceId, ipAddress: state.ipAddress });
    }
    return pings;
  }
}

const pingWorkerManager = new PingWorkerManager();

export { pingWorkerManager, PingWorkerManager };
