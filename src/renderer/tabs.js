/**
 * Tab switching and navigation
 */

import { domElements } from "./domElements.js";
import { renderGroups } from "./groupsUI.js";
import { renderGroupConnectivity } from "./groupConnectivityUI.js";
import { renderHistory } from "./historyUI.js";

export function initializeTabs() {
  const { tabs, tabContents } = domElements;

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const tabName = tab.dataset.tab;

      // Update active tab
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");

      // Update active content
      tabContents.forEach((content) => content.classList.remove("active"));
      document.getElementById(tabName).classList.add("active");

      console.log("[Renderer] Switched to tab:", tabName);

      if (tabName === "group-connectivity") {
        renderGroupConnectivity();
      } else if (tabName === "history") {
        renderHistory();
      } else if (tabName === "device-group") {
        renderGroups();
      }
    });
  });
}
