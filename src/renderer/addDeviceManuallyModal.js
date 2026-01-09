/**
 * Add Device Manually modal UI and handlers
 */

import { domElements, appState } from "./domElements.js";

/**
 * Opens the add device manually modal with optional group preselection
 * @param {string} preselectedGroupId - Optional group ID to auto-select
 */
export async function openAddDeviceManuallyModal(preselectedGroupId = null) {
  const {
    addDeviceManuallyModal,
    manualDeviceName,
    manualDeviceIp,
    manualDeviceMac,
    manualDeviceManufacturer,
    manualDeviceFriendlyName,
    manualDeviceGroupList,
  } = domElements;

  // Reset form
  manualDeviceName.value = "";
  manualDeviceIp.value = "";
  manualDeviceMac.value = "";
  manualDeviceManufacturer.value = "";
  manualDeviceFriendlyName.value = "";
  appState.selectedGroupIdsForManualDevice.clear();
  appState.originalGroupIdsForManualDevice.clear();

  // Load groups for selection
  try {
    const groupsResult = await window.api.storage.getAllGroups();
    const groups = groupsResult.success ? groupsResult.groups : [];

    let groupsHtml = "";
    groups.forEach((group) => {
      const isChecked = preselectedGroupId === group.id ? "checked" : "";
      groupsHtml += `
        <label class="group-option">
          <input type="checkbox" class="group-checkbox" data-group-id="${group.id}" ${isChecked} />
          <span class="group-option-label">${group.name}</span>
        </label>
      `;
      if (preselectedGroupId === group.id) {
        appState.selectedGroupIdsForManualDevice.add(group.id);
      }
    });

    manualDeviceGroupList.innerHTML =
      groupsHtml ||
      '<p class="empty-state-message no-groups">No groups available. Create one first.</p>';
  } catch (error) {
    console.error("[Renderer] Error loading groups:", error);
    manualDeviceGroupList.innerHTML =
      '<p class="empty-state-message error">Error loading groups</p>';
  }

  addDeviceManuallyModal.classList.add("show");
}

export function initializeAddDeviceManually() {
  const {
    addDeviceManuallyBtn,
    addDeviceManuallyModal,
    addDeviceManuallyCancel,
    addDeviceManuallyConfirm,
    manualDeviceName,
    manualDeviceIp,
    manualDeviceMac,
    manualDeviceManufacturer,
    manualDeviceFriendlyName,
    manualDeviceGroupList,
  } = domElements;

  // Only add button listener if button exists (for backward compatibility)
  if (addDeviceManuallyBtn) {
    addDeviceManuallyBtn.addEventListener("click", () => {
      openAddDeviceManuallyModal();
    });
  }

  // Close modal
  addDeviceManuallyCancel.addEventListener("click", () => {
    addDeviceManuallyModal.classList.remove("show");
    appState.selectedGroupIdsForManualDevice.clear();
    appState.originalGroupIdsForManualDevice.clear();
  });

  // Confirm add device manually
  addDeviceManuallyConfirm.addEventListener("click", async () => {
    // Validate inputs
    const name = manualDeviceName.value.trim();
    const ip = manualDeviceIp.value.trim();
    const mac = manualDeviceMac.value.trim();
    const manufacturer = manualDeviceManufacturer.value.trim();
    const friendlyName = manualDeviceFriendlyName.value.trim();

    if (!name || !ip) {
      alert("Please fill in Device Name and IP Address");
      return;
    }

    // Validate MAC address format only if provided
    const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    if (mac && !macRegex.test(mac)) {
      alert(
        "Invalid MAC address format. Use format: 00:11:22:33:44:55 or 00-11-22-33-44-55",
      );
      return;
    }

    // Validate IP address format
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ip)) {
      alert("Invalid IP address format. Use format: 192.168.1.100");
      return;
    }

    // Get selected groups
    const selectedGroupCheckboxes = manualDeviceGroupList.querySelectorAll(
      ".group-checkbox:checked",
    );
    if (selectedGroupCheckboxes.length === 0) {
      alert("Please select at least one group for the device");
      return;
    }

    try {
      // Create device object
      const newDevice = {
        id: `manual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: name,
        ip: ip,
        mac: mac,
        manufacturer: manufacturer || "Unknown",
        friendlyName: friendlyName || null,
        groupIds: [],
        addedAt: new Date().toISOString(),
      };

      // Add device to storage
      const deviceResult = await window.api.storage.addDevice(newDevice);
      if (!deviceResult.success) {
        alert("Error adding device: " + deviceResult.error);
        return;
      }

      // Add selected groups
      selectedGroupCheckboxes.forEach((checkbox) => {
        appState.selectedGroupIdsForManualDevice.add(checkbox.dataset.groupId);
      });

      // Add device to selected groups
      for (const groupId of appState.selectedGroupIdsForManualDevice) {
        const addToGroupResult = await window.api.storage.addDeviceToGroup(
          newDevice.id,
          groupId,
        );
        if (!addToGroupResult.success) {
          console.error(
            "[Renderer] Error adding device to group:",
            addToGroupResult.error,
          );
        }
      }

      console.log("[Renderer] Device added successfully");
      addDeviceManuallyModal.classList.remove("show");

      // Refresh groups display if device groups tab is active
      const tabContent = document.getElementById("device-group");
      if (tabContent && tabContent.classList.contains("active")) {
        const { renderGroups } = await import("./groupsUI.js");
        await renderGroups();
      }

      // Clear form
      manualDeviceName.value = "";
      manualDeviceIp.value = "";
      manualDeviceMac.value = "";
      manualDeviceManufacturer.value = "";
      manualDeviceFriendlyName.value = "";
      appState.selectedGroupIdsForManualDevice.clear();
      appState.originalGroupIdsForManualDevice.clear();

      alert("Device added successfully!");
    } catch (error) {
      console.error("[Renderer] Error adding device manually:", error);
      alert("Error: " + error.message);
    }
  });

  // Track group selection in manual device modal
  document.addEventListener("change", (e) => {
    if (e.target.classList.contains("group-checkbox")) {
      const groupId = e.target.dataset.groupId;
      if (e.target.checked) {
        appState.selectedGroupIdsForManualDevice.add(groupId);
      } else {
        appState.selectedGroupIdsForManualDevice.delete(groupId);
      }
    }
  });
}
