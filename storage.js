import fs from "fs";
import path from "path";
import { app } from "electron";

class GroupStorageService {
  constructor() {
    this.storageDir = path.join(app.getPath("userData"), "storage");
    this.storageFile = path.join(this.storageDir, "groups.json");
    this.initializeStorage();
  }

  initializeStorage() {
    try {
      if (!fs.existsSync(this.storageDir)) {
        fs.mkdirSync(this.storageDir, { recursive: true });
      }

      if (!fs.existsSync(this.storageFile)) {
        const initialData = {
          devices: {},
          groups: {},
        };
        fs.writeFileSync(this.storageFile, JSON.stringify(initialData, null, 2));
      }
    } catch (error) {
      console.error("Error initializing storage:", error);
    }
  }

  // Internal methods
  getData() {
    try {
      const data = fs.readFileSync(this.storageFile, "utf-8");
      return JSON.parse(data);
    } catch (error) {
      console.error("Error reading storage:", error);
      return { devices: {}, groups: {} };
    }
  }

  saveData(data) {
    try {
      fs.writeFileSync(this.storageFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error("Error saving storage:", error);
    }
  }

  // Device operations
  addDevice(device) {
    const data = this.getData();
    const deviceId = device.id || this.generateId();
    const newDevice = {
      ...device,
      id: deviceId,
      groupIds: [],
      addedAt: new Date().toISOString(),
    };
    data.devices[deviceId] = newDevice;
    this.saveData(data);
    return newDevice;
  }

  updateDeviceFriendlyName(deviceId, friendlyName) {
    const data = this.getData();
    if (data.devices[deviceId]) {
      data.devices[deviceId].friendlyName = friendlyName;
      this.saveData(data);
      return true;
    }
    return false;
  }

  getDevice(deviceId) {
    const data = this.getData();
    return data.devices[deviceId] || null;
  }

  getDeviceByMac(mac) {
    const data = this.getData();
    const device = Object.values(data.devices).find((d) => d.mac === mac);
    return device || null;
  }

  getAllDevices() {
    const data = this.getData();
    return Object.values(data.devices);
  }

  getDeviceDisplayName(deviceId) {
    const device = this.getDevice(deviceId);
    if (!device) return "Unknown Device";
    return device.friendlyName || device.name || "Unknown Device";
  }

  removeDevice(deviceId) {
    const data = this.getData();
    if (data.devices[deviceId]) {
      const device = data.devices[deviceId];
      // Remove from all groups
      device.groupIds.forEach((groupId) => {
        if (data.groups[groupId]) {
          data.groups[groupId].deviceIds = data.groups[groupId].deviceIds.filter(
            (id) => id !== deviceId
          );
        }
      });
      delete data.devices[deviceId];
      this.saveData(data);
      return true;
    }
    return false;
  }

  // Group operations
  createGroup(name, description = "") {
    const data = this.getData();
    const groupId = this.generateId();
    const newGroup = {
      id: groupId,
      name,
      description,
      deviceIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    data.groups[groupId] = newGroup;
    this.saveData(data);
    return newGroup;
  }

  updateGroup(groupId, name, description) {
    const data = this.getData();
    if (data.groups[groupId]) {
      data.groups[groupId].name = name;
      data.groups[groupId].description = description;
      data.groups[groupId].updatedAt = new Date().toISOString();
      this.saveData(data);
      return true;
    }
    return false;
  }

  getGroup(groupId) {
    const data = this.getData();
    return data.groups[groupId] || null;
  }

  getAllGroups() {
    const data = this.getData();
    return Object.values(data.groups);
  }

  deleteGroup(groupId) {
    const data = this.getData();
    if (data.groups[groupId]) {
      // Remove group from all devices
      Object.values(data.devices).forEach((device) => {
        device.groupIds = device.groupIds.filter((id) => id !== groupId);
      });
      delete data.groups[groupId];
      this.saveData(data);
      return true;
    }
    return false;
  }

  // Group-Device relationship operations
  addDeviceToGroup(deviceId, groupId) {
    const data = this.getData();

    if (!data.devices[deviceId] || !data.groups[groupId]) {
      return false;
    }

    // Add group to device if not already there
    if (!data.devices[deviceId].groupIds.includes(groupId)) {
      data.devices[deviceId].groupIds.push(groupId);
    }

    // Add device to group if not already there
    if (!data.groups[groupId].deviceIds.includes(deviceId)) {
      data.groups[groupId].deviceIds.push(deviceId);
    }

    this.saveData(data);
    return true;
  }

  removeDeviceFromGroup(deviceId, groupId) {
    const data = this.getData();

    if (data.devices[deviceId]) {
      data.devices[deviceId].groupIds = data.devices[deviceId].groupIds.filter(
        (id) => id !== groupId
      );
    }

    if (data.groups[groupId]) {
      data.groups[groupId].deviceIds = data.groups[groupId].deviceIds.filter(
        (id) => id !== deviceId
      );
    }

    this.saveData(data);
    return true;
  }

  getDevicesInGroup(groupId) {
    const data = this.getData();
    const group = data.groups[groupId];
    if (!group) return [];
    return group.deviceIds.map((id) => data.devices[id]).filter(Boolean);
  }

  getGroupsForDevice(deviceId) {
    const data = this.getData();
    const device = data.devices[deviceId];
    if (!device) return [];
    return device.groupIds.map((id) => data.groups[id]).filter(Boolean);
  }

  // Utility
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

export default GroupStorageService;
