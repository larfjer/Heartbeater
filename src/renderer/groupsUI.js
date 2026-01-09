/**
 * Device groups UI and management
 */

import { domElements } from "./domElements.js";
import { renderDeviceRow, setupPingControlListeners } from "./deviceScanUI.js";
import { openAddDeviceManuallyModal } from "./addDeviceManuallyModal.js";

export async function renderGroups() {
  const { groupsContainer } = domElements;

  try {
    const result = await window.api.storage.getAllGroups();
    if (!result.success) {
      groupsContainer.innerHTML =
        '<div class="group-empty"><p>Error loading groups</p></div>';
      return;
    }

    const groups = result.groups;

    if (groups.length === 0) {
      groupsContainer.innerHTML = `
        <div class="group-empty">
          <span class="material-icons">folder_off</span>
          <p>No device groups yet. Create your first group from the device scan tab!</p>
        </div>
      `;
      return;
    }

    let html = `
      <div class="results-card">
        <div class="results-header">
          <span class="device-count">
            <span class="material-icons">group</span>
            ${groups.length} group${groups.length !== 1 ? "s" : ""}
          </span>
        </div>
        <table class="md-table">
          <thead>
            <tr>
              <th class="table-header-icon"></th>
              <th>Group Name</th>
              <th>Description</th>
              <th>Devices</th>
            </tr>
          </thead>
          <tbody>
    `;

    for (let index = 0; index < groups.length; index++) {
      const group = groups[index];
      const devicesResult = await window.api.storage.getDevicesInGroup(
        group.id,
      );
      const devices = devicesResult.success ? devicesResult.devices : [];

      html += `
        <tr class="group-row" data-group-id="${group.id}" data-index="${index}">
          <td class="group-row-expand-icon">
            <span class="material-icons expand-icon">expand_more</span>
          </td>
          <td>
            <div class="device-name">
              <div class="device-icon folder-icon">
                <span class="material-icons">folder</span>
              </div>
              <span class="device-name-text">${group.name}</span>
            </div>
          </td>
          <td><span class="device-manufacturer">${group.description || "No description"}</span></td>
          <td><span class="manufacturer-badge">${devices.length} device${devices.length !== 1 ? "s" : ""}</span></td>
        </tr>
        <tr class="group-details-row" data-index="${index}">
          <td colspan="4">
            <div class="details-cell">
              <div class="group-devices-header">
                <span class="group-devices-header-title">Devices in Group</span>
                <button class="add-device-to-group-btn" data-group-id="${group.id}">
                  <span class="material-icons">add</span>
                </button>
              </div>
              <div class="group-devices-list"></div>
            </div>
          </td>
        </tr>
      `;
    }

    html += "</tbody></table></div>";
    groupsContainer.innerHTML = html;

    // Add event listeners to expand group rows
    document.querySelectorAll(".group-row").forEach((row) => {
      row.addEventListener("click", async (_e) => {
        const index = row.dataset.index;
        const detailsRow = document.querySelector(
          `.group-details-row[data-index="${index}"]`,
        );
        const icon = row.querySelector(".expand-icon");
        const groupId = row.dataset.groupId;

        detailsRow.classList.toggle("expanded");
        icon.classList.toggle("expanded");

        if (detailsRow.classList.contains("expanded")) {
          // Load and display devices in this group
          const devicesResult =
            await window.api.storage.getDevicesInGroup(groupId);
          const devices = devicesResult.success ? devicesResult.devices : [];
          const devicesList = detailsRow.querySelector(".group-devices-list");

          if (devices.length === 0) {
            devicesList.innerHTML =
              '<p class="empty-devices-text">No devices in this group</p>';
          } else {
            let devicesHtml = `
              <table class="md-table full-width">
                <tbody>
            `;
            devices.forEach((device, deviceIndex) => {
              devicesHtml += renderDeviceRow(device, {
                rowId: deviceIndex,
                buttonType: "remove-from-group",
                buttonGroupId: groupId,
                showPingControls: true,
              });

              // Add details row for expansion
              devicesHtml += `
                <tr class="details-row" data-index="${deviceIndex}">
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
                    </div>
                  </td>
                </tr>
              `;
            });
            devicesHtml += `
                </tbody>
              </table>
            `;
            devicesList.innerHTML = devicesHtml;

            // Add event listeners for device row expansion
            devicesList.querySelectorAll(".device-row").forEach((row) => {
              row.addEventListener("click", async (e) => {
                // Don't expand if clicking the remove button or ping controls
                if (e.target.closest(".remove-device-btn")) return;
                if (e.target.closest(".device-ping-controls")) {
                  console.log(
                    "[Debug] Blocking expansion: device-ping-controls",
                  );
                  return;
                }

                const index = row.dataset.rowId;
                const detailsRow = devicesList.querySelector(
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
                  let storedDeviceResult =
                    await window.api.storage.getDevice(deviceId);
                  if (!storedDeviceResult?.success) {
                    // If not found by ID, try MAC address
                    storedDeviceResult =
                      await window.api.storage.getDeviceByMac(mac);
                  }
                  const storedDevice =
                    storedDeviceResult?.device || storedDeviceResult;

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
                        const result =
                          await window.api.storage.updateDeviceFriendlyName(
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
                          const nameText =
                            row.querySelector(".device-name-text");
                          if (nameText) {
                            nameText.textContent =
                              newFriendlyName || storedDevice.name;
                          }
                        }
                      } catch (error) {
                        console.error(
                          "[Renderer] Error saving friendly name:",
                          error,
                        );
                        alert("Error: " + error.message);
                      }
                    };

                    // Populate device groups section
                    const groupsList = detailsRow.querySelector(
                      ".device-groups-list",
                    );
                    const groupsResult =
                      await window.api.storage.getGroupsForDevice(deviceId);
                    const groups = groupsResult.success
                      ? groupsResult.groups
                      : [];

                    if (groups.length === 0) {
                      friendlyNameInput.disabled = true;
                      saveFriendlyNameBtn.disabled = true;
                      friendlyNameInput.title =
                        "Add device to a group to edit name";
                      saveFriendlyNameBtn.title =
                        "Add device to a group to edit name";
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
                    const servicesList =
                      detailsRow.querySelector(".services-list");
                    servicesList.textContent = "No services scanned";
                  } else {
                    // Device not in storage (not in any group)
                    friendlyNameInput.disabled = true;
                    saveFriendlyNameBtn.disabled = true;
                    friendlyNameInput.title =
                      "Add device to a group to edit name";
                    saveFriendlyNameBtn.title =
                      "Add device to a group to edit name";

                    detailsRow.querySelector(".device-groups-list").innerHTML =
                      '<span class="info-text">Not assigned to any groups</span>';
                  }
                }
              });
            });

            // Add event listeners for remove buttons
            devicesList
              .querySelectorAll(".remove-device-btn")
              .forEach((btn) => {
                btn.addEventListener("click", async (e) => {
                  e.stopPropagation();
                  const deviceId = btn.dataset.deviceId;
                  const gId = btn.dataset.groupId;

                  const result = await window.api.storage.removeDeviceFromGroup(
                    deviceId,
                    gId,
                  );
                  if (result.success) {
                    // Refresh the entire groups display
                    await renderGroups();
                  }
                });
              });

            // Add event listener for add device button in this group
            const addDeviceBtn = detailsRow.querySelector(
              ".add-device-to-group-btn",
            );
            if (addDeviceBtn) {
              addDeviceBtn.addEventListener("click", async (e) => {
                e.stopPropagation();
                await openAddDeviceManuallyModal(groupId);
              });
            }
          }
        }
      });

      // Set up ping control listeners for devices in groups
      setupPingControlListeners();
    });
  } catch (error) {
    console.error("[Renderer] Error rendering groups:", error);
    groupsContainer.innerHTML = `<div class="group-empty"><p>Error: ${error.message}</p></div>`;
  }
}
