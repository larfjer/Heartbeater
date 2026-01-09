/**
 * Sets up ping control button event listeners using event delegation
 * Works with dynamically added buttons since it listens on the document
 */
export function setupPingControlListeners() {
  // Use event delegation on document to handle dynamically added buttons
  document.addEventListener("click", async (e) => {
    const startBtn = e.target.closest(".start-ping-btn");
    const stopBtn = e.target.closest(".stop-ping-btn");

    if (startBtn) {
      console.log("[Debug] Start ping button clicked");
      e.stopPropagation();
      const deviceId = startBtn.dataset.deviceId;
      const deviceIp = startBtn.dataset.deviceIp;
      const pingIntervalMs = 5000; // 5 seconds

      try {
        const result = await window.api.ping.start(
          deviceId,
          deviceIp,
          pingIntervalMs,
        );
        if (result.success) {
          console.log(`[Renderer] Started pinging device ${deviceId}`);
          // Hide start button, show stop button
          startBtn.classList.add("hidden");
          const stopBtnEl = document.querySelector(
            `.stop-ping-btn[data-device-id="${deviceId}"]`,
          );
          if (stopBtnEl) stopBtnEl.classList.remove("hidden");

          // Show status indicator
          const statusIndicator = document.querySelector(
            `.ping-status-indicator[data-device-id="${deviceId}"]`,
          );
          if (statusIndicator) statusIndicator.classList.remove("hidden");
        } else {
          console.error(`Failed to start ping: ${result.error}`);
          alert(`Failed to start ping: ${result.error}`);
        }
      } catch (error) {
        console.error("[Renderer] Error starting ping:", error);
        alert("Error starting ping: " + error.message);
      }
    }

    if (stopBtn) {
      console.log("[Debug] Stop ping button clicked");
      e.stopPropagation();
      const deviceId = stopBtn.dataset.deviceId;

      try {
        const result = await window.api.ping.stop(deviceId);
        if (result.success) {
          console.log(`[Renderer] Stopped pinging device ${deviceId}`);
          // Hide stop button, show start button
          stopBtn.classList.add("hidden");
          const startBtnEl = document.querySelector(
            `.start-ping-btn[data-device-id="${deviceId}"]`,
          );
          if (startBtnEl) startBtnEl.classList.remove("hidden");

          // Hide status indicator
          const statusIndicator = document.querySelector(
            `.ping-status-indicator[data-device-id="${deviceId}"]`,
          );
          if (statusIndicator) statusIndicator.classList.add("hidden");
        } else {
          console.error(`Failed to stop ping: ${result.error}`);
          alert(`Failed to stop ping: ${result.error}`);
        }
      } catch (error) {
        console.error("[Renderer] Error stopping ping:", error);
        alert("Error stopping ping: " + error.message);
      }
    }
  });

  // Set up listener for ping status updates
  window.api.ping.onStatusUpdated((data) => {
    const { deviceId, status, responseTime } = data;
    const statusDot = document.querySelector(
      `.ping-status-indicator[data-device-id="${deviceId}"] .ping-status-dot`,
    );
    const statusText = document.querySelector(
      `.ping-status-indicator[data-device-id="${deviceId}"] .ping-status-text`,
    );
    const responseTimeEl = document.querySelector(
      `.ping-status-indicator[data-device-id="${deviceId}"] .ping-response-time`,
    );

    if (statusDot && statusText) {
      // Update status color and text
      if (status === "available" || status === "responding") {
        statusDot.style.backgroundColor = "var(--md-sys-color-tertiary)"; // Green-ish
        statusText.textContent = "Online";
        statusText.style.color = "var(--md-sys-color-tertiary)";
      } else {
        statusDot.style.backgroundColor = "var(--md-sys-color-error)"; // Red
        statusText.textContent = "Offline";
        statusText.style.color = "var(--md-sys-color-error)";
      }

      // Update response time display
      if (responseTimeEl && responseTime) {
        responseTimeEl.textContent = `${responseTime}ms`;
      }
    }
  });
}

