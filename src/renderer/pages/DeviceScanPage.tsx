import { useState, useEffect } from "react";
import { Card, Button, Loading, Badge, StatusBadge } from "../components/ui";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from "../components/ui";
import { useScanner, useDevices, usePing, useGroups } from "../hooks";
import { useAppContext } from "../context/AppContext";
import { AddToGroupModal } from "../components/modals/AddToGroupModal";
import { AddDeviceManuallyModal } from "../components/modals/AddDeviceManuallyModal";
import type { ScannedDevice, Device } from "@/types/api";

export function DeviceScanPage() {
  const { scannedDevices, scanning, error, scanNetwork, clearDevices } =
    useScanner();
  const { devices: storedDevices } = useDevices();
  const { getGroupsForDevice } = useGroups();
  const { startPing, stopPing, deviceStates } = usePing();
  const { openModal, closeModal, modals, setSelectedDeviceForGroup } =
    useAppContext();

  const [pingingDevices, setPingingDevices] = useState<Set<string>>(new Set());
  const [selectedScannedDevice, setSelectedScannedDevice] =
    useState<ScannedDevice | null>(null);
  const [selectedDeviceForModal, setSelectedDeviceForModal] =
    useState<Device | null>(null);
  const [deviceGroupCounts, setDeviceGroupCounts] = useState<
    Map<string, number>
  >(new Map());

  // Load group counts for stored devices
  useEffect(() => {
    const loadGroupCounts = async () => {
      const counts = new Map<string, number>();
      for (const device of storedDevices) {
        const groups = await getGroupsForDevice(device.id);
        counts.set(device.id, groups.length);
      }
      setDeviceGroupCounts(counts);
    };
    if (storedDevices.length > 0) {
      loadGroupCounts();
    }
  }, [storedDevices, getGroupsForDevice]);

  const handleScan = async () => {
    clearDevices();
    await scanNetwork();
  };

  const handlePingDevice = async (device: ScannedDevice) => {
    const deviceKey = device.mac || device.ip;

    if (pingingDevices.has(deviceKey)) {
      // Stop pinging
      await stopPing(deviceKey);
      setPingingDevices((prev) => {
        const newSet = new Set(prev);
        newSet.delete(deviceKey);
        return newSet;
      });
    } else {
      // Start pinging
      await startPing(deviceKey, device.ip, 1000);
      setPingingDevices((prev) => new Set(prev).add(deviceKey));
    }
  };

  const handleAddToGroup = async (device: ScannedDevice) => {
    console.log("handleAddToGroup called with:", device);

    // Find device in storage by MAC
    let storedDevice: Device | null = null;
    if (device.mac) {
      // Use local find instead of getDeviceByMac since it's not working
      storedDevice = storedDevices.find((d) => d.mac === device.mac) || null;
      console.log("Found stored device:", storedDevice);
    }

    if (storedDevice) {
      console.log("Setting selectedDeviceForModal to:", storedDevice);
      setSelectedDeviceForModal(storedDevice);
      setSelectedDeviceForGroup(storedDevice);
      console.log("Opening addToGroup modal");
      openModal("addToGroup");
    } else {
      console.log("Device not found in storage, opening manual add modal");
      // Device not stored yet, open manual add modal
      setSelectedScannedDevice(device);
      openModal("addDeviceManually");
    }
  };

  const getDevicePingStatus = (device: ScannedDevice) => {
    const deviceKey = device.mac || device.ip;
    return deviceStates.get(deviceKey);
  };

  const isDeviceStored = (device: ScannedDevice): boolean => {
    if (!device.mac) return false;
    return storedDevices.some((d) => d.mac === device.mac);
  };

  return (
    <div id="device-scan">
      <Card
        title="Network Scanner"
        subtitle="Discover all devices connected to your local network"
      >
        <div className="scan-controls">
          <Button
            variant="filled"
            icon="radar"
            onClick={handleScan}
            loading={scanning}
          >
            {scanning ? "Scanning..." : "Scan Network"}
          </Button>

          <Button
            variant="outlined"
            icon="add"
            onClick={() => {
              setSelectedScannedDevice(null);
              openModal("addDeviceManually");
            }}
          >
            Add Manually
          </Button>

          {scannedDevices.length > 0 && (
            <Button variant="text" icon="clear" onClick={clearDevices}>
              Clear Results
            </Button>
          )}
        </div>

        {error && (
          <div className="scan-error">
            <span className="material-icons">error</span>
            <span>{error}</span>
          </div>
        )}

        {scanning && <Loading message="Scanning network for devices..." />}
      </Card>

      {scannedDevices.length > 0 && (
        <Card>
          <div className="scan-results-header">
            <h3>Discovered Devices</h3>
            <Badge variant="subtle">
              {scannedDevices.length} devices found
            </Badge>
          </div>

          <div className="scan-results-table-container">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Device</TableHeaderCell>
                  <TableHeaderCell>IP Address</TableHeaderCell>
                  <TableHeaderCell>MAC Address</TableHeaderCell>
                  <TableHeaderCell>Manufacturer</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>Actions</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {scannedDevices.map((device, index) => {
                  const pingStatus = getDevicePingStatus(device);
                  const deviceKey = device.mac || device.ip;
                  const isPinging = pingingDevices.has(deviceKey);
                  const stored = isDeviceStored(device);

                  return (
                    <TableRow key={device.mac || `${device.ip}-${index}`}>
                      <TableCell>
                        <div className="device-name">
                          <span className="material-icons">computer</span>
                          {device.name || device.hostname || "Unknown Device"}
                          {stored &&
                            (() => {
                              const storedDev = storedDevices.find(
                                (d) => d.mac === device.mac,
                              );
                              const groupCount = storedDev
                                ? deviceGroupCounts.get(storedDev.id) || 0
                                : 0;
                              return groupCount > 0 ? (
                                <Badge variant="info" size="small">
                                  {groupCount}{" "}
                                  {groupCount === 1 ? "group" : "groups"}
                                </Badge>
                              ) : null;
                            })()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code>{device.ip}</code>
                      </TableCell>
                      <TableCell>
                        <code>{device.mac || "N/A"}</code>
                      </TableCell>
                      <TableCell>{device.manufacturer || "Unknown"}</TableCell>
                      <TableCell>
                        {pingStatus?.lastEvent ? (
                          <StatusBadge online={pingStatus.lastEvent.alive} />
                        ) : (
                          <Badge variant="neutral">Not tested</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="device-actions">
                          <Button
                            variant={isPinging ? "tonal" : "outlined"}
                            size="small"
                            icon={isPinging ? "stop" : "network_ping"}
                            onClick={() => handlePingDevice(device)}
                          >
                            {isPinging ? "Stop" : "Ping"}
                          </Button>
                          <Button
                            variant="text"
                            size="small"
                            icon="group_add"
                            onClick={() => handleAddToGroup(device)}
                          >
                            Add to Group
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {!scanning && scannedDevices.length === 0 && (
        <Card>
          <div className="empty-state">
            <span className="material-icons empty-state-icon">radar</span>
            <h3>No Devices Found</h3>
            <p>
              Click "Scan Network" to discover devices on your local network.
            </p>
          </div>
        </Card>
      )}

      {/* Modals */}
      <AddToGroupModal
        open={modals.addToGroup}
        onClose={() => {
          closeModal("addToGroup");
          setSelectedDeviceForModal(null);
        }}
        device={selectedDeviceForModal}
      />

      <AddDeviceManuallyModal
        open={modals.addDeviceManually}
        onClose={() => {
          closeModal("addDeviceManually");
          setSelectedScannedDevice(null);
        }}
        prefillDevice={selectedScannedDevice}
      />
    </div>
  );
}
