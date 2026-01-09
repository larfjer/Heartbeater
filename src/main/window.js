/**
 * Window management utilities for Electron app
 */

import { BrowserWindow } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import { log } from "./logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createWindow() {
  log.info("Creating main window");
  const preloadPath = path.resolve(__dirname, "../../preload.cjs");
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  log.debug("Loading index.html");
  mainWindow.loadFile("index.html");
  log.info("Main window created successfully");
  return mainWindow;
}
