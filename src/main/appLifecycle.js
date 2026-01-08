/**
 * Application lifecycle management
 */

import { app, BrowserWindow } from "electron";
import { log } from "./logger.js";
import { createWindow } from "./window.js";

export function registerAppLifecycleHandlers() {
  app.on("activate", () => {
    log.debug("App activated");
    if (BrowserWindow.getAllWindows().length === 0) {
      log.info("No windows open, creating new window");
      createWindow();
    }
  });

  app.on("window-all-closed", () => {
    log.info("All windows closed");
    if (process.platform !== "darwin") {
      log.info("Quitting app (non-macOS)");
      app.quit();
    }
  });
}

export function initializeApp(_storage) {
  log.info("App is ready");
  createWindow();
}
