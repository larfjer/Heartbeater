/**
 * Ping Worker Thread
 * Handles pinging a single device in a separate thread
 * Sends detailed status signals back to main thread
 */
/* global setInterval, clearInterval */

import { execFile } from "child_process";
import { parentPort } from "worker_threads";

// State for this worker
let isRunning = false;
let intervalId = null;
let isAvailable = true;
let lastPingTime = null;
let consecutiveFailures = 0;
let consecutiveSuccesses = 0;
let totalPings = 0;
let totalFailures = 0;

/**
 * Execute a single ping
 */
function executePing(ipAddress) {
  return new Promise((resolve) => {
    const isWindows = process.platform === "win32";
    const args = isWindows
      ? ["-n", "1", "-w", "1000", ipAddress]
      : ["-c", "1", "-W", "1000", ipAddress];
    const command = isWindows ? "ping" : "ping";

    const startTime = Date.now();

    execFile(command, args, { timeout: 2000 }, (error) => {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      resolve({ success: !error, responseTime });
    });
  });
}

/**
 * Send status signal to main thread
 */
function sendStatusSignal(status) {
  parentPort.postMessage({
    type: "status",
    timestamp: Date.now(),
    ...status,
  });
}

/**
 * Start the ping loop
 */
async function startPingLoop(ipAddress, intervalMs) {
  isRunning = true;

  // Initial ping
  let result = await executePing(ipAddress);
  totalPings++;
  lastPingTime = Date.now();

  if (result.success) {
    console.log(`ping ok ${ipAddress} ${result.responseTime}ms`);
    consecutiveSuccesses++;
    consecutiveFailures = 0;
    if (!isAvailable) {
      isAvailable = true;
      sendStatusSignal({
        status: "available",
        ipAddress,
        responseTime: result.responseTime,
        consecutiveSuccesses,
        totalPings,
        totalFailures,
      });
    } else {
      sendStatusSignal({
        status: "responding",
        ipAddress,
        responseTime: result.responseTime,
        consecutiveSuccesses,
        totalPings,
        totalFailures,
      });
    }
  } else {
    console.log(`ping failed ${ipAddress}`);
    consecutiveFailures++;
    consecutiveSuccesses = 0;
    totalFailures++;
    if (isAvailable) {
      isAvailable = false;
      sendStatusSignal({
        status: "unavailable",
        ipAddress,
        consecutiveFailures,
        totalPings,
        totalFailures,
      });
    } else {
      sendStatusSignal({
        status: "unresponsive",
        ipAddress,
        consecutiveFailures,
        totalPings,
        totalFailures,
      });
    }
  }

  // Set up interval for subsequent pings
  intervalId = setInterval(async () => {
    if (!isRunning) return;

    result = await executePing(ipAddress);
    totalPings++;
    lastPingTime = Date.now();

    if (result.success) {
      console.log(`ping ok ${ipAddress} ${result.responseTime}ms`);
      consecutiveSuccesses++;
      consecutiveFailures = 0;

      if (!isAvailable) {
        // Device just came back online
        isAvailable = true;
        sendStatusSignal({
          status: "available",
          ipAddress,
          responseTime: result.responseTime,
          consecutiveSuccesses,
          totalPings,
          totalFailures,
        });
      } else {
        // Still responding normally
        sendStatusSignal({
          status: "responding",
          ipAddress,
          responseTime: result.responseTime,
          consecutiveSuccesses,
          totalPings,
          totalFailures,
        });
      }
    } else {
      console.log(`ping failed ${ipAddress}`);
      consecutiveFailures++;
      consecutiveSuccesses = 0;
      totalFailures++;

      if (isAvailable) {
        // Device just went offline
        isAvailable = false;
        sendStatusSignal({
          status: "unavailable",
          ipAddress,
          consecutiveFailures,
          totalPings,
          totalFailures,
        });
      } else {
        // Still offline
        sendStatusSignal({
          status: "unresponsive",
          ipAddress,
          consecutiveFailures,
          totalPings,
          totalFailures,
        });
      }
    }
  }, intervalMs);

  parentPort.postMessage({
    type: "started",
    message: `Started pinging ${ipAddress} every ${intervalMs}ms`,
  });
}

/**
 * Stop the ping loop
 */
function stopPingLoop() {
  isRunning = false;
  if (intervalId) {
    clearInterval(intervalId);
  }
  parentPort.postMessage({
    type: "stopped",
    message: "Stopped pinging",
  });
}

/**
 * Message handler
 */
parentPort.on("message", async (message) => {
  const { command, ipAddress, intervalMs } = message;

  switch (command) {
    case "start":
      await startPingLoop(ipAddress, intervalMs);
      break;
    case "stop":
      stopPingLoop();
      break;
    case "status":
      parentPort.postMessage({
        type: "full-status",
        available: isAvailable,
        lastPingTime,
        consecutiveFailures,
        consecutiveSuccesses,
        totalPings,
        totalFailures,
      });
      break;
    default:
      console.error(`Unknown command: ${command}`);
  }
});

// Handle graceful shutdown
process.on("SIGTERM", () => {
  stopPingLoop();
  process.exit(0);
});
