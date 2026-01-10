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
            <label class="form-label">Select Group</label>
            <select id="groupSelector" class="form-input">
              <option value="">-- Select a group --</option>
    `;

    groups.forEach((group) => {
      html += `<option value="${group.id}">${group.name}</option>`;
    });

    html += `
            </select>
          </div>
          <div class="connectivity-control-group">
            <label class="form-label">Ping Interval (ms)</label>
            <input type="number" id="pingIntervalInput" class="form-input" 
                   placeholder="5000" min="100" max="60000" disabled />
          </div>
          <div class="connectivity-control-buttons">
            <button id="startAllPingBtn" class="md-button" disabled>
              <span class="material-icons">play_arrow</span>
              Start All Ping
            </button>
            <button id="stopAllPingBtn" class="md-button" disabled>
              <span class="material-icons">stop</span>
              Stop All Ping
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
    const startAllPingBtn = document.getElementById("startAllPingBtn");
    const stopAllPingBtn = document.getElementById("stopAllPingBtn");
    const devicesTableContainer = document.getElementById(
      "devicesTableContainer",
    );

    // Track ping state for each group
    const pingState = {};

    // Handle group selection
    groupSelector.addEventListener("change", async (e) => {
      const selectedGroupId = e.target.value;

      if (!selectedGroupId) {
        devicesTableContainer.innerHTML = "";
        startAllPingBtn.disabled = true;
        stopAllPingBtn.disabled = true;
        pingIntervalInput.disabled = true;
        pingIntervalInput.value = "";
        return;
      }

      pingIntervalInput.disabled = false;

      // Load saved interval for this group or use default
      const savedInterval = localStorage.getItem(
        `pingInterval_${selectedGroupId}`,
      );
      pingIntervalInput.value = savedInterval || "5000";

      // Update button states based on current ping state
      const isRunning = pingState[selectedGroupId] || false;
      startAllPingBtn.disabled = isRunning;
      stopAllPingBtn.disabled = !isRunning;

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

    // Handle start all ping
    startAllPingBtn.addEventListener("click", async () => {
      const selectedGroupId = groupSelector.value;
      if (!selectedGroupId) return;

      const pingInterval = parseInt(pingIntervalInput.value, 10) || 5000;

      const devicesResult =
        await window.api.storage.getDevicesInGroup(selectedGroupId);
      const devices = devicesResult.success ? devicesResult.devices : [];

      // Start ping for all devices in group
      for (const device of devices) {
        try {
          await window.api.ping.start(device.id, device.ip, pingInterval);
        } catch (error) {
          console.error(`Error starting ping for ${device.id}:`, error);
        }
      }

      // Update ping state and button states
      pingState[selectedGroupId] = true;
      startAllPingBtn.disabled = true;
      stopAllPingBtn.disabled = false;

      console.log("[Renderer] Started pinging all devices in group");
    });

    // Handle stop all ping
    stopAllPingBtn.addEventListener("click", async () => {
      const selectedGroupId = groupSelector.value;
      if (!selectedGroupId) return;

      const devicesResult =
        await window.api.storage.getDevicesInGroup(selectedGroupId);
      const devices = devicesResult.success ? devicesResult.devices : [];

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

      // Update ping state and button states
      pingState[selectedGroupId] = false;
      startAllPingBtn.disabled = false;
      stopAllPingBtn.disabled = true;

      console.log("[Renderer] Stopped pinging all devices in group");
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
        updateConnectivityIndicator(device.id, data.status, data.responseTime);
      }
    });
  });
}

function updateConnectivityIndicator(deviceId, status, responseTime) {
  const indicator = document.querySelector(
    `.connectivity-indicator[data-device-id="${deviceId}"]`,
  );
  if (!indicator) return;

  const statusColor = "var(--md-sys-color-outline)"; // Gray default
  let statusText = "Not Running";
  let dataStatus = "not-running";

  if (status === "available" || status === "responding") {
    statusText = "Connected";
    dataStatus = "connected";
  } else if (status === "high-jitter") {
    statusText = "High Jitter";
    dataStatus = "high-jitter";
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
