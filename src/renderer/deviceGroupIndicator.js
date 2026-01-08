/**
 * Device group indicator badge updates
 */

export async function updateDeviceGroupIndicator(deviceId, device = null) {
  const groups = await window.api.storage.getGroupsForDevice(deviceId);
  const groupCount = groups.success ? groups.groups.length : 0;
  console.log(
    "[Renderer] Updating device group indicator for:",
    deviceId,
    "count:",
    groupCount,
  );

  // Try to find the device row by device ID first
  let deviceRow = document.querySelector(
    `tr.device-row[data-device-id="${deviceId}"]`,
  );

  // If not found by ID, try to find by looking up the device and using its MAC
  if (!deviceRow && device && device.mac) {
    const allRows = document.querySelectorAll("tr.device-row");
    for (const row of allRows) {
      const mac = row.querySelector(".mac-address");
      if (mac && mac.textContent === device.mac) {
        deviceRow = row;
        break;
      }
    }
  }

  if (deviceRow) {
    console.log("[Renderer] Found device row, updating badges");
    // Find the parent div containing the name text and badge
    const nameDiv = deviceRow.querySelector(".device-name > div:last-child");
    if (nameDiv) {
      // Remove any existing badge
      const existingBadge = nameDiv.querySelector(".device-groups-badge");
      if (existingBadge) {
        existingBadge.remove();
      }

      // Add new badge if count > 0
      if (groupCount > 0) {
        const badgeHtml = `<span class="device-groups-badge">${groupCount} group${groupCount !== 1 ? "s" : ""}</span>`;
        nameDiv.insertAdjacentHTML("beforeend", badgeHtml);
        console.log("[Renderer] Added badge with count:", groupCount);
      }
    }
  } else {
    console.log("[Renderer] Device row not found for ID:", deviceId);
  }
}
