/**
 * Ping Manager Usage Examples
 *
 * This file demonstrates how to use the background ping functionality
 */

// ============================================================================
// BASIC USAGE
// ============================================================================

/**
 * Start pinging a device
 * @example
 */
async function startPingingDevice(deviceId, ipAddress) {
  try {
    const result = await window.api.ping.start(
      deviceId, // Unique device identifier
      ipAddress, // IP address to ping (e.g., "192.168.1.100")
      5000, // Interval in milliseconds (e.g., 5 seconds)
    );

    if (result.success) {
      console.log(`Started pinging ${ipAddress} every 5 seconds`);
    } else {
      console.error(`Failed to start ping: ${result.error}`);
    }
  } catch (error) {
    console.error("Error starting ping:", error);
  }
}

/**
 * Stop pinging a device
 * @example
 */
async function stopPingingDevice(deviceId) {
  try {
    const result = await window.api.ping.stop(deviceId);

    if (result.success) {
      console.log(`Stopped pinging device ${deviceId}`);
    } else {
      console.error(`Failed to stop ping: ${result.error}`);
    }
  } catch (error) {
    console.error("Error stopping ping:", error);
  }
}

/**
 * Get current availability status of a device
 * @example
 */
async function checkDeviceStatus(deviceId) {
  try {
    const result = await window.api.ping.getStatus(deviceId);

    if (result.success) {
      if (result.available === null) {
        console.log(`Device ${deviceId} is not currently being pinged`);
      } else if (result.available) {
        console.log(`Device ${deviceId} is AVAILABLE`);
      } else {
        console.log(`Device ${deviceId} is UNAVAILABLE`);
      }
    } else {
      console.error(`Failed to get status: ${result.error}`);
    }
  } catch (error) {
    console.error("Error checking device status:", error);
  }
}

/**
 * Listen for device availability changes
 * @example
 */
function setupAvailabilityListener() {
  window.api.ping.onAvailabilityChanged((data) => {
    const { deviceId, available } = data;
    const status = available ? "AVAILABLE" : "UNAVAILABLE";
    console.log(`Device ${deviceId} is now ${status}`);

    // Update UI here
    // For example:
    // updateDeviceIndicator(deviceId, available);
  });
}

/**
 * Stop all pinging operations
 * @example
 */
async function stopAllPinging() {
  try {
    const result = await window.api.ping.stopAll();

    if (result.success) {
      console.log("Stopped all pinging operations");
    } else {
      console.error(`Failed to stop all pings: ${result.error}`);
    }
  } catch (error) {
    console.error("Error stopping all pings:", error);
  }
}

/**
 * Get count of actively pinging devices
 * @example
 */
async function getActivePingCount() {
  try {
    const result = await window.api.ping.getActivePingCount();

    if (result.success) {
      console.log(`Currently pinging ${result.count} device(s)`);
    } else {
      console.error(`Failed to get count: ${result.error}`);
    }
  } catch (error) {
    console.error("Error getting active ping count:", error);
  }
}

/**
 * Get list of all devices being pinged
 * @example
 */
async function getActivePingsList() {
  try {
    const result = await window.api.ping.getActivePings();

    if (result.success) {
      console.log("Actively pinging devices:");
      result.pings.forEach((ping) => {
        console.log(`  - ${ping.deviceId}: ${ping.ipAddress}`);
      });
    } else {
      console.error(`Failed to get list: ${result.error}`);
    }
  } catch (error) {
    console.error("Error getting active pings list:", error);
  }
}

/**
 * Get detailed status for a device
 * @example
 */
async function getDeviceDetailedStatus(deviceId) {
  try {
    const result = await window.api.ping.getDetailedStatus(deviceId);

    if (result.success && result.status) {
      const { ipAddress, isAvailable, lastStatusUpdate } = result.status;
      console.log(`Device ${deviceId} (${ipAddress}):`);
      console.log(`  Status: ${isAvailable ? "AVAILABLE" : "UNAVAILABLE"}`);
      if (lastStatusUpdate) {
        console.log(
          `  Last update: ${new Date(lastStatusUpdate.timestamp).toISOString()}`,
        );
        console.log(`  Response time: ${lastStatusUpdate.responseTime}ms`);
        console.log(
          `  Consecutive failures: ${lastStatusUpdate.consecutiveFailures}`,
        );
      }
    } else {
      console.log(`Device ${deviceId} is not being pinged`);
    }
  } catch (error) {
    console.error("Error getting detailed status:", error);
  }
}

/**
 * Get performance metrics for a device
 * @example
 */
