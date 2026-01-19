import { useState, useEffect } from "react";
import {
  Card,
  Button,
  Loading,
  Badge,
  StatusBadge,
  LatencyBadge,
} from "../components/ui";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  TableEmpty,
} from "../components/ui";
import { Select, Input } from "../components/ui";
import {
  useGroups,
  usePing,
  useSessionLogging,
  usePingInterval,
} from "../hooks";
import { useAppContext } from "../context/AppContext";
import type { Device, Group, PingAvailabilityEvent } from "@/types/api";

export function GroupConnectivityPage() {
  const { groups, loading: groupsLoading, getDevicesInGroup } = useGroups();
  const { startPing, stopAllPings, deviceStates } = usePing();
  const { startSession, stopSession, isSessionActive } = useSessionLogging();
  const { updatePingEvent } = useAppContext();

  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [pingInterval, setPingInterval] = usePingInterval();
  const [isPinging, setIsPinging] = useState(false);

  // Load devices when group is selected
  useEffect(() => {
    if (selectedGroupId) {
      setDevicesLoading(true);
      const group = groups.find((g) => g.id === selectedGroupId);
      setSelectedGroup(group || null);

      getDevicesInGroup(selectedGroupId).then((deviceList) => {
        setDevices(deviceList);
        setDevicesLoading(false);
      });
    } else {
      setSelectedGroup(null);
      setDevices([]);
    }
  }, [selectedGroupId, groups, getDevicesInGroup]);

  // Subscribe to ping events
  useEffect(() => {
    if (!window.api) return;

    const handleAvailabilityChanged = (event: PingAvailabilityEvent) => {
      updatePingEvent(event);
    };

    window.api.ping.onAvailabilityChanged(handleAvailabilityChanged);
  }, [updatePingEvent]);

  const handleStartPinging = async () => {
    if (!selectedGroupId || !selectedGroup) return;

    setIsPinging(true);

    // Start session logging
    await startSession(selectedGroupId, selectedGroup.name);

    // Start pinging all devices
    for (const device of devices) {
      await startPing(device.id, device.ip, pingInterval);
    }
  };

  const handleStopPinging = async () => {
    if (!selectedGroupId) return;

    // Stop all pings
    await stopAllPings();

    // Stop session logging
    await stopSession(selectedGroupId);

    setIsPinging(false);
  };

  const getDeviceStatus = (deviceId: string) => {
    const state = deviceStates.get(deviceId);
    return state?.lastEvent;
  };

  const groupOptions = groups.map((g) => ({ value: g.id, label: g.name }));

  if (groupsLoading) {
    return (
      <div className="connectivity-container">
        <Loading message="Loading groups..." />
      </div>
    );
  }

  return (
    <div id="connectivity-container">
      <Card
        title="Group Connectivity Monitor"
        subtitle="Monitor network connectivity for device groups"
      >
        <div className="connectivity-controls">
          <Select
            label="Select Group"
            options={groupOptions}
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            placeholder="Choose a group..."
            fullWidth
          />

          <Input
            label="Ping Interval (ms)"
            type="number"
            value={pingInterval}
            onChange={(e) => setPingInterval(Number(e.target.value))}
            min={100}
            max={60000}
            step={100}
          />

          <div className="connectivity-actions">
            {!isPinging ? (
              <Button
                variant="filled"
                icon="play_arrow"
                onClick={handleStartPinging}
                disabled={!selectedGroupId || devices.length === 0}
              >
                Start Monitoring
              </Button>
            ) : (
              <Button
                variant="outlined"
                icon="stop"
                onClick={handleStopPinging}
              >
                Stop Monitoring
              </Button>
            )}
          </div>
        </div>
      </Card>

      {selectedGroup && (
        <Card>
          <div className="connectivity-header">
            <h3>{selectedGroup.name}</h3>
            {isPinging && (
              <Badge variant="success" icon="sensors">
                Monitoring Active
              </Badge>
            )}
            {isSessionActive(selectedGroupId) && (
              <Badge variant="info" icon="save">
                Logging
              </Badge>
            )}
          </div>

          {devicesLoading ? (
            <Loading message="Loading devices..." />
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Device</TableHeaderCell>
                  <TableHeaderCell>IP Address</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>Latency</TableHeaderCell>
                  <TableHeaderCell>Last Check</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {devices.length === 0 ? (
                  <TableEmpty
                    colSpan={5}
                    icon="devices"
                    message="No devices in this group. Add devices from the Device Groups tab."
                  />
                ) : (
                  devices.map((device) => {
                    const status = getDeviceStatus(device.id);
                    return (
                      <TableRow key={device.id}>
                        <TableCell>
                          <div className="device-name">
                            <span className="material-icons">computer</span>
                            {device.friendlyName || device.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <code>{device.ip}</code>
                        </TableCell>
                        <TableCell>
                          {status ? (
                            <StatusBadge online={status.alive} />
                          ) : (
                            <Badge variant="neutral">Unknown</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {status?.time !== undefined ? (
                            <LatencyBadge latency={status.time} />
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {status?.timestamp ? (
                            <span className="text-muted">
                              {new Date(status.timestamp).toLocaleTimeString()}
                            </span>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </Card>
      )}

      {!selectedGroupId && groups.length > 0 && (
        <Card>
          <div className="empty-state">
            <span className="material-icons empty-state-icon">hub</span>
            <h3>Select a Group</h3>
            <p>
              Choose a device group from the dropdown above to start monitoring
              connectivity.
            </p>
          </div>
        </Card>
      )}

      {groups.length === 0 && (
        <Card>
          <div className="empty-state">
            <span className="material-icons empty-state-icon">group_add</span>
            <h3>No Groups Available</h3>
            <p>
              Create a device group in the Device Groups tab to get started.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
