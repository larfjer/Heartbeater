import { useState, useEffect, useRef } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  type ChartData,
  type ChartOptions,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { Card, Loading, Select } from "../components/ui";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  TableEmpty,
} from "../components/ui";
import { useGroups, useHistory } from "../hooks";
import type { SessionData, SessionDeviceData } from "@/types/api";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

export function HistoryPage() {
  const { groups, loading: groupsLoading } = useGroups();
  const {
    sessions,
    currentSession,
    loading,
    loadSessions,
    loadSessionData,
    clearCurrentSession,
  } = useHistory();

  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [selectedSessionFilename, setSelectedSessionFilename] =
    useState<string>("");
  const chartRef = useRef<ChartJS<"line">>(null);

  // Load sessions when group changes
  useEffect(() => {
    if (selectedGroupId) {
      const group = groups.find((g) => g.id === selectedGroupId);
      if (group) {
        loadSessions(group.name);
        clearCurrentSession();
        setSelectedSessionFilename("");
      }
    }
  }, [selectedGroupId, groups, loadSessions, clearCurrentSession]);

  // Load session data when session is selected
  useEffect(() => {
    if (selectedSessionFilename) {
      loadSessionData(selectedSessionFilename);
    }
  }, [selectedSessionFilename, loadSessionData]);

  const groupOptions = groups.map((g) => ({ value: g.id, label: g.name }));
  const sessionOptions = sessions.map((s) => ({
    value: s.filename,
    label: `${new Date(s.startTime).toLocaleDateString()} ${new Date(s.startTime).toLocaleTimeString()}`,
  }));

  // Generate chart data from session
  const generateChartData = (session: SessionData): ChartData<"line"> => {
    const colors = [
      "rgb(75, 192, 192)",
      "rgb(255, 99, 132)",
      "rgb(54, 162, 235)",
      "rgb(255, 205, 86)",
      "rgb(153, 102, 255)",
      "rgb(255, 159, 64)",
    ];

    const datasets = session.devices.map(
      (device: SessionDeviceData, index: number) => {
        const color = colors[index % colors.length];
        return {
          label: device.deviceName,
          data: device.pings.map((p) =>
            p.alive && p.time !== undefined ? p.time : null,
          ),
          borderColor: color,
          backgroundColor: color,
          tension: 0.1,
          spanGaps: true,
        };
      },
    );

    // Use timestamps from the first device as labels
    const labels =
      session.devices[0]?.pings.map((p) =>
        new Date(p.timestamp).toLocaleTimeString(),
      ) || [];

    return { labels, datasets };
  };

  const chartOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Latency Over Time (ms)",
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed.y;
            return value !== null
              ? `${context.dataset.label}: ${value.toFixed(1)}ms`
              : "Offline";
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Latency (ms)",
        },
      },
      x: {
        title: {
          display: true,
          text: "Time",
        },
      },
    },
  };

  // Calculate statistics for a device
  const calculateStats = (device: SessionDeviceData) => {
    const validPings = device.pings.filter(
      (p) => p.alive && p.time !== undefined,
    );
    const times = validPings.map((p) => p.time!);

    if (times.length === 0) {
      return {
        avgLatency: 0,
        minLatency: 0,
        maxLatency: 0,
        packetLoss: 100,
        totalPings: device.pings.length,
      };
    }

    const avgLatency = times.reduce((a, b) => a + b, 0) / times.length;
    const minLatency = Math.min(...times);
    const maxLatency = Math.max(...times);
    const packetLoss =
      ((device.pings.length - validPings.length) / device.pings.length) * 100;

    return {
      avgLatency,
      minLatency,
      maxLatency,
      packetLoss,
      totalPings: device.pings.length,
    };
  };

  if (groupsLoading) {
    return (
      <div id="history-container">
        <Loading message="Loading groups..." />
      </div>
    );
  }

  return (
    <div id="history-container">
      <Card
        title="Session History"
        subtitle="View historical connectivity data and statistics"
      >
        <div className="history-controls">
          <Select
            label="Select Group"
            options={groupOptions}
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            placeholder="Choose a group..."
            fullWidth
          />

          <Select
            label="Select Session"
            options={sessionOptions}
            value={selectedSessionFilename}
            onChange={(e) => setSelectedSessionFilename(e.target.value)}
            placeholder="Choose a session..."
            disabled={!selectedGroupId || sessions.length === 0}
            fullWidth
          />
        </div>
      </Card>

      {loading && <Loading message="Loading session data..." />}

      {currentSession && !loading && (
        <>
          <Card>
            <div className="history-header">
              <h3>{currentSession.groupName}</h3>
              <div className="history-meta">
                <span className="material-icons">schedule</span>
                <span>
                  {new Date(currentSession.startTime).toLocaleString()}
                  {currentSession.endTime &&
                    ` - ${new Date(currentSession.endTime).toLocaleString()}`}
                </span>
              </div>
            </div>

            <div className="chart-container" style={{ height: "400px" }}>
              <Line
                ref={chartRef}
                data={generateChartData(currentSession)}
                options={chartOptions}
              />
            </div>
          </Card>

          <Card title="Device Statistics">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Device</TableHeaderCell>
                  <TableHeaderCell>IP Address</TableHeaderCell>
                  <TableHeaderCell>Avg Latency</TableHeaderCell>
                  <TableHeaderCell>Min</TableHeaderCell>
                  <TableHeaderCell>Max</TableHeaderCell>
                  <TableHeaderCell>Packet Loss</TableHeaderCell>
                  <TableHeaderCell>Total Pings</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {currentSession.devices.length === 0 ? (
                  <TableEmpty
                    colSpan={7}
                    message="No device data in this session"
                  />
                ) : (
                  currentSession.devices.map((device) => {
                    const stats = calculateStats(device);
                    return (
                      <TableRow key={device.deviceId}>
                        <TableCell>
                          <div className="device-name">
                            <span className="material-icons">computer</span>
                            {device.deviceName}
                          </div>
                        </TableCell>
                        <TableCell>
                          <code>{device.ip}</code>
                        </TableCell>
                        <TableCell>{stats.avgLatency.toFixed(1)}ms</TableCell>
                        <TableCell>{stats.minLatency.toFixed(1)}ms</TableCell>
                        <TableCell>{stats.maxLatency.toFixed(1)}ms</TableCell>
                        <TableCell>
                          <span
                            className={
                              stats.packetLoss > 10
                                ? "text-error"
                                : stats.packetLoss > 0
                                  ? "text-warning"
                                  : "text-success"
                            }
                          >
                            {stats.packetLoss.toFixed(1)}%
                          </span>
                        </TableCell>
                        <TableCell>{stats.totalPings}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </Card>
        </>
      )}

      {!selectedGroupId && groups.length > 0 && (
        <Card>
          <div className="empty-state">
            <span className="material-icons empty-state-icon">history</span>
            <h3>Select a Group</h3>
            <p>Choose a device group to view its session history.</p>
          </div>
        </Card>
      )}

      {selectedGroupId && sessions.length === 0 && !loading && (
        <Card>
          <div className="empty-state">
            <span className="material-icons empty-state-icon">folder_open</span>
            <h3>No Sessions Found</h3>
            <p>
              This group has no recorded sessions yet. Start monitoring to
              create session data.
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