async function getDeviceMetrics(deviceId) {
  try {
    const result = await window.api.ping.getStatusMetrics(deviceId);

    if (result.success && result.metrics) {
      const { totalPings, totalFailures, successRate, responseTime } =
        result.metrics;
      console.log(`Device ${deviceId} Metrics:`);
      console.log(`  Total pings: ${totalPings}`);
      console.log(`  Failed pings: ${totalFailures}`);
      console.log(`  Success rate: ${successRate}%`);
      console.log(`  Last response time: ${responseTime}ms`);
    } else {
      console.log(`No metrics available for device ${deviceId}`);
    }
  } catch (error) {
    console.error("Error getting metrics:", error);
  }
}

/**
 * Listen for detailed status updates from worker threads
 * This fires for every ping status change with rich data
 * @example
 */
function setupStatusUpdateListener() {
  window.api.ping.onStatusUpdated((data) => {
    const {
      deviceId,
      status,
      responseTime,
      consecutiveFailures,
      consecutiveSuccesses,
      totalPings,
      totalFailures,
    } = data;

    console.log(`[${deviceId}] Status: ${status}`);
    if (responseTime) {
      console.log(`  Response time: ${responseTime}ms`);
    }
    if (consecutiveFailures > 0) {
      console.log(`  Consecutive failures: ${consecutiveFailures}`);
    }
    if (consecutiveSuccesses > 0) {
      console.log(`  Consecutive successes: ${consecutiveSuccesses}`);
    }
    console.log(`  Total pings: ${totalPings} (${totalFailures} failed)`);

    // Update UI with detailed status information
    updateDeviceStatusUI(deviceId, data);
  });
}

// ============================================================================
// PRACTICAL EXAMPLE: Device Monitoring in UI
// ============================================================================

/**
 * Example: Set up monitoring for a list of devices
 */
async function setupDeviceMonitoring(devices) {
  // Set up both availability and detailed status listeners
  setupAvailabilityListener();
  setupStatusUpdateListener();

  // Start pinging each device
  for (const device of devices) {
    if (device.ipAddress) {
      await startPingingDevice(device.id, device.ipAddress);
    }
  }
}

/**
 * Example: Stop monitoring for a specific device when it's removed
 */
async function removeDeviceMonitoring(deviceId) {
  await stopPingingDevice(deviceId);
}

/**
 * Example: UI update function called when availability changes
 */
function updateDeviceIndicator(deviceId, available) {
  // Find the device element in the UI
  const deviceElement = document.querySelector(
    `[data-device-id="${deviceId}"]`,
  );

  if (deviceElement) {
    // Update visual indicator
    if (available) {
      deviceElement.classList.remove("device-unavailable");
      deviceElement.classList.add("device-available");

      // Update status text
      const statusElement = deviceElement.querySelector(".device-status");
      if (statusElement) {
        statusElement.textContent = "Online";
        statusElement.style.color = "green";
      }
    } else {
      deviceElement.classList.remove("device-available");
      deviceElement.classList.add("device-unavailable");

      // Update status text
      const statusElement = deviceElement.querySelector(".device-status");
      if (statusElement) {
        statusElement.textContent = "Offline";
        statusElement.style.color = "red";
      }
    }
  }
}

/**
 * Example: UI update function called on detailed status updates from worker threads
 */
function updateDeviceStatusUI(deviceId, statusData) {
  const deviceElement = document.querySelector(
    `[data-device-id="${deviceId}"]`,
  );

  if (deviceElement) {
    // Update status indicator
    const statusIndicator = deviceElement.querySelector(
      ".device-status-indicator",
    );
    if (statusIndicator) {
      const isOnline =
        statusData.status === "available" || statusData.status === "responding";
      statusIndicator.style.backgroundColor = isOnline ? "green" : "red";
    }

    // Update response time if available
    const responseTimeEl = deviceElement.querySelector(".device-response-time");
    if (responseTimeEl && statusData.responseTime) {
      responseTimeEl.textContent = `${statusData.responseTime}ms`;
    }

    // Update consecutive failure count
    const failureCountEl = deviceElement.querySelector(".device-failure-count");
    if (failureCountEl && statusData.consecutiveFailures) {
      failureCountEl.textContent = `${statusData.consecutiveFailures} failures`;
    }

    // Update total statistics
    const statsEl = deviceElement.querySelector(".device-stats");
    if (statsEl && statusData.totalPings) {
      const failureRate = (
        (statusData.totalFailures / statusData.totalPings) *
        100
      ).toFixed(1);
      statsEl.textContent = `${statusData.totalPings} pings, ${failureRate}% failure rate`;
    }
  }
}

// ============================================================================
// EXPORT EXAMPLES (for use in other modules)
// ============================================================================

export {
  startPingingDevice,
  stopPingingDevice,
  checkDeviceStatus,
  setupAvailabilityListener,
  setupStatusUpdateListener,
  stopAllPinging,
  getActivePingCount,
  getActivePingsList,
  getDeviceDetailedStatus,
  getDeviceMetrics,
  setupDeviceMonitoring,
  removeDeviceMonitoring,
  updateDeviceIndicator,
  updateDeviceStatusUI,
};
