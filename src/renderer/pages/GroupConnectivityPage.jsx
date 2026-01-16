import React, { useState, useCallback } from "react";
import { useGroups } from "../hooks/useGroups.js";
import { useDevicesInGroup } from "../hooks/useDevices.js";
import { usePingManager, useLoggingSession, useGroupPingSettings } from "../hooks/usePing.js";

export default function GroupConnectivityPage() {
  const { groups, loading: loadingGroups } = useGroups();
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [pingRunning, setPingRunning] = useState({});

  const { devices, loading: loadingDevices } = useDevicesInGroup(selectedGroupId);
  const { startPing, stopPing, getDeviceStatus } = usePingManager();
  const { startSession, stopSession } = useLoggingSession();

  const {
    pingInterval,
    setPingInterval,
    cvThreshold,
    setCvThreshold,
    responseTimeThreshold,
    setResponseTimeThreshold,
    loggingEnabled,
    setLoggingEnabled,
  } = useGroupPingSettings(selectedGroupId);

  const isRunning = pingRunning[selectedGroupId] || false;
  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  const handleTogglePing = useCallback(async () => {
    if (!selectedGroupId || !selectedGroup) return;

    if (isRunning) {
      // Stop logging session
      await stopSession(selectedGroupId);

      // Stop ping for all devices
      for (const device of devices) {
        await stopPing(device.id);
      }

      setPingRunning((prev) => ({ ...prev, [selectedGroupId]: false }));
      console.log("[Renderer] Stopped pinging all devices in group");
    } else {
      // Start logging session if enabled
      if (loggingEnabled) {
        await startSession(selectedGroupId, selectedGroup.name);
      }

      const config = {
        cvThreshold: parseFloat(cvThreshold) || 0.3,
        responseTimeThreshold: parseInt(responseTimeThreshold, 10) || 100,
        logging: {
          enabled: loggingEnabled,
          groupId: selectedGroupId,
        },
      };

      // Start ping for all devices
      const interval = parseInt(pingInterval, 10) || 5000;
      for (const device of devices) {
        await startPing(device.id, device.ip, interval, config);
      }

      setPingRunning((prev) => ({ ...prev, [selectedGroupId]: true }));
      console.log("[Renderer] Started pinging all devices in group");
    }
  }, [
    selectedGroupId,
    selectedGroup,
    isRunning,
    devices,
    loggingEnabled,
    pingInterval,
    cvThreshold,
    responseTimeThreshold,
    startPing,
    stopPing,
    startSession,
    stopSession,
  ]);

  if (loadingGroups) {
    return (
      <div id="connectivity-container">
        <Card>
          <Card.Content>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "16px",
              }}
            >
              <Progress.Circular size={32} />
            </div>
          </Card.Content>
        </Card>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div id="connectivity-container">
        <Card>
          <Card.Content>
            <div style={{ textAlign: "center", padding: "32px" }}>
              <Icon data={link_off} size={48} color="var(--app-text-secondary)" />
              <Typography variant="body_short" style={{ marginTop: "16px" }}>
                No groups found. Create a group first in Device Groups tab.
              </Typography>
            </div>
          </Card.Content>
        </Card>
      </div>
    );
  }

  return (
    <div id="connectivity-container">
      <Card style={{ marginBottom: "16px" }}>
        <Card.Content>
          <div className="connectivity-controls">
            <div className="connectivity-control-group">
              <NativeSelect
                id="groupSelector"
                label="Group"
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
              >
                <option value="">-- Select a group --</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </NativeSelect>
            </div>

            <div className="connectivity-control-group">
              <TextField
                id="pingIntervalInput"
                label="Ping Interval (ms)"
                type="number"
                placeholder="5000"
                disabled={!selectedGroupId}
                value={pingInterval}
                onChange={(e) => setPingInterval(e.target.value)}
                min={100}
                max={60000}
              />
            </div>

            <div className="connectivity-control-group">
              <TextField
                id="cvThresholdInput"
                label="CV Threshold"
                type="number"
                placeholder="0.3"
                disabled={!selectedGroupId}
                value={cvThreshold}
                onChange={(e) => setCvThreshold(e.target.value)}
                min={0.1}
                max={1}
                step={0.05}
              />
            </div>

            <div className="connectivity-control-group">
              <TextField
                id="responseTimeThresholdInput"
                label="Response Time (ms)"
                type="number"
                placeholder="100"
                disabled={!selectedGroupId}
                value={responseTimeThreshold}
                onChange={(e) => setResponseTimeThreshold(e.target.value)}
                min={1}
                max={1000}
              />
            </div>

            <div
              className="connectivity-control-buttons"
              style={{
                alignSelf: "flex-end",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <Button
                disabled={!selectedGroupId}
                onClick={handleTogglePing}
                color={isRunning ? "danger" : "primary"}
              >
                <Icon data={isRunning ? stop : play} />
                {isRunning ? "Stop All Ping" : "Start All Ping"}
              </Button>
              <Checkbox
                label="Enable Logging"
                disabled={!selectedGroupId}
                checked={loggingEnabled}
                onChange={(e) => setLoggingEnabled(e.target.checked)}
              />
            </div>
          </div>
        </Card.Content>
      </Card>

      <Card>
        <Card.Content>
          <DevicesTable
            devices={devices}
            loading={loadingDevices}
            getDeviceStatus={getDeviceStatus}
          />
        </Card.Content>
      </Card>
    </div>
  );
}

function DevicesTable({ devices, loading, getDeviceStatus }) {
  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "16px" }}>
        <Progress.Circular size={32} />
      </div>
    );
  }

  if (devices.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "32px" }}>
        <Icon data={link_off} size={48} color="var(--app-text-secondary)" />
        <Typography variant="body_short" style={{ marginTop: "16px" }}>
          No devices in this group
        </Typography>
      </div>
    );
  }

  return (
    <table className="md-table">
      <thead>
        <tr>
          <th>Friendly Name</th>
          <th>IP Address</th>
          <th>MAC Address</th>
          <th>Response Time</th>
          <th>Jitter</th>
          <th className="connectivity-status-column">Status</th>
        </tr>
      </thead>
      <tbody>
        {devices.map((device) => (
          <DeviceRow key={device.id} device={device} status={getDeviceStatus(device.id)} />
        ))}
      </tbody>
    </table>
  );
}

