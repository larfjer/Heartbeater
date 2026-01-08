/**
 * Device groups UI and management
 */

import { domElements } from "./domElements.js";

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
              <th style="width: 40px;"></th>
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
          <td style="text-align: center;">
            <span class="material-icons expand-icon" style="font-size: 20px; cursor: pointer;">expand_more</span>
          </td>
          <td>
            <div style="font-weight: 500; color: var(--md-sys-color-on-surface);">
              <span class="material-icons" style="vertical-align: middle; margin-right: 8px; color: var(--md-sys-color-primary);">folder</span>
              ${group.name}
            </div>
          </td>
          <td><span style="color: var(--md-sys-color-on-surface-variant);">${group.description || "No description"}</span></td>
          <td><span class="manufacturer-badge">${devices.length} device${devices.length !== 1 ? "s" : ""}</span></td>
        </tr>
        <tr class="group-details-row" data-index="${index}">
          <td colspan="4">
            <div class="details-cell">
              <div class="details-title">Devices in Group</div>
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
              '<p style="color: var(--md-sys-color-on-surface-variant); margin: 0;">No devices in this group</p>';
          } else {
            let devicesHtml =
              '<div style="display: flex; flex-direction: column; gap: 8px;">';
            devices.forEach((device) => {
              const displayName =
                device.friendlyName || device.name || "(Unknown)";
              const originalName = device.friendlyName
                ? ` (${device.name})`
                : "";
              devicesHtml += `
                <div style="padding: 12px; background-color: var(--md-sys-color-surface); border-radius: 6px; border-left: 4px solid var(--md-sys-color-primary);">
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <span class="material-icons" style="color: var(--md-sys-color-on-surface-variant);">devices</span>
                    <div style="flex: 1;">
                      <div style="font-weight: 500; color: var(--md-sys-color-on-surface);">${displayName}</div>
                      ${originalName ? `<div style="font-size: 12px; color: var(--md-sys-color-on-surface-variant);">Original: ${originalName}</div>` : ""}
                      <div style="font-size: 12px; color: var(--md-sys-color-on-surface-variant); margin-top: 4px;">
                        <span style="font-family: monospace;">${device.ip}</span> • <span style="font-family: monospace;">${device.mac}</span>
                      </div>
                    </div>
                    <span class="manufacturer-badge">${device.manufacturer || "Unknown"}</span>
                    <button class="remove-device-btn" data-group-id="${groupId}" data-device-id="${device.id}" style="background: none; border: none; padding: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--md-sys-color-error); border-radius: 4px; transition: background-color 0.2s;">
                      <span class="material-icons" style="font-size: 20px;">close</span>
                    </button>
                  </div>
                </div>
              `;
            });
            devicesHtml += "</div>";
            devicesList.innerHTML = devicesHtml;

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
                    // Refresh the group display
                    const updatedDevicesResult =
                      await window.api.storage.getDevicesInGroup(gId);
                    const updatedDevices = updatedDevicesResult.success
                      ? updatedDevicesResult.devices
                      : [];

                    if (updatedDevices.length === 0) {
                      devicesList.innerHTML =
                        '<p style="color: var(--md-sys-color-on-surface-variant); margin: 0;">No devices in this group</p>';
                    } else {
                      let updatedHtml =
                        '<div style="display: flex; flex-direction: column; gap: 8px;">';
                      updatedDevices.forEach((d) => {
                        const dDisplayName =
                          d.friendlyName || d.name || "(Unknown)";
                        const dOriginalName = d.friendlyName
                          ? ` (${d.name})`
                          : "";
                        updatedHtml += `
                        <div style="padding: 12px; background-color: var(--md-sys-color-surface); border-radius: 6px; border-left: 4px solid var(--md-sys-color-primary);">
                          <div style="display: flex; align-items: center; gap: 12px;">
                            <span class="material-icons" style="color: var(--md-sys-color-on-surface-variant);">devices</span>
                            <div style="flex: 1;">
                              <div style="font-weight: 500; color: var(--md-sys-color-on-surface);">${dDisplayName}</div>
                              ${dOriginalName ? `<div style="font-size: 12px; color: var(--md-sys-color-on-surface-variant);">Original: ${dOriginalName}</div>` : ""}
                              <div style="font-size: 12px; color: var(--md-sys-color-on-surface-variant); margin-top: 4px;">
                                <span style="font-family: monospace;">${d.ip}</span> • <span style="font-family: monospace;">${d.mac}</span>
                              </div>
                            </div>
                            <span class="manufacturer-badge">${d.manufacturer || "Unknown"}</span>
                            <button class="remove-device-btn" data-group-id="${gId}" data-device-id="${d.id}" style="background: none; border: none; padding: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--md-sys-color-error); border-radius: 4px; transition: background-color 0.2s;">
                              <span class="material-icons" style="font-size: 20px;">close</span>
                            </button>
                          </div>
                        </div>
                      `;
                      });
                      updatedHtml += "</div>";
                      devicesList.innerHTML = updatedHtml;

                      // Re-attach event listeners to new buttons
                      devicesList
                        .querySelectorAll(".remove-device-btn")
                        .forEach((newBtn) => {
                          newBtn.addEventListener("click", arguments.callee);
                        });
                    }
                  }
                });

                // Add hover effect
                btn.addEventListener("mouseenter", () => {
                  btn.style.backgroundColor =
                    "var(--md-sys-color-error-container)";
                });

                btn.addEventListener("mouseleave", () => {
                  btn.style.backgroundColor = "transparent";
                });
              });
          }
        }
      });
    });
  } catch (error) {
    console.error("[Renderer] Error rendering groups:", error);
    groupsContainer.innerHTML = `<div class="group-empty"><p>Error: ${error.message}</p></div>`;
  }
}
