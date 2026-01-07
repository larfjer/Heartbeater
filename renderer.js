const scanBtn = document.getElementById('scanBtn');
const status = document.getElementById('status');
const results = document.getElementById('results');

console.log('[Renderer] Script loaded');

scanBtn.addEventListener('click', async () => {
  console.log('[Renderer] Scan button clicked');
  scanBtn.disabled = true;
  scanBtn.innerHTML = '<span class="material-icons">hourglass_top</span> Scanning...';
  status.innerHTML = '<div class="spinner"></div> Scanning network for devices...';
  results.innerHTML = '';

  try {
    console.log('[Renderer] Calling scanNetwork API');
    const response = await window.api.scanNetwork();
    console.log('[Renderer] Got response:', response);

    scanBtn.disabled = false;
    scanBtn.innerHTML = '<span class="material-icons">radar</span> Scan Network';
    status.innerHTML = '';

    if (response.success) {
      const devices = response.devices;

      if (devices.length === 0) {
        results.innerHTML = `
          <div class="results-card">
            <div class="empty-state">
              <span class="material-icons">devices_off</span>
              <p>No devices found on the network</p>
            </div>
          </div>
        `;
        return;
      }

      let html = `
        <div class="results-card">
          <div class="results-header">
            <span class="device-count">
              <span class="material-icons">devices</span>
              ${devices.length} device${devices.length !== 1 ? 's' : ''} found
            </span>
          </div>
          <table class="md-table">
            <thead>
              <tr>
                <th>Device Name</th>
                <th>IP Address</th>
                <th>MAC Address</th>
              </tr>
            </thead>
            <tbody>
      `;

      devices.forEach((device) => {
        html += `
          <tr>
            <td>
              <div class="device-name">
                <div class="device-icon">
                  <span class="material-icons">devices</span>
                </div>
                <span class="device-name-text">${device.name || '(Unknown)'}</span>
              </div>
            </td>
            <td><span class="ip-address">${device.ip}</span></td>
            <td><span class="mac-address">${device.mac}</span></td>
          </tr>
        `;
      });

      html += '</tbody></table></div>';
      results.innerHTML = html;
    } else {
      status.innerHTML = `<span class="material-icons" style="color: var(--md-sys-color-error)">error</span> Error: ${response.error}`;
    }
  } catch (error) {
    console.error('[Renderer] Error:', error);
    scanBtn.disabled = false;
    scanBtn.innerHTML = '<span class="material-icons">radar</span> Scan Network';
    status.innerHTML = `<span class="material-icons" style="color: var(--md-sys-color-error)">error</span> Error: ${error.message}`;
  }
});
