import "../../node_modules/chart.js/dist/chart.umd.js";
const Chart = window.Chart;

let chartInstance = null;

export async function renderHistory() {
  const container = document.getElementById("history-container");

  // Initial Skeleton
  container.innerHTML = `
        <div class="card">
            <div class="connectivity-controls">
                 <div class="connectivity-control-group">
                    <label class="form-label">Group:</label>
                    <select id="historyGroupSelector" class="form-input-auto">
                        <option value="">-- Select Group --</option>
                    </select>
                </div>
                 <div class="connectivity-control-group">
                    <label class="form-label">Session:</label>
                    <select id="historySessionSelector" class="form-input-auto" disabled>
                        <option value="">-- Select Session --</option>
                    </select>
                </div>
                <div class="connectivity-control-buttons">
                    <button id="loadHistoryBtn" class="md-button" disabled>
                        <span class="material-icons">bar_chart</span>
                        Load Chart
                    </button>
                </div>
            </div>
        </div>
        <div class="card history-chart-container">
            <canvas id="historyChart"></canvas>
        </div>
    `;

  const groupSelector = document.getElementById("historyGroupSelector");
  const sessionSelector = document.getElementById("historySessionSelector");
  const loadBtn = document.getElementById("loadHistoryBtn");
  const canvas = document.getElementById("historyChart");

  // Populate Groups
  try {
    const groupsResult = await window.api.storage.getAllGroups();
    if (groupsResult.success) {
      groupsResult.groups.forEach((g) => {
        const opt = document.createElement("option");
        opt.value = g.id;
        opt.textContent = g.name;
        groupSelector.appendChild(opt);
      });
    }
  } catch (e) {
    console.error("Failed to load groups for history", e);
  }

  // Handle Group Change
  groupSelector.addEventListener("change", async (e) => {
    const groupId = e.target.value;
    const groupName = groupSelector.options[groupSelector.selectedIndex].text;
    sessionSelector.innerHTML =
      '<option value="">-- Select Session --</option>';
    sessionSelector.disabled = true;
    loadBtn.disabled = true;

    if (groupId) {
      try {
        const sessionsResult = await window.api.history.getSessions(groupName);
        if (sessionsResult.success && sessionsResult.sessions.length > 0) {
          sessionsResult.sessions.forEach((s) => {
            const opt = document.createElement("option");
            opt.value = s.filename;
            // Format: "YYYY-MM-DD HH:MM:SS" - derived from filename usually
            // Filename: timeseries_GroupName_2026-01-10T10-10-10-000Z.db
            opt.textContent = formatSessionLabel(s.filename);
            sessionSelector.appendChild(opt);
          });
          sessionSelector.disabled = false;
        } else {
          const opt = document.createElement("option");
          opt.textContent = "No sessions found";
          sessionSelector.appendChild(opt);
        }
      } catch (err) {
        console.error("Error loading sessions", err);
      }
    }
  });

  sessionSelector.addEventListener("change", () => {
    loadBtn.disabled = !sessionSelector.value;
  });

  loadBtn.addEventListener("click", async () => {
    const filename = sessionSelector.value;
    if (!filename) return;

    try {
      const result = await window.api.history.getSessionData(filename);
      console.log("Session data result:", result);
      if (result.success) {
        console.log("Raw data:", result.data);
        renderChart(canvas, result.data);
      } else {
        console.error("Failed to load session data", result.error);
      }
    } catch (e) {
      console.error("Error fetching session data", e);
    }
  });
}

function formatSessionLabel(filename) {
  // Try to extract timestamp using regex: matches _YYYY-MM-DDThh-mm-ss-mmmZ.db at the end
  const match = filename.match(
    /_(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z)\.db$/,
  );
  if (match && match[1]) {
    return match[1];
  }

  // Fallback to splitting if regex fails (backward compatibility)
  const parts = filename.split("_");
  if (parts.length >= 3) {
    // This might include parts of the group name if it contained underscores
    return parts.slice(2).join("_").replace(".db", "");
  }
  return filename;
}

function renderChart(canvas, data) {
  // Data: { timestamp_utc, target, latency_ms, status, ... }

  console.log("renderChart called with data:", data);
  console.log("Data length:", data.length);
  console.log("First row:", data[0]);
  if (data.length > 0) {
    console.log("First row keys:", Object.keys(data[0]));
    console.log("First row values:", JSON.stringify(data[0], null, 2));
  }

  // 1. Group all data by target
  const deviceTargets = {};
  data.forEach((row) => {
    if (!deviceTargets[row.target]) {
      deviceTargets[row.target] = [];
    }
    deviceTargets[row.target].push(row);
  });

  console.log("Devices found:", Object.keys(deviceTargets));
  console.log("Full deviceTargets structure:", deviceTargets);

  // 2. For each device, sort by timestamp to establish chronological order
  Object.keys(deviceTargets).forEach((target) => {
    deviceTargets[target].sort(
      (a, b) =>
        new Date(a.timestamp_utc).getTime() -
        new Date(b.timestamp_utc).getTime(),
    );
  });

  // 3. Get all unique sorted timestamps across all devices
  const allTimestamps = new Set();
  data.forEach((row) => {
    allTimestamps.add(row.timestamp_utc);
  });
  const sortedTimestamps = Array.from(allTimestamps).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime(),
  );

  console.log("Total unique timestamps:", sortedTimestamps.length);
  console.log("Sorted timestamps:", sortedTimestamps);

  // Create labels from sorted timestamps
  const shortLabels = sortedTimestamps.map((ts) =>
    new Date(ts).toLocaleTimeString(),
  );

  // 4. Create Datasets
  // For each device, map its data points to the sorted timestamps
  const datasets = Object.keys(deviceTargets).map((target, index) => {
    const deviceData = sortedTimestamps.map((ts) => {
      // Find the data point for this device at this exact timestamp
      const point = deviceTargets[target].find(
        (row) => row.timestamp_utc === ts,
      );
      if (point) {
        console.log(`Device ${target} at ${ts}: latency=${point.latency_ms}ms`);
        return point.latency_ms;
      }
      // Return null if device has no data at this timestamp
      return null;
    });
    console.log(`Dataset for ${target}:`, deviceData);

    const colors = [
      "rgb(255, 99, 132)",
      "rgb(54, 162, 235)",
      "rgb(255, 205, 86)",
      "rgb(75, 192, 192)",
      "rgb(153, 102, 255)",
      "rgb(255, 159, 64)",
    ];

    return {
      label: target,
      data: deviceData,
      borderColor: colors[index % colors.length],
      backgroundColor: colors[index % colors.length],
      tension: 0.1,
      spanGaps: false, // Don't draw lines over failures
    };
  });

  if (chartInstance) {
    chartInstance.destroy();
  }

  chartInstance = new Chart(canvas, {
    type: "line",
    data: {
      labels: shortLabels,
      datasets: datasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
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
      interaction: {
        mode: "index",
        intersect: false,
      },
    },
  });
}
