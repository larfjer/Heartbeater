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
        <div class="card history-legend-container">
            <div id="historyLegendPills" class="legend-pills"></div>
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
            opt.textContent = formatSessionLabel(
              s.timestamp,
              s.durationSeconds,
            );
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
        await renderChart(canvas, result.data);
      } else {
        console.error("Failed to load session data", result.error);
      }
    } catch (e) {
      console.error("Error fetching session data", e);
    }
  });
}

function formatSessionLabel(timestamp, durationSeconds) {
  // Parse timestamp format: YYYYMMDD-HHmmss
  let dateStr = "Unknown";
  try {
    // Parse YYYYMMDD-HHmmss format
    const year = timestamp.slice(0, 4);
    const month = timestamp.slice(4, 6);
    const day = timestamp.slice(6, 8);
    const hour = timestamp.slice(9, 11);
    const minute = timestamp.slice(11, 13);
    const second = timestamp.slice(13, 15);

    const date = new Date(
      `${year}-${month}-${day}T${hour}:${minute}:${second}Z`,
    );

    // Format as dd.mm.yyyy hh:mm (local time)
    const localDay = date.getDate().toString().padStart(2, "0");
    const localMonth = (date.getMonth() + 1).toString().padStart(2, "0");
    const localYear = date.getFullYear();
    const localHour = date.getHours().toString().padStart(2, "0");
    const localMinute = date.getMinutes().toString().padStart(2, "0");

    dateStr = `${localDay}.${localMonth}.${localYear} ${localHour}:${localMinute}`;
  } catch (e) {
    console.error("Error parsing timestamp:", e);
    dateStr = timestamp;
  }

  // Format duration as hh:mm:ss
  let durationStr = "00:00:00";
  if (durationSeconds && durationSeconds > 0) {
    const hours = Math.floor(durationSeconds / 3600);
    const minutes = Math.floor((durationSeconds % 3600) / 60);
    const seconds = durationSeconds % 60;
    durationStr = [
      hours.toString().padStart(2, "0"),
      minutes.toString().padStart(2, "0"),
      seconds.toString().padStart(2, "0"),
    ].join(":");
  }

  return `${dateStr} - ${durationStr}`;
}

async function renderChart(canvas, data) {
  // Data: { timestamp_utc, target, latency_ms, status, ... }

  // Build a mapping from IP address to friendly name
  const ipToName = {};
  try {
    const devicesResult = await window.api.storage.getAllDevices();
    if (
      devicesResult &&
      devicesResult.success &&
      Array.isArray(devicesResult.devices)
    ) {
      devicesResult.devices.forEach((device) => {
        if (device.ip) {
          // Use friendlyName if available, otherwise fall back to name, then IP
          ipToName[device.ip] = device.friendlyName || device.name || device.ip;
        }
      });
    }
  } catch (e) {
    console.error("Failed to fetch device names:", e);
  }

  // Helper function to get display name for a target IP
  const getDisplayName = (ip) => ipToName[ip] || ip;

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
        return point.latency_ms;
      }
      // Return null if device has no data at this timestamp
      return null;
    });

    const colors = [
      "rgb(255, 99, 132)",
      "rgb(54, 162, 235)",
      "rgb(255, 205, 86)",
      "rgb(75, 192, 192)",
      "rgb(153, 102, 255)",
      "rgb(255, 159, 64)",
    ];

    return {
      label: getDisplayName(target),
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
      plugins: {
        legend: {
          display: false,
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
      interaction: {
        mode: "index",
        intersect: false,
      },
    },
  });

  // Render custom legend pills
  renderLegendPills(chartInstance);
}

function renderLegendPills(chart) {
  const container = document.getElementById("historyLegendPills");
  container.innerHTML = "";

  chart.data.datasets.forEach((dataset, index) => {
    const pill = document.createElement("button");
    pill.className = "legend-pill active";
    pill.dataset.index = index;

    const colorDot = document.createElement("span");
    colorDot.className = "legend-pill-dot";
    colorDot.style.backgroundColor = dataset.borderColor;

    const label = document.createElement("span");
    label.className = "legend-pill-label";
    label.textContent = dataset.label;

    pill.appendChild(colorDot);
    pill.appendChild(label);

    pill.addEventListener("click", () => {
      const isVisible = chart.isDatasetVisible(index);
      chart.setDatasetVisibility(index, !isVisible);
      pill.classList.toggle("active", !isVisible);
      chart.update();
    });

    container.appendChild(pill);
  });
}
