/**
 * Add to Group modal UI and handlers
 */

import { domElements, appState } from "./domElements.js";
import { updateDeviceGroupIndicator } from "./deviceGroupIndicator.js";

export async function openAddToGroupModal(device) {
  appState.selectedDeviceForGroup = device;
  appState.selectedGroupIds.clear();
  appState.originalGroupIds.clear();
  domElements.newGroupName.value = "";
  domElements.newGroupDescription.value = "";

  try {
    const result = await window.api.storage.getAllGroups();
    if (!result.success) {
      console.error("Error loading groups:", result.error);
      return;
    }

    const groups = result.groups;
    const deviceGroups = await window.api.storage.getGroupsForDevice(device.id);
    console.log("[Renderer] Device groups result:", deviceGroups);
    const deviceGroupIds = deviceGroups.success ? deviceGroups.groups.map((g) => g.id) : [];
    console.log("[Renderer] Device group IDs:", deviceGroupIds);

    // Pre-select groups the device is already in and store as original
    deviceGroupIds.forEach((groupId) => {
      appState.selectedGroupIds.add(groupId);
      appState.originalGroupIds.add(groupId);
    });
    console.log("[Renderer] Selected group IDs after pre-select:", appState.selectedGroupIds);
    console.log("[Renderer] Original group IDs:", appState.originalGroupIds);

    if (groups.length === 0) {
      domElements.groupList.innerHTML =
        '<p style="color: var(--md-sys-color-on-surface-variant); text-align: center; padding: 24px;">No groups exist yet. Create one below.</p>';
    } else {
      let html = "";
      groups.forEach((group) => {
        const isSelected = deviceGroupIds.includes(group.id);
        html += `
          <label class="group-option">
            <input type="checkbox" class="group-checkbox" data-group-id="${group.id}" ${isSelected ? "checked" : ""} />
            <span class="group-option-label">${group.name}</span>
          </label>
        `;
      });
      domElements.groupList.innerHTML = html;

      // Set the checked property and add .selected class to pre-selected groups
      document.querySelectorAll(".group-checkbox").forEach((checkbox) => {
        if (deviceGroupIds.includes(checkbox.dataset.groupId)) {
          checkbox.checked = true;
          checkbox.parentElement.classList.add("selected");
        }
      });

      // Add event listeners for checkboxes
      document.querySelectorAll(".group-checkbox").forEach((checkbox) => {
        checkbox.addEventListener("change", (e) => {
          const groupId = checkbox.dataset.groupId;
          if (e.target.checked) {
            appState.selectedGroupIds.add(groupId);
            checkbox.parentElement.classList.add("selected");
          } else {
            appState.selectedGroupIds.delete(groupId);
            checkbox.parentElement.classList.remove("selected");
          }
          console.log("[Renderer] Selected groups updated:", appState.selectedGroupIds);
        });
      });
    }

    domElements.addToGroupModal.classList.add("show");
  } catch (error) {
    console.error("[Renderer] Error loading groups:", error);
    alert("Error: " + error.message);
  }
}

export function initializeAddToGroupModal() {
  const { addToGroupCancel, addToGroupConfirm } = domElements;

  // Close modal
  addToGroupCancel.addEventListener("click", () => {
    domElements.addToGroupModal.classList.remove("show");
    appState.selectedDeviceForGroup = null;
    appState.selectedGroupIds.clear();
    appState.originalGroupIds.clear();
  });

  // Confirm add to group
  addToGroupConfirm.addEventListener("click", async () => {
    if (!appState.selectedDeviceForGroup) {
      return;
    }

    try {
      // Find groups to add (newly selected)
      const groupsToAdd = new Set(
        [...appState.selectedGroupIds].filter((id) => !appState.originalGroupIds.has(id))
      );
      // Find groups to remove (were selected before, but not now)
      const groupsToRemove = new Set(
        [...appState.originalGroupIds].filter((id) => !appState.selectedGroupIds.has(id))
      );

      console.log("[Renderer] Groups to add:", groupsToAdd);
      console.log("[Renderer] Groups to remove:", groupsToRemove);

      // Remove device from deselected groups
      for (const groupId of groupsToRemove) {
        console.log("[Renderer] Removing device from group:", groupId);
        const result = await window.api.storage.removeDeviceFromGroup(
          appState.selectedDeviceForGroup.id,
          groupId
        );

        if (!result.success) {
          alert("Error removing from group: " + result.error);
          return;
        }
      }

      // Add device to newly selected groups
      for (const groupId of groupsToAdd) {
        console.log("[Renderer] Adding device to group:", groupId);
        const result = await window.api.storage.addDeviceToGroup(
          appState.selectedDeviceForGroup.id,
          groupId
        );

        if (!result.success) {
          alert("Error adding to group: " + result.error);
          return;
        }
      }

      console.log("[Renderer] Device group memberships updated successfully");
      domElements.addToGroupModal.classList.remove("show");

      // Store device info before clearing selectedDeviceForGroup
      const deviceToUpdate = appState.selectedDeviceForGroup;

      // Update the device row to show group indicator
      await updateDeviceGroupIndicator(deviceToUpdate.id, deviceToUpdate);

      appState.selectedDeviceForGroup = null;
      appState.selectedGroupIds.clear();
      appState.originalGroupIds.clear();
    } catch (error) {
      console.error("[Renderer] Error updating device groups:", error);
      alert("Error: " + error.message);
    }
  });
}

export function initializeCreateNewGroup() {
  const { createNewGroupBtn, newGroupName, newGroupDescription } = domElements;

  createNewGroupBtn.addEventListener("click", async () => {
    const name = newGroupName.value.trim();
    const description = newGroupDescription.value.trim();

    if (!name) {
      alert("Please enter a group name");
      return;
    }

    try {
      const result = await window.api.storage.createGroup(name, description);
      if (!result.success) {
        alert("Error creating group: " + result.error);
        return;
      }

      const newGroup = result.group;
      console.log("[Renderer] Group created:", newGroup);

      // Clear inputs
      newGroupName.value = "";
      newGroupDescription.value = "";

      // Re-populate the group list
      const groupsResult = await window.api.storage.getAllGroups();
      const groups = groupsResult.success ? groupsResult.groups : [];

      if (groups.length > 0) {
        let html = "";
        groups.forEach((group) => {
          html += `
            <label class="group-option">
              <input type="checkbox" class="group-checkbox" data-group-id="${group.id}" />
              <span class="group-option-label">${group.name}</span>
            </label>
          `;
        });
        domElements.groupList.innerHTML = html;

        // Add event listeners for new checkboxes
        document.querySelectorAll(".group-checkbox").forEach((checkbox) => {
          checkbox.addEventListener("change", (e) => {
            const groupId = checkbox.dataset.groupId;
            if (e.target.checked) {
              appState.selectedGroupIds.add(groupId);
              checkbox.parentElement.classList.add("selected");
            } else {
              appState.selectedGroupIds.delete(groupId);
              checkbox.parentElement.classList.remove("selected");
            }
            console.log("[Renderer] Selected groups updated:", appState.selectedGroupIds);
          });
        });
      }
    } catch (error) {
      console.error("[Renderer] Error creating group:", error);
      alert("Error: " + error.message);
    }
  });
}