/**
 * Device scan results UI rendering and management
 */

import { domElements, appState } from "./domElements.js";
import { openAddToGroupModal } from "./addToGroupModal.js";

/**
 * Renders a device row for display in a table or list
 * @param {Object} device - Device object with id, name, ip, mac, manufacturer, etc.
 * @param {Object} options - Configuration options
 * @param {string} options.rowId - Unique identifier for the row (device index or id)
 * @param {string} options.buttonType - Type of button: "add-to-group" or "remove-from-group"
 * @param {string} options.buttonGroupId - Group ID (required for remove-from-group)
 * @param {boolean} options.showGroupBadge - Whether to show group count badge (default: false)
 * @param {boolean} options.showPingControls - Whether to show ping start/stop controls (default: false)
 * @returns {string} HTML string for the device row
 */
export function renderDeviceRow(device, options = {}) {
  const {
    rowId = device.id || device.mac,
    buttonType = "add-to-group",
    buttonGroupId = null,
    showGroupBadge = false,
    showPingControls = false,
  } = options;

  const displayName = device.friendlyName || device.name || "(Unknown)";
  const manufacturer = device.manufacturer || "Unknown";

  let buttonHtml = "";
  if (buttonType === "add-to-group") {
    buttonHtml = `
      <button class="add-to-group-btn" data-device-id="${device.id}">
        <span class="material-icons">group_add</span>
        Add to Group
      </button>
    `;
  } else if (buttonType === "remove-from-group") {
    buttonHtml = `
      <button class="remove-device-btn" data-group-id="${buttonGroupId}" data-device-id="${device.id}">
        <span class="material-icons">close</span>
      </button>
    `;
  }

  let groupBadge = "";
  if (showGroupBadge && device.groupCount > 0) {
    groupBadge = `<span class="device-groups-badge">${device.groupCount} group${device.groupCount !== 1 ? "s" : ""}</span>`;
  }

  let pingControlsHtml = "";
  // Ping controls are only enabled in groupsUI.js, never in deviceScanUI
  if (showPingControls) {
    pingControlsHtml = `
      <div class="device-ping-controls">
        <button class="start-ping-btn md-button" data-device-id="${device.id}" data-device-ip="${device.ip}">
          <span class="material-icons">play_arrow</span>
          Ping
        </button>
        <button class="stop-ping-btn md-button hidden" data-device-id="${device.id}">
          <span class="material-icons">stop</span>
          Stop
        </button>
        <div class="ping-status-indicator hidden" data-device-id="${device.id}">
          <span class="ping-status-dot"></span>
          <span class="ping-status-text">—</span>
          <span class="ping-response-time"></span>
        </div>
      </div>
    `;
  }

  return `
    <tr class="device-row" data-device-id="${device.id}" data-row-id="${rowId}">
      <td class="device-row-expand-icon">
        <span class="material-icons expand-icon">expand_more</span>
      </td>
      <td>
        <div class="device-name">
          <div class="device-icon">
            <span class="material-icons">devices</span>
          </div>
          <div>
            <div class="device-name-text">${displayName}</div>
            ${groupBadge}
          </div>
        </div>
      </td>
      <td><span class="device-ip">${device.ip}</span></td>
      <td><span class="mac-address">${device.mac}</span></td>
      <td><span class="manufacturer-badge">${manufacturer}</span></td>
      <td>
        <div class="device-row-actions">
          ${pingControlsHtml}
          ${buttonHtml}
        </div>
      </td>
    </tr>
  `;
}

