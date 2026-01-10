/**
 * Ping Worker Thread
 * Handles pinging a single device in a separate thread
 * Sends detailed status signals back to main thread
 */
/* global setInterval, clearInterval */

import { execFile } from "child_process";
import { parentPort } from "worker_threads";
import { nowIso, formatLocal } from "./timeUtils.js";

// State for this worker
let isRunning = false;
let intervalId = null;
let isAvailable = true;
let lastPingTime = null;
let consecutiveFailures = 0;
let consecutiveSuccesses = 0;
let totalPings = 0;
let totalFailures = 0;

// Jitter detection state
const MAX_RESPONSE_TIME_HISTORY = 20;
const responseTimes = [];
let coefficientOfVariation = 0;
let cvThreshold = 0.3; // Default 30% variation
let responseTimeThreshold = 100; // Default 100ms

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
 * Calculate standard deviation of response times
 */
function calculateStdDev(values) {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * Calculate coefficient of variation
 */
function calculateCoefficientOfVariation(responseTimeValue) {
  // Add response time to history
  responseTimes.push(responseTimeValue);
  if (responseTimes.length > MAX_RESPONSE_TIME_HISTORY) {
    responseTimes.shift();
  }

  // Need at least 2 samples to calculate variation
  if (responseTimes.length < 2) {
    return 0;
  }

  const mean = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  const stdDev = calculateStdDev(responseTimes);

  // Avoid division by zero
  if (mean === 0) return 0;

  return stdDev / mean;
}

/**
 * Determine connection status based on CV and response time
 */
function determineConnectionStatus(responseTimeValue, previousStatus) {
  const isPoorCV = coefficientOfVariation > cvThreshold;
  const isPoorResponseTime = responseTimeValue > responseTimeThreshold;

  if (isPoorCV || isPoorResponseTime) {
    return "poor-connection";
  }

  return previousStatus;
}

/**
 * Send log data to main thread
 */
function sendLogData(ipAddress, result, cv) {
  parentPort.postMessage({
    type: "log_attempt",
    data: {
      timestamp_utc: nowIso(),
      timestamp_local: formatLocal(),
      target: ipAddress,
      latency_ms: result.success ? result.responseTime : 0,
      jitter_cv: cv,
    },
  });
}

/**
 * Send status signal to main thread
 */
function sendStatusSignal(status) {
  parentPort.postMessage({
    type: "status",
    timestamp: nowIso(),
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
  coefficientOfVariation = calculateCoefficientOfVariation(result.responseTime);
  sendLogData(ipAddress, result, coefficientOfVariation);

  if (result.success) {
    // console.log(`ping ok ${ipAddress} ${result.responseTime}ms`);
    consecutiveSuccesses++;
    consecutiveFailures = 0;
    if (!isAvailable) {
      isAvailable = true;
      sendStatusSignal({
        status: "available",
        ipAddress,
        responseTime: result.responseTime,
        coefficientOfVariation,
        consecutiveSuccesses,
        totalPings,
        totalFailures,
      });
    } else {
      const connectionStatus = determineConnectionStatus(
        result.responseTime,
        "responding",
      );
      sendStatusSignal({
        status: connectionStatus,
        ipAddress,
        responseTime: result.responseTime,
        coefficientOfVariation,
        consecutiveSuccesses,
        totalPings,
        totalFailures,
      });
    }
  } else {
    // console.log(`ping failed ${ipAddress}`);
    consecutiveFailures++;
    consecutiveSuccesses = 0;
    totalFailures++;
    if (isAvailable) {
      isAvailable = false;
      sendStatusSignal({
        status: "unavailable",
        ipAddress,
        coefficientOfVariation,
        consecutiveFailures,
        totalPings,
        totalFailures,
      });
    } else {
      sendStatusSignal({
        status: "unresponsive",
        ipAddress,
        coefficientOfVariation,
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
    coefficientOfVariation = calculateCoefficientOfVariation(
      result.responseTime,
    );
    sendLogData(ipAddress, result, coefficientOfVariation);

    if (result.success) {
      // console.log(`ping ok ${ipAddress} ${result.responseTime}ms`);
      consecutiveSuccesses++;
      consecutiveFailures = 0;

      if (!isAvailable) {
        // Device just came back online
        isAvailable = true;
        sendStatusSignal({
          status: "available",
          ipAddress,
          responseTime: result.responseTime,
          coefficientOfVariation,
          consecutiveSuccesses,
          totalPings,
          totalFailures,
        });
      } else {
        // Check for poor connection based on CV or response time
        const connectionStatus = determineConnectionStatus(
          result.responseTime,
          "responding",
        );
        sendStatusSignal({
          status: connectionStatus,
          ipAddress,
          responseTime: result.responseTime,
          coefficientOfVariation,
          consecutiveSuccesses,
          totalPings,
          totalFailures,
        });
      }
    } else {
      // console.log(`ping failed ${ipAddress}`);
      consecutiveFailures++;
      consecutiveSuccesses = 0;
      totalFailures++;

      if (isAvailable) {
        // Device just went offline
        isAvailable = false;
        sendStatusSignal({
          status: "unavailable",
          ipAddress,
          coefficientOfVariation,
          consecutiveFailures,
          totalPings,
          totalFailures,
        });
      } else {
        // Still offline
        sendStatusSignal({
          status: "unresponsive",
          ipAddress,
          coefficientOfVariation,
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
  const { command, ipAddress, intervalMs, config } = message;

  switch (command) {
    case "start":
      // Apply configuration if provided
      if (config) {
        cvThreshold = config.cvThreshold ?? cvThreshold;
        responseTimeThreshold =
          config.responseTimeThreshold ?? responseTimeThreshold;
      }
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
        coefficientOfVariation,
        cvThreshold,
        responseTimeThreshold,
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
