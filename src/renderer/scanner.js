/**
 * Device scanning and network scan UI
 */

import { domElements, appState } from "./domElements.js";
import { renderDeviceScan } from "./deviceScanUI.js";

export async function initializeScanButton() {
  const { scanBtn } = domElements;

  scanBtn.addEventListener("click", async () => {
    console.log("[Renderer] Scan button clicked");
    scanBtn.disabled = true;
    scanBtn.innerHTML = '<span class="material-icons">hourglass_top</span> Scanning...';
    domElements.status.innerHTML = '<div class="spinner"></div> Scanning network for devices...';

    try {
      const response = await window.api.scanNetwork();
      console.log("[Renderer] Got response:", response);

      scanBtn.disabled = false;
      scanBtn.innerHTML = '<span class="material-icons">radar</span> Scan Network';
      domElements.status.innerHTML = "";

      if (response.success) {
        appState.currentScannedDevices = response.devices;
        await renderDeviceScan(response.devices);
      } else {
        domElements.status.innerHTML = `<span class="material-icons" style="color: var(--md-sys-color-error)">error</span> Error: ${response.error}`;
      }
    } catch (error) {
      console.error("[Renderer] Error:", error);
      scanBtn.disabled = false;
      scanBtn.innerHTML = '<span class="material-icons">radar</span> Scan Network';
      domElements.status.innerHTML = `<span class="material-icons" style="color: var(--md-sys-color-error)">error</span> Error: ${error.message}`;
    }
  });
}