export async function renderDeviceScan(devices) {
  const { results } = domElements;

  if (devices.length === 0) {
    results.innerHTML = `
      <div class="results-card">
        <div class="empty-state">
          <span class="material-icons">devices_off</span>
          <p>No devices found on the network</p>
        </div>
      </div>
    `;
    return;
  }

  let html = `
    <div class="results-card">
      <div class="results-header">
        <span class="device-count">
          <span class="material-icons">devices</span>
          ${devices.length} device${devices.length !== 1 ? "s" : ""} found
        </span>
      </div>
      <table class="md-table">
        <thead>
          <tr>
            <th class="table-header-icon"></th>
            <th>Device Name</th>
            <th>IP Address</th>
            <th>MAC Address</th>
            <th>Manufacturer</th>
            <th class="table-header-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
  `;

  for (let index = 0; index < devices.length; index++) {
    const device = devices[index];
    let storedDevice = null;

    // Try to find if device exists in storage by MAC address
    try {
      const storedResult = await window.api.storage.getDeviceByMac(device.mac);
      if (storedResult.success && storedResult.device) {
        storedDevice = storedResult.device;
      }
    } catch {
      console.debug("Device not in storage yet");
    }

    // Get group count if device is in storage
    let groupCount = 0;
    if (storedDevice) {
      try {
        const groupsResult = await window.api.storage.getGroupsForDevice(
          storedDevice.id,
        );
        if (groupsResult.success) {
          groupCount = groupsResult.groups.length;
        }
      } catch {
        console.debug("Error getting groups for device");
      }
    }

    html += renderDeviceRow(
      {
        ...device,
        id: storedDevice?.id || device.mac || device.id,
        friendlyName: storedDevice?.friendlyName || device.name,
        groupCount,
      },
      {
        rowId: index,
        buttonType: "add-to-group",
        showGroupBadge: true,
        showPingControls: false,
      },
    );

    html += `
      <tr class="details-row" data-index="${index}">
        <td colspan="6">
          <div class="details-cell">
            <div class="details-title">Friendly Name</div>
            <div class="friendly-name-input-container">
              <input
                type="text"
                class="device-friendly-name-input form-input-inline"
                placeholder="Enter friendly name"
              />
              <button class="save-friendly-name-btn md-button">Save</button>
            </div>
            <div class="friendly-name-info"></div>
            
            <div class="details-title">Groups</div>
            <div class="device-groups-list"></div>
            
            <div class="device-details-section">
                  <div class="device-groups-list"></div>
                  
                  <div class="details-title">Operating System</div>
                  <div class="os-info">Loading...</div>
                  <div class="details-title">Services</div>
                  <div class="services-list">Loading...</div>
                </div>
              </td>
            </tr>
    `;
  }

  html += "</tbody></table></div>";
  results.innerHTML = html;

  // Add event listeners to expand rows
  document.querySelectorAll(".device-row").forEach((row) => {
    row.addEventListener("click", async (e) => {
      console.log("[Debug] Device row clicked on:", e.target.className);
      // Don't expand if clicking buttons or controls
      if (e.target.closest(".add-to-group-btn")) {
        console.log("[Debug] Blocking expansion: add-to-group-btn");
        return;
      }

      const index = row.dataset.rowId;
      const detailsRow = document.querySelector(
        `.details-row[data-index="${index}"]`,
      );
      const icon = row.querySelector(".expand-icon");

      console.log("[Debug] Expanding row, index:", index);
      detailsRow.classList.toggle("expanded");
      icon.classList.toggle("expanded");

      if (detailsRow.classList.contains("expanded")) {
        // Get the stored device to show groups and friendly name
        const deviceId = row.dataset.deviceId;
        const mac = row.querySelector(".mac-address").textContent;

        // Try to get device by ID first, then fall back to MAC lookup
        let storedDeviceResult = await window.api.storage.getDevice(deviceId);
        if (!storedDeviceResult?.success) {
          // If not found by ID, try MAC address
          storedDeviceResult = await window.api.storage.getDeviceByMac(mac);
        }
        const storedDevice = storedDeviceResult?.device || storedDeviceResult;

        // Populate friendly name section
        const friendlyNameInput = detailsRow.querySelector(
          ".device-friendly-name-input",
        );
        const friendlyNameInfo = detailsRow.querySelector(
          ".friendly-name-info",
        );
        const saveFriendlyNameBtn = detailsRow.querySelector(
          ".save-friendly-name-btn",
        );

        if (storedDevice) {
          friendlyNameInput.value = storedDevice.friendlyName || "";
          if (storedDevice.friendlyName) {
            friendlyNameInfo.innerHTML = `<span class="info-text">Original name: ${storedDevice.name}</span>`;
          } else {
            friendlyNameInfo.textContent = "";
          }

          // Save friendly name button handler
          saveFriendlyNameBtn.onclick = async () => {
            const newFriendlyName = friendlyNameInput.value.trim();
            try {
              const result = await window.api.storage.updateDeviceFriendlyName(
                storedDevice.id,
                newFriendlyName,
              );
              if (result.success) {
                console.log("[Renderer] Friendly name updated");
                if (newFriendlyName) {
                  friendlyNameInfo.innerHTML = `<span class="info-text">Original name: ${storedDevice.name}</span>`;
                } else {
                  friendlyNameInfo.textContent = "";
                }
                // Update the device name in the table
                const nameText = row.querySelector(".device-name-text");
                if (nameText) {
                  nameText.textContent = newFriendlyName || storedDevice.name;
                }
              }
            } catch (error) {
              console.error("[Renderer] Error saving friendly name:", error);
              alert("Error: " + error.message);
            }
          };

          // Populate device groups section
          const groupsList = detailsRow.querySelector(".device-groups-list");
          const groupsResult =
            await window.api.storage.getGroupsForDevice(deviceId);
          const groups = groupsResult.success ? groupsResult.groups : [];

          if (groups.length === 0) {
            friendlyNameInput.disabled = true;
            saveFriendlyNameBtn.disabled = true;
            friendlyNameInput.title = "Add device to a group to edit name";
            saveFriendlyNameBtn.title = "Add device to a group to edit name";
            groupsList.innerHTML =
              '<span class="info-text">Not assigned to any groups</span>';
          } else {
            friendlyNameInput.disabled = false;
            saveFriendlyNameBtn.disabled = false;
            friendlyNameInput.title = "";
            saveFriendlyNameBtn.title = "";

            let groupsHtml = '<div class="groups-wrap-container">';
            groups.forEach((group) => {
              groupsHtml += `<span class="group-badge">${group.name}</span>`;
            });
            groupsHtml += "</div>";
            groupsList.innerHTML = groupsHtml;
          }

          // Populate OS and services (stub for future functionality)
          const osInfo = detailsRow.querySelector(".os-info");
          osInfo.textContent = "Not scanned";
          const servicesList = detailsRow.querySelector(".services-list");
          servicesList.textContent = "No services scanned";
        } else {
          // Device not in storage (not in any group)
          friendlyNameInput.disabled = true;
          saveFriendlyNameBtn.disabled = true;
          friendlyNameInput.title = "Add device to a group to edit name";
          saveFriendlyNameBtn.title = "Add device to a group to edit name";

          detailsRow.querySelector(".device-groups-list").innerHTML =
            '<span class="info-text">Not assigned to any groups</span>';
        }
      }
    });
  });

  // Add event listeners to Add to Group buttons
  document.querySelectorAll(".add-to-group-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const rowId = btn.closest(".device-row")?.dataset.rowId;
      const device = appState.currentScannedDevices[rowId];

      // Add device to storage if not already there
      try {
        let storedDevice = null;
        const getResult = await window.api.storage.getDeviceByMac(device.mac);
        if (getResult.success && getResult.device) {
          storedDevice = getResult.device;
          console.log("[Renderer] Found existing device:", storedDevice);
        } else {
          // Device not in storage, add it
          console.log("[Renderer] Device not in storage, adding:", device);
          const addResult = await window.api.storage.addDevice(device);
          if (addResult.success) {
            storedDevice = addResult.device;
            console.log("[Renderer] Added device to storage:", storedDevice);
          }
        }

        if (storedDevice) {
          console.log("[Renderer] Opening modal for device:", storedDevice);
          openAddToGroupModal(storedDevice);
        }
      } catch (error) {
        console.error("[Renderer] Error opening add to group modal:", error);
      }
    });
  });
}
