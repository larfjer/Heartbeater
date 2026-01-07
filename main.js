import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import localDevices from 'local-devices';
import vendorLookup from '@network-utils/vendor-lookup';
import { exec } from 'child_process';
import { promisify } from 'util';

const { lookupMac } = vendorLookup;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execAsync = promisify(exec);

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

// Enrich device with manufacturer info
async function enrichDeviceWithManufacturer(device) {
  try {
    const vendor = await lookupMac(device.mac);
    device.manufacturer = vendor || 'Unknown';
  } catch (error) {
    log.debug(`Failed to lookup MAC ${device.mac}:`, error.message);
    device.manufacturer = 'Unknown';
  }
  return device;
}

// Get OS and service info via nmap
async function scanDeviceDetails(ip) {
  try {
    log.debug(`Running nmap scan on ${ip}...`);
    const { stdout } = await execAsync(
      `nmap -sV -O -T4 --max-os-tries 1 ${ip} 2>/dev/null || true`,
      {
        timeout: 30000,
      }
    );

    const details = {
      os: 'Unknown',
      services: [],
    };

    // Extract OS info
    const osMatch = stdout.match(/OS details: (.+?)(?:\n|$)/);
    if (osMatch) {
      details.os = osMatch[1].trim();
    }

    // Extract running services
    const serviceLines = stdout.match(/(\d+)\/\w+\s+open\s+(.+?)\s+(.+?)(?:\n|$)/g);
    if (serviceLines) {
      serviceLines.forEach((line) => {
        const match = line.match(/(\d+)\/(\w+)\s+open\s+(.+?)\s+(.+?)(?:\n|$)/);
        if (match) {
          details.services.push({
            port: match[1],
            protocol: match[2],
            service: match[3],
            version: match[4],
          });
        }
      });
    }

    log.debug(`Scan complete for ${ip}:`, details);
    return details;
  } catch (error) {
    log.debug(`nmap scan failed for ${ip}:`, error.message);
    return { os: 'Unknown', services: [] };
  }
}

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
    let devices = await localDevices();
    log.info(`Found ${devices.length} device(s) on network`);

    // Enrich with manufacturer info
    log.debug('Enriching devices with manufacturer info...');
    devices = await Promise.all(devices.map((d) => enrichDeviceWithManufacturer(d)));

    // Optionally scan details for each device (this can take time)
    // Uncomment below to enable nmap scanning for OS and services
    // log.debug('Scanning device details (OS, services)...');
    // devices = await Promise.all(
    //   devices.map(async (device) => {
    //     const details = await scanDeviceDetails(device.ip);
    //     return { ...device, ...details };
    //   })
    // );

    devices.forEach((device, index) => {
      log.debug(
        `  Device ${index + 1}: ${device.name || '(Unknown)'} - ${device.ip} - ${device.mac} - ${device.manufacturer}`
      );
    });

    return { success: true, devices };
  } catch (error) {
    log.error('Network scan failed:', error.message);
    return { success: false, error: error.message };
  }
});

// Optional IPC handler for detailed device scanning
ipcMain.handle('scan-device-details', async (event, ip) => {
  log.info(`Detailed scan requested for ${ip}`);
  try {
    const details = await scanDeviceDetails(ip);
    return { success: true, ...details };
  } catch (error) {
    log.error(`Detailed scan failed for ${ip}:`, error.message);
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
