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

  // In development, load from Vite dev server; in production, load from built files
  const isDev = process.env.NODE_ENV === "development" || !process.env.NODE_ENV;

  if (isDev) {
    log.debug("Loading from Vite dev server at http://localhost:5173");
    mainWindow.loadURL("http://localhost:5173");
  } else {
    log.debug("Loading from dist/renderer/index.html");
    const rendererPath = path.resolve(
      __dirname,
      "../../dist/renderer/index.html",
    );
    mainWindow.loadFile(rendererPath);
  }

  log.info("Main window created successfully");
  return mainWindow;
}
