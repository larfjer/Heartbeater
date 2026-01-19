import { useState, useEffect, useCallback } from "react";
import type { Device, DevicesResponse, ApiResponse } from "@/types/api";

interface UseDevicesReturn {
  devices: Device[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addDevice: (device: Omit<Device, "id">) => Promise<string | null>;
  updateFriendlyName: (deviceId: string, name: string) => Promise<boolean>;
  removeDevice: (deviceId: string) => Promise<boolean>;
  getDevice: (deviceId: string) => Promise<Device | null>;
  getDeviceByMac: (mac: string) => Promise<Device | null>;
  getDisplayName: (deviceId: string) => Promise<string | null>;
}

export function useDevices(): UseDevicesReturn {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    if (!window.api) {
      setError("API not available");
      setLoading(false);
      return;
    }
    try {
      const response: DevicesResponse =
        await window.api.storage.getAllDevices();
      if (response.success && response.devices) {
        setDevices(response.devices);
      } else {
        setError(response.error || "Failed to fetch devices");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addDevice = useCallback(
    async (device: Omit<Device, "id">): Promise<string | null> => {
      if (!window.api) {
        console.error("API not available");
        setError("API not available");
        return null;
      }
      try {
        const response: ApiResponse<{ id: string }> =
          await window.api.storage.addDevice(device);
        if (response.success && response.data) {
          await refresh();
          return response.data.id;
        }
        console.error("Failed to add device:", response.error);
        setError(response.error || "Failed to add device");
        return null;
      } catch (err) {
        console.error("Error in addDevice:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        return null;
      }
    },
    [refresh],
  );

  const updateFriendlyName = useCallback(
    async (deviceId: string, name: string): Promise<boolean> => {
      try {
        const response = await window.api.storage.updateDeviceFriendlyName(
          deviceId,
          name,
        );
        if (response.success) {
          await refresh();
          return true;
        }
        setError(response.error || "Failed to update friendly name");
        return false;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        return false;
      }
    },
    [refresh],
  );

  const removeDevice = useCallback(
    async (deviceId: string): Promise<boolean> => {
      try {
        const response = await window.api.storage.removeDevice(deviceId);
        if (response.success) {
          await refresh();
          return true;
        }
        setError(response.error || "Failed to remove device");
        return false;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        return false;
      }
    },
    [refresh],
  );

  const getDevice = useCallback(
    async (deviceId: string): Promise<Device | null> => {
      try {
        const response = await window.api.storage.getDevice(deviceId);
        if (response.success && response.data) {
          return response.data;
        }
        return null;
      } catch {
        return null;
      }
    },
    [],
  );

  const getDeviceByMac = useCallback(
    async (mac: string): Promise<Device | null> => {
      try {
        const response = await window.api.storage.getDeviceByMac(mac);
        if (response.success && response.data) {
          return response.data;
        }
        return null;
      } catch {
        return null;
      }
    },
    [],
  );

  const getDisplayName = useCallback(
    async (deviceId: string): Promise<string | null> => {
      try {
        const response =
          await window.api.storage.getDeviceDisplayName(deviceId);
        if (response.success && response.data) {
          return response.data.displayName;
        }
        return null;
      } catch {
        return null;
      }
    },
    [],
  );

  return {
    devices,
    loading,
    error,
    refresh,
    addDevice,
    updateFriendlyName,
    removeDevice,
    getDevice,
    getDeviceByMac,
    getDisplayName,
  };
}
