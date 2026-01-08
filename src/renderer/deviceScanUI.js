/**
 * Device scan results UI rendering and management
 */

import { domElements, appState } from "./domElements.js";
import { openAddToGroupModal } from "./addToGroupModal.js";

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
    let groupBadge = "";
    if (storedDevice) {
      try {
        const groupsResult = await window.api.storage.getGroupsForDevice(storedDevice.id);
        if (groupsResult.success) {
          groupCount = groupsResult.groups.length;
          if (groupCount > 0) {
            groupBadge = `<span class="device-groups-badge">${groupCount} group${groupCount !== 1 ? "s" : ""}</span>`;
          }
        }
      } catch (_e) {
        console.debug("Error getting groups for device");
      }
    }

    html += `
      <tr class="device-row" data-ip="${device.ip}" data-index="${index}" data-device-id="${storedDevice?.id || device.mac || device.id}">
        <td style="text-align: center;">
          <span class="material-icons expand-icon" style="font-size: 20px; cursor: pointer;">expand_more</span>
        </td>
        <td>
          <div class="device-name">
            <div class="device-icon">
              <span class="material-icons">devices</span>
            </div>
            <div>
              <div class="device-name-text">${storedDevice?.friendlyName || device.name || "(Unknown)"}</div>
              ${groupBadge}
            </div>
          </div>
        </td>
        <td><span class="ip-address">${device.ip}</span></td>
        <td><span class="mac-address">${device.mac}</span></td>
        <td><span class="manufacturer-badge">${device.manufacturer || "Unknown"}</span></td>
        <td>
          <div style="display: flex; align-items: center; gap: 8px;">
            <button class="add-to-group-btn" data-device-index="${index}">
              <span class="material-icons">group_add</span>
              Add to Group
            </button>
            ${groupCount > 0 ? `<span class="action-badge">${groupCount}</span>` : ""}
          </div>
        </td>
      </tr>
      <tr class="details-row" data-index="${index}">
        <td colspan="6">
          <div class="details-cell">
            <div class="details-title">Friendly Name</div>
            <div style="display: flex; gap: 12px; margin-bottom: 24px;">
              <input type="text" class="device-friendly-name-input" style="flex: 1; padding: 8px; border: 1px solid var(--md-sys-color-outline); border-radius: 4px;" placeholder="Enter friendly name" />
              <button class="save-friendly-name-btn" style="padding: 8px 16px; background-color: var(--md-sys-color-primary); color: var(--md-sys-color-on-primary); border: none; border-radius: 4px; cursor: pointer; font-weight: 500;">Save</button>
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

      const index = row.dataset.index;
      const detailsRow = document.querySelector(`.details-row[data-index="${index}"]`);
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
        const friendlyNameInput = detailsRow.querySelector(".device-friendly-name-input");
        const friendlyNameInfo = detailsRow.querySelector(".friendly-name-info");
        const saveFriendlyNameBtn = detailsRow.querySelector(".save-friendly-name-btn");

        if (storedDevice) {
          friendlyNameInput.value = storedDevice.friendlyName || "";
          if (storedDevice.friendlyName) {
            friendlyNameInfo.textContent = `Original name: ${storedDevice.name}`;
          } else {
            friendlyNameInfo.textContent = "";
          }

          // Save friendly name button handler
          saveFriendlyNameBtn.onclick = async () => {
            const newFriendlyName = friendlyNameInput.value.trim();
            try {
              const result = await window.api.storage.updateDeviceFriendlyName(
                storedDevice.id,
                newFriendlyName
              );
              if (result.success) {
                console.log("[Renderer] Friendly name updated");
                if (newFriendlyName) {
                  friendlyNameInfo.textContent = `Original name: ${storedDevice.name}`;
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
          const groupsResult = await window.api.storage.getGroupsForDevice(deviceId);
          const groups = groupsResult.success ? groupsResult.groups : [];

          if (groups.length === 0) {
            groupsList.innerHTML =
              '<p style="color: var(--md-sys-color-on-surface-variant); margin: 0;">Device is not part of any groups</p>';
          } else {
            let groupsHtml = "";
            groups.forEach((group) => {
              groupsHtml += `
                <div style="padding: 8px; background-color: var(--md-sys-color-surface-variant); border-radius: 4px; margin: 4px 0;">
                  ${group.name}
                </div>
              `;
            });
            groupsList.innerHTML = groupsHtml;
          }

          // Populate OS and services (stub for future functionality)
          const osInfo = detailsRow.querySelector(".os-info");
          osInfo.textContent = "Not scanned";
          const servicesList = detailsRow.querySelector(".services-list");
          servicesList.textContent = "No services scanned";
        }
      }
    });
  });

  // Add event listeners to Add to Group buttons
  document.querySelectorAll(".add-to-group-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const deviceIndex = btn.dataset.deviceIndex;
      const device = appState.currentScannedDevices[deviceIndex];

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
