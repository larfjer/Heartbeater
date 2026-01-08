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
 * @returns {string} HTML string for the device row
 */
export function renderDeviceRow(device, options = {}) {
  const {
    rowId = device.id || device.mac,
    buttonType = "add-to-group",
    buttonGroupId = null,
    showGroupBadge = false,
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

  return `
    <tr class="device-row" data-device-id="${device.id}" data-row-id="${rowId}">
      <td style="text-align: center;">
        <span class="material-icons expand-icon" style="font-size: 20px; cursor: pointer;">expand_more</span>
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
      <td><span class="ip-address">${device.ip}</span></td>
      <td><span class="mac-address">${device.mac}</span></td>
      <td><span class="manufacturer-badge">${manufacturer}</span></td>
      <td>
        <div style="display: flex; align-items: center; gap: 8px;">
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
            <th style="width: 40px;"></th>
            <th>Device Name</th>
            <th>IP Address</th>
            <th>MAC Address</th>
            <th>Manufacturer</th>
            <th style="width: 120px;">Actions</th>
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
    } catch (_e) {
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
      } catch (_e) {
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
      },
    );

    html += `
      <tr class="details-row" data-index="${index}">
        <td colspan="6">
          <div class="details-cell">
            <div class="details-title">Friendly Name</div>
            <div style="display: inline-flex; gap: 12px; margin-bottom: 24px; align-items: center;">
              <input
                type="text"
                class="device-friendly-name-input form-input-inline"
                placeholder="Enter friendly name"
                style="width: 600px;"
              />
              <button class="save-friendly-name-btn md-button">Save</button>
            </div>
            <div class="friendly-name-info"></div>
            
            <div class="details-title">Groups</div>
            <div class="device-groups-list"></div>
            
            <div style="display: flex; flex-direction: column; gap: 8px;">
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
      // Don't expand if clicking the add to group button
      if (e.target.closest(".add-to-group-btn")) return;

      const index = row.dataset.rowId;
      const detailsRow = document.querySelector(
        `.details-row[data-index="${index}"]`,
      );
      const icon = row.querySelector(".expand-icon");

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
            friendlyNameInfo.innerHTML = `<span style="color: var(--md-sys-color-on-surface-variant); font-size: var(--font-size-label);">Original name: ${storedDevice.name}</span>`;
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
                  friendlyNameInfo.innerHTML = `<span style="color: var(--md-sys-color-on-surface-variant); font-size: var(--font-size-label);">Original name: ${storedDevice.name}</span>`;
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
              '<span style="color: var(--md-sys-color-on-surface-variant); font-size: var(--font-size-label);">Not assigned to any groups</span>';
          } else {
            friendlyNameInput.disabled = false;
            saveFriendlyNameBtn.disabled = false;
            friendlyNameInput.title = "";
            saveFriendlyNameBtn.title = "";

            let groupsHtml =
              '<div style="display: flex; flex-wrap: wrap; gap: 8px;">';
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
            '<span style="color: var(--md-sys-color-on-surface-variant); font-size: var(--font-size-label);">Not assigned to any groups</span>';
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
