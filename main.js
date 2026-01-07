const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const localDevices = require('local-devices');

// Logger utility for VS Code output
const log = {
  info: (message, ...args) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [INFO] ${message}`, ...args);
  },
  error: (message, ...args) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [ERROR] ${message}`, ...args);
  },
  debug: (message, ...args) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [DEBUG] ${message}`, ...args);
  },
};

function createWindow() {
  log.info('Creating main window');
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  log.debug('Loading index.html');
  mainWindow.loadFile('index.html');
  log.info('Main window created successfully');
}

ipcMain.handle('scan-network', async () => {
  log.info('Network scan requested');
  try {
    log.debug('Starting local devices scan...');
    const devices = await localDevices();
    log.info(`Network scan complete. Found ${devices.length} device(s)`);
    devices.forEach((device, index) => {
      log.debug(`  Device ${index + 1}: ${device.name || '(Unknown)'} - ${device.ip} - ${device.mac}`);
    });
    return { success: true, devices };
  } catch (error) {
    log.error('Network scan failed:', error.message);
    return { success: false, error: error.message };
  }
});

app.whenReady().then(() => {
  log.info('App is ready');
  createWindow();

  app.on('activate', () => {
    log.debug('App activated');
    if (BrowserWindow.getAllWindows().length === 0) {
      log.info('No windows open, creating new window');
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  log.info('All windows closed');
  if (process.platform !== 'darwin') {
    log.info('Quitting app (non-macOS)');
    app.quit();
  }
});
