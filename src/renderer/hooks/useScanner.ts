import { useState, useCallback } from "react";
import { useAppContext } from "../context/AppContext";
import type { ScannedDevice } from "@/types/api";

interface UseScannerReturn {
  scannedDevices: ScannedDevice[];
  scanning: boolean;
  error: string | null;
  scanNetwork: () => Promise<ScannedDevice[]>;
  scanDeviceDetails: (ip: string) => Promise<ScannedDevice | null>;
  clearDevices: () => void;
}

export function useScanner(): UseScannerReturn {
  const { currentScannedDevices, setCurrentScannedDevices } = useAppContext();
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scanNetwork = useCallback(async (): Promise<ScannedDevice[]> => {
    setScanning(true);
    setError(null);
    if (!window.api) {
      setError("API not available");
      setScanning(false);
      return [];
    }
    try {
      const response = await window.api.scanNetwork();
      if (response.success && response.devices) {
        setCurrentScannedDevices(response.devices);
        return response.devices;
      }
      setError(response.error || "Failed to scan network");
      return [];
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return [];
    } finally {
      setScanning(false);
    }
  }, [setCurrentScannedDevices]);

  const scanDeviceDetails = useCallback(
    async (ip: string): Promise<ScannedDevice | null> => {
      try {
        const response = await window.api.scanDeviceDetails(ip);
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

  const clearDevices = useCallback(() => {
    setCurrentScannedDevices([]);
    setError(null);
  }, [setCurrentScannedDevices]);

  return {
    scannedDevices: currentScannedDevices,
    scanning,
    error,
    scanNetwork,
    scanDeviceDetails,
    clearDevices,
  };
}
