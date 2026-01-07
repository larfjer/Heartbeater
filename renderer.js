console.log('[Renderer] Script loaded');

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  const scanBtn = document.getElementById('scanBtn');
  const status = document.getElementById('status');
  const results = document.getElementById('results');
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');
  const groupsContainer = document.getElementById('groups-container');

  console.log('[Renderer] DOM ready, initializing...');

  // Tab switching functionality
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const tabName = tab.dataset.tab;

      // Update active tab
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');

      // Update active content
      tabContents.forEach((content) => content.classList.remove('active'));
      document.getElementById(tabName).classList.add('active');

      console.log('[Renderer] Switched to tab:', tabName);

      if (tabName === 'device-group') {
        renderGroups();
      }
    });
  });

  // Render device groups
  function renderGroups() {
    const groups = JSON.parse(localStorage.getItem('deviceGroups') || '[]');

    if (groups.length === 0) {
      groupsContainer.innerHTML = `
        <div class="group-empty">
          <span class="material-icons">folder_off</span>
          <p>No device groups yet. Create your first group!</p>
        </div>
      `;
      return;
    }

    let html = '<div class="group-grid">';

    groups.forEach((group, _index) => {
      html += `
        <div class="group-card">
          <h3 class="group-card-title">
            <span class="material-icons">folder</span>
            ${group.name}
          </h3>
          <p class="group-card-subtitle">${group.devices.length} device${group.devices.length !== 1 ? 's' : ''}</p>
        </div>
      `;
    });

    html += '</div>';
    groupsContainer.innerHTML = html;
  }

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
                  <th style="width: 40px;"></th>
                  <th>Device Name</th>
                  <th>IP Address</th>
                  <th>MAC Address</th>
                  <th>Manufacturer</th>
                </tr>
              </thead>
              <tbody>
        `;

        devices.forEach((device, index) => {
          html += `
            <tr class="device-row" data-ip="${device.ip}" data-index="${index}">
              <td style="text-align: center;">
                <span class="material-icons expand-icon" style="font-size: 20px; cursor: pointer;">expand_more</span>
              </td>
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
              <td><span class="manufacturer-badge">${device.manufacturer || 'Unknown'}</span></td>
            </tr>
            <tr class="details-row" data-index="${index}">
              <td colspan="5">
                <div class="details-cell">
                  <div class="details-title">Operating System</div>
                  <div class="os-info">Loading...</div>
                  <div class="details-title">Services</div>
                  <div class="services-list">Loading...</div>
                </div>
              </td>
            </tr>
          `;
        });

        html += '</tbody></table></div>';
        results.innerHTML = html;

        // Add event listeners to expand rows
        document.querySelectorAll('.device-row').forEach((row) => {
          row.addEventListener('click', async (_e) => {
            const index = row.dataset.index;
            const detailsRow = document.querySelector(`.details-row[data-index="${index}"]`);
            const icon = row.querySelector('.expand-icon');

            detailsRow.classList.toggle('expanded');
            icon.classList.toggle('expanded');

            if (detailsRow.classList.contains('expanded')) {
              // Scan device details when expanding
              const ip = row.dataset.ip;
              console.log('[Renderer] Scanning details for', ip);
              const detailResponse = await window.api.scanDeviceDetails(ip);

              const osInfo = detailsRow.querySelector('.os-info');
              const servicesList = detailsRow.querySelector('.services-list');

              if (detailResponse.success) {
                osInfo.textContent = detailResponse.os || 'Unknown';

                if (detailResponse.services && detailResponse.services.length > 0) {
                  let servicesHtml = '';
                  detailResponse.services.forEach((service) => {
                    servicesHtml += `
                      <div class="service-item">
                        <span class="service-port">${service.port}/${service.protocol}</span>
                        <span class="service-name">${service.service} ${service.version || ''}</span>
                      </div>
                    `;
                  });
                  servicesList.innerHTML = servicesHtml;
                } else {
                  servicesList.innerHTML =
                    '<p style="color: var(--md-sys-color-on-surface-variant); margin: 0;">No services detected</p>';
                }
              } else {
                osInfo.textContent = 'Error scanning device';
                servicesList.innerHTML = `<p style="color: var(--md-sys-color-on-surface-variant); margin: 0;">${detailResponse.error}</p>`;
              }
            }
          });
        });
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
});
