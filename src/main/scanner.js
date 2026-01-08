/**
 * Device scanning utilities using local-devices and vendor lookup
 */

import localDevices from "local-devices";
import vendorLookup from "@network-utils/vendor-lookup";
import { exec } from "child_process";
import { promisify } from "util";
import { log } from "./logger.js";

const lookupMac = vendorLookup.toVendor || vendorLookup.default || vendorLookup;
const execAsync = promisify(exec);

/**
 * Enrich a device with manufacturer information based on MAC address
 */
export async function enrichDeviceWithManufacturer(device) {
  try {
    const vendor = await lookupMac(device.mac);
    device.manufacturer = vendor || "Unknown";
  } catch (error) {
    log.debug(`Failed to lookup MAC ${device.mac}:`, error.message);
    device.manufacturer = "Unknown";
  }
  return device;
}

/**
 * Scan a specific device for OS and service details using nmap
 */
export async function scanDeviceDetails(ip) {
  try {
    log.debug(`Running nmap scan on ${ip}...`);
    const { stdout } = await execAsync(
      `nmap -sV -O -T4 --max-os-tries 1 ${ip} 2>/dev/null || true`,
      {
        timeout: 30000,
      },
    );

    const details = {
      os: "Unknown",
      services: [],
    };

    // Extract OS info
    const osMatch = stdout.match(/OS details: (.+?)(?:\n|$)/);
    if (osMatch) {
      details.os = osMatch[1].trim();
    }

    // Extract running services
    const serviceLines = stdout.match(
      /(\d+)\/\w+\s+open\s+(.+?)\s+(.+?)(?:\n|$)/g,
    );
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
    return { os: "Unknown", services: [] };
  }
}

/**
 * Scan the local network for all connected devices
 */
export async function scanNetwork() {
  log.info("Network scan requested");
  try {
    log.debug("Starting local devices scan...");
    let devices = await localDevices();
    log.info(`Found ${devices.length} device(s) on network`);

    // Enrich with manufacturer info
    log.debug("Enriching devices with manufacturer info...");
    devices = await Promise.all(
      devices.map((d) => enrichDeviceWithManufacturer(d)),
    );

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
        `  Device ${index + 1}: ${device.name || "(Unknown)"} - ${device.ip} - ${device.mac} - ${device.manufacturer}`,
      );
    });

    return { success: true, devices };
  } catch (error) {
    log.error("Network scan failed:", error.message);
    return { success: false, error: error.message };
  }
}
