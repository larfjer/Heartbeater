/**
 * Renderer process entry point
 *
 * This file handles:
 * - Initialization on DOM ready
 * - Registration of UI event handlers
 *
 * Actual UI logic is delegated to modular components in src/renderer/
 */

// Wait for DOM to be ready
document.addEventListener("DOMContentLoaded", async () => {
  // Import all UI modules
  const { initializeTabs } = await import("./src/renderer/tabs.js");
  const { initializeScanButton } = await import("./src/renderer/scanner.js");
  const { initializeAddToGroupModal, initializeCreateNewGroup } =
    await import("./src/renderer/addToGroupModal.js");
  const { initializeAddDeviceManually } =
    await import("./src/renderer/addDeviceManuallyModal.js");
  const { renderGroupConnectivity } =
    await import("./src/renderer/groupConnectivityUI.js");
  const { setupPingControlListeners } =
    await import("./src/renderer/deviceScanUI.js");

  // Initialize all UI components
  initializeTabs();
  initializeScanButton();
  initializeAddToGroupModal();
  initializeCreateNewGroup();
  initializeAddDeviceManually();
  setupPingControlListeners();

  // Render the initial "Group Connectivity" tab
  renderGroupConnectivity();
});
