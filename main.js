/**
 * Main entry point for Electron application
 *
 * This file handles:
 * - Application initialization
 * - Storage setup
 * - IPC handler registration
 *
 * Actual functionality is delegated to modular service files in src/main/
 */

import { app } from "electron";
import GroupStorageService from "./storage.js";
import { log } from "./src/main/logger.js";
import {
  registerAppLifecycleHandlers,
  initializeApp,
} from "./src/main/appLifecycle.js";
import { registerScannerHandlers } from "./src/main/ipcScannerHandlers.js";
import { registerDeviceStorageHandlers } from "./src/main/ipcDeviceHandlers.js";
import { registerGroupStorageHandlers } from "./src/main/ipcGroupHandlers.js";
import { registerGroupDeviceHandlers } from "./src/main/ipcGroupDeviceHandlers.js";
import { registerPingHandlers } from "./src/main/pingManager.js";

// Initialize storage
let storage;
let mainWindow;

// Register all IPC handlers
function registerIpcHandlers() {
  log.debug("Registering IPC handlers");
  registerScannerHandlers();
  registerDeviceStorageHandlers(storage);
  registerGroupStorageHandlers(storage);
  registerGroupDeviceHandlers(storage);
  registerPingHandlers(mainWindow);
}

// Initialize app when ready
app.whenReady().then(() => {
  log.info("App is ready");
  storage = new GroupStorageService();
  mainWindow = initializeApp(storage);
  registerIpcHandlers();
});

// Register app lifecycle handlers
registerAppLifecycleHandlers();
