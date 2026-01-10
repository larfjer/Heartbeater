/**
 * Group Connectivity monitoring UI
 */

export async function renderGroupConnectivity() {
  const container = document.getElementById("connectivity-container");

  try {
    // Get all groups from storage
    const groupsResult = await window.api.storage.getAllGroups();
    const groups = groupsResult.success ? groupsResult.groups : [];

    if (groups.length === 0) {
      container.innerHTML = `
        <div class="card">
          <div class="empty-state">
            <span class="material-icons">group_off</span>
            <p>No groups found. Create a group first in Device Groups tab.</p>
          </div>
        </div>
      `;
      return;
    }

    // Build group selector section
    let html = `
      <div class="card">
        <div class="connectivity-controls">
          <div class="connectivity-control-group">
            <label class="form-label">Group:</label>
            <select id="groupSelector" class="form-input-auto">
              <option value="">-- Select a group --</option>
    `;

    groups.forEach((group) => {
      html += `<option value="${group.id}">${group.name}</option>`;
    });

    html += `
            </select>
          </div>
          <div class="connectivity-control-group">
            <label class="form-label">Ping Interval (ms):</label>
            <input type="number" id="pingIntervalInput" class="form-input-auto" 
                   placeholder="5000" min="100" max="60000" disabled />
          </div>
          <div class="connectivity-control-group">
            <label class="form-label">CV Threshold:</label>
            <input type="number" id="cvThresholdInput" class="form-input-auto" 
                   placeholder="0.3" min="0.1" max="1" step="0.05" disabled />
          </div>
          <div class="connectivity-control-group">
            <label class="form-label">Response Time (ms):</label>
            <input type="number" id="responseTimeThresholdInput" class="form-input-auto" 
                   placeholder="100" min="1" max="1000" disabled />
          </div>
           <div class="connectivity-control-group">
            <label class="form-label">Logging:</label>
            <div class="logging-control">
              <input type="checkbox" id="loggingEnabledInput" disabled />
              <span class="logging-label">Enable</span>
            </div>
          </div>
          <div class="connectivity-control-buttons">
            <button id="togglePingBtn" class="md-button" disabled>
              <span class="material-icons">play_arrow</span>
              <span class="button-text">Start All Ping</span>
            </button>
          </div>
        </div>
      </div>

      <div class="card">
        <div id="devicesTableContainer"></div>
      </div>
    `;

    container.innerHTML = html;

    const groupSelector = document.getElementById("groupSelector");
    const pingIntervalInput = document.getElementById("pingIntervalInput");
    const cvThresholdInput = document.getElementById("cvThresholdInput");
    const responseTimeThresholdInput = document.getElementById(
      "responseTimeThresholdInput",
    );
    const togglePingBtn = document.getElementById("togglePingBtn");
    const loggingEnabledInput = document.getElementById("loggingEnabledInput");
    const devicesTableContainer = document.getElementById(
      "devicesTableContainer",
    );

    // Track ping state for each group
    const pingState = {};

    // Helper function to update button state
    function updateButtonState(isRunning) {
      const icon = togglePingBtn.querySelector(".material-icons");
      const text = togglePingBtn.querySelector(".button-text");

      if (isRunning) {
        icon.textContent = "stop";
        text.textContent = "Stop All Ping";
      } else {
        icon.textContent = "play_arrow";
        text.textContent = "Start All Ping";
      }
    }

    // Handle group selection
    groupSelector.addEventListener("change", async (e) => {
      const selectedGroupId = e.target.value;

      if (!selectedGroupId) {
        devicesTableContainer.innerHTML = "";
        togglePingBtn.disabled = true;
        pingIntervalInput.disabled = true;
        cvThresholdInput.disabled = true;
        responseTimeThresholdInput.disabled = true;
        pingIntervalInput.value = "";
        cvThresholdInput.value = "";
        responseTimeThresholdInput.value = "";
        return;
      }

      pingIntervalInput.disabled = false;
      cvThresholdInput.disabled = false;
      responseTimeThresholdInput.disabled = false;
      loggingEnabledInput.disabled = false;

      // Load saved interval and thresholds for this group or use defaults
      const savedInterval = localStorage.getItem(
        `pingInterval_${selectedGroupId}`,
      );
      const savedCvThreshold = localStorage.getItem(
        `cvThreshold_${selectedGroupId}`,
      );
      const savedResponseTimeThreshold = localStorage.getItem(
        `responseTimeThreshold_${selectedGroupId}`,
      );
      const savedLogging = localStorage.getItem(
        `loggingEnabled_${selectedGroupId}`,
      );

      pingIntervalInput.value = savedInterval || "5000";
      cvThresholdInput.value = savedCvThreshold || "0.3";
      responseTimeThresholdInput.value = savedResponseTimeThreshold || "100";
      loggingEnabledInput.checked =
        savedLogging === "true" || savedLogging === null;

      // Update button state based on current ping state
      const isRunning = pingState[selectedGroupId] || false;
      togglePingBtn.disabled = false;
      updateButtonState(isRunning);

      // Get devices in selected group
      const devicesResult =
        await window.api.storage.getDevicesInGroup(selectedGroupId);
      const devices = devicesResult.success ? devicesResult.devices : [];

      renderDevicesTable(devicesTableContainer, devices);
    });

    // Handle ping interval change
    pingIntervalInput.addEventListener("change", (e) => {
      const selectedGroupId = groupSelector.value;
      if (selectedGroupId && e.target.value) {
        localStorage.setItem(`pingInterval_${selectedGroupId}`, e.target.value);
      }
    });

    // Handle CV threshold change
    cvThresholdInput.addEventListener("change", (e) => {
      const selectedGroupId = groupSelector.value;
      if (selectedGroupId && e.target.value) {
        localStorage.setItem(`cvThreshold_${selectedGroupId}`, e.target.value);
      }
    });

    // Handle response time threshold change
    responseTimeThresholdInput.addEventListener("change", (e) => {
      const selectedGroupId = groupSelector.value;
      if (selectedGroupId && e.target.value) {
        localStorage.setItem(
          `responseTimeThreshold_${selectedGroupId}`,
          e.target.value,
        );
      }
    });

    // Handle logging toggle change
    loggingEnabledInput.addEventListener("change", (e) => {
      const selectedGroupId = groupSelector.value;
      if (selectedGroupId) {
        localStorage.setItem(
          `loggingEnabled_${selectedGroupId}`,
          e.target.checked,
        );
      }
    });

    // Handle toggle ping button
    togglePingBtn.addEventListener("click", async () => {
      const selectedGroupId = groupSelector.value;
      if (!selectedGroupId) return;

      const selectedGroupName =
        groupSelector.options[groupSelector.selectedIndex].text;

      const isRunning = pingState[selectedGroupId] || false;

      const devicesResult =
        await window.api.storage.getDevicesInGroup(selectedGroupId);
      const devices = devicesResult.success ? devicesResult.devices : [];

      if (isRunning) {
        // Stop logging session
        try {
          await window.api.logging.stopSession(selectedGroupId);
        } catch (e) {
          console.error("Error stopping logging session", e);
        }

        // Stop ping for all devices in group
        for (const device of devices) {
          try {
            await window.api.ping.stop(device.id);
            // Reset status back to grey and clear metrics
            resetDeviceMetrics(device.id);
          } catch (error) {
            console.error(`Error stopping ping for ${device.id}:`, error);
          }
        }

        // Update ping state and button state
        pingState[selectedGroupId] = false;
        updateButtonState(false);

        console.log("[Renderer] Stopped pinging all devices in group");
      } else {
        // Start ping for all devices in group
        const pingInterval = parseInt(pingIntervalInput.value, 10) || 5000;
        const cvThreshold = parseFloat(cvThresholdInput.value) || 0.3;
        const responseTimeThreshold =
          parseInt(responseTimeThresholdInput.value, 10) || 100;

        const enableLogging = loggingEnabledInput.checked;
        if (enableLogging) {
          try {
            await window.api.logging.startSession(
              selectedGroupId,
              selectedGroupName,
            );
          } catch (e) {
            console.error("Error starting logging session", e);
          }
        }

        const config = {
          cvThreshold,
          responseTimeThreshold,
          logging: {
            enabled: enableLogging,
            groupId: selectedGroupId,
          },
        };

        for (const device of devices) {
          try {
            await window.api.ping.start(
              device.id,
              device.ip,
              pingInterval,
              config,
            );
          } catch (error) {
            console.error(`Error starting ping for ${device.id}:`, error);
          }
        }

        // Update ping state and button state
        pingState[selectedGroupId] = true;
        updateButtonState(true);

        console.log("[Renderer] Started pinging all devices in group");
      }
    });
  } catch (error) {
    console.error("[Renderer] Error rendering group connectivity:", error);
    container.innerHTML = `<div class="card"><p>Error: ${error.message}</p></div>`;
  }
}