function DeviceRow({ device, status }) {
  const displayName = device.friendlyName || device.name || "(Unknown)";

  const getStatusDisplay = () => {
    switch (status.status) {
      case "available":
      case "responding":
        return { text: "Connected", variant: "active" };
      case "poor-connection":
        return { text: "Poor Connection", variant: "warning" };
      case "unavailable":
      case "unresponsive":
        return { text: "Disconnected", variant: "error" };
      default:
        return { text: "Not Running", variant: "default" };
    }
  };

  const { text: statusText, variant } = getStatusDisplay();
  const responseTimeDisplay = status.responseTime != null ? `${status.responseTime}ms` : "—";
  const jitterDisplay =
    status.coefficientOfVariation != null ? status.coefficientOfVariation.toFixed(3) : "NA";

  return (
    <tr className="connectivity-row" data-device-id={device.id}>
      <td>
        <span className="device-friendly-name">{displayName}</span>
      </td>
      <td>
        <span className="device-ip">{device.ip}</span>
      </td>
      <td>
        <span className="device-mac">{device.mac}</span>
      </td>
      <td>
        <span className="device-response-time">{responseTimeDisplay}</span>
      </td>
      <td>
        <span className="device-jitter">{jitterDisplay}</span>
      </td>
      <td className="connectivity-status-cell">
        <Chip variant={variant}>{statusText}</Chip>
      </td>
    </tr>
  );
}