function renderDevicesTable(container, devices) {
  if (devices.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="material-icons">devices_off</span>
        <p>No devices in this group</p>
      </div>
    `;
    return;
  }

  let html = `
    <table class="md-table">
      <thead>
        <tr>
          <th>Friendly Name</th>
          <th>IP Address</th>
          <th>MAC Address</th>
          <th>Response Time</th>
          <th>Jitter</th>
          <th class="connectivity-status-column">Status</th>
        </tr>
      </thead>
      <tbody>
  `;

  devices.forEach((device) => {
    const displayName = device.friendlyName || device.name || "(Unknown)";

    html += `
      <tr class="connectivity-row" data-device-id="${device.id}">
        <td><span class="device-friendly-name">${displayName}</span></td>
        <td><span class="device-ip">${device.ip}</span></td>
        <td><span class="device-mac">${device.mac}</span></td>
        <td><span class="device-response-time">—</span></td>
        <td><span class="device-jitter">NA</span></td>
        <td class="connectivity-status-cell">
          <div class="connectivity-indicator" data-device-id="${device.id}" data-status="not-running">
            <span class="status-dot"></span>
            <span class="status-text">Not Running</span>
          </div>
        </td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
  `;

  container.innerHTML = html;

  // Set up ping status listeners for devices in this group
  devices.forEach((device) => {
    window.api.ping.onStatusUpdated((data) => {
      if (data.deviceId === device.id) {
        updateConnectivityIndicator(
          device.id,
          data.status,
          data.responseTime,
          data.coefficientOfVariation,
        );
      }
    });
  });
}

function updateConnectivityIndicator(
  deviceId,
  status,
  responseTime,
  coefficientOfVariation,
) {
  const indicator = document.querySelector(
    `.connectivity-indicator[data-device-id="${deviceId}"]`,
  );
  if (!indicator) return;

  let statusText = "Not Running";
  let dataStatus = "not-running";

  if (status === "available" || status === "responding") {
    statusText = "Connected";
    dataStatus = "connected";
  } else if (status === "poor-connection") {
    statusText = "Poor Connection";
    dataStatus = "poor-connection";
  } else if (status === "unavailable" || status === "unresponsive") {
    statusText = "Disconnected";
    dataStatus = "disconnected";
  }

  indicator.dataset.status = dataStatus;
  const text = indicator.querySelector(".status-text");

  if (text) text.textContent = statusText;

  // Update response time if available
  if (responseTime) {
    const row = document.querySelector(
      `.connectivity-row[data-device-id="${deviceId}"]`,
    );
    if (row) {
      const responseTimeCell = row.querySelector(".device-response-time");
      if (responseTimeCell) {
        responseTimeCell.textContent = `${responseTime}ms`;
      }
    }
  }

  // Update coefficient of variation (jitter) if available
  if (coefficientOfVariation !== undefined) {
    const row = document.querySelector(
      `.connectivity-row[data-device-id="${deviceId}"]`,
    );
    if (row) {
      const jitterCell = row.querySelector(".device-jitter");
      if (jitterCell) {
        jitterCell.textContent = coefficientOfVariation.toFixed(3);
      }
    }
  }
}

function resetDeviceMetrics(deviceId) {
  const indicator = document.querySelector(
    `.connectivity-indicator[data-device-id="${deviceId}"]`,
  );
  if (!indicator) return;

  // Reset status to grey "Not Running"
  indicator.dataset.status = "not-running";
  const text = indicator.querySelector(".status-text");

  if (text) text.textContent = "Not Running";

  // Clear response time and jitter columns
  const row = document.querySelector(
    `.connectivity-row[data-device-id="${deviceId}"]`,
  );
  if (row) {
    const responseTimeCell = row.querySelector(".device-response-time");
    const jitterCell = row.querySelector(".device-jitter");

    if (responseTimeCell) responseTimeCell.textContent = "—";
    if (jitterCell) jitterCell.textContent = "NA";
  }
}
