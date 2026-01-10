# Heartbeater

A cross-platform Electron application for continuous network device monitoring with time-series event logging.

## Overview

Heartbeater is a desktop application built with [Electron](https://www.electronjs.org/) that enables continuous monitoring of network devices within organized groups. It tracks device availability in real-time, logs dropout events with precise timestamps, and maintains a persistent time-series database of all connectivity events.

### Core Functionality

- **Network Device Discovery**: Scan local networks to automatically detect connected devices with manufacturer information
- **Device Management**: Add, organize, and manage network devices with custom friendly names
- **Group Organization**: Create logical groups to organize devices by location, purpose, or department
- **Continuous Monitoring**: Run infinitely-long monitoring sessions to track device availability 24/7
- **Event Logging**: Automatically record all device connectivity changes with precise timestamps
- **Time-Series Data**: Persistent storage of all monitoring events for historical analysis
- **Session Management**: Save and reopen monitoring sessions to review historical data

### Key Capabilities

- Manual and automatic device discovery
- Real-time device status tracking
- Persistent local storage (JSON-based)
- Clean, intuitive UI with organized tabs for devices and groups
- Cross-platform support (macOS, Windows, Linux via Electron)

## Refactor & Migration Notes

Recent refactors split responsibilities across small modules to improve testability and avoid import-time side-effects. Key changes you should be aware of:

- Time & logging utilities: `src/main/timeUtils.js` and `src/main/loggingUtils.js` centralize ISO timestamps and message formatting.
- Persistent event logging: `src/main/eventLogger.js` provides an `initialize(app)` API and query methods (ISO8601 timestamps are used throughout).
- Worker orchestration: `src/main/pingWorkerManager.js` manages `Worker` lifecycles; use `pingManager` facade in application code.
- IPC handlers: register via initializer functions (example: `initializePingHandlers(mainWindow)`) instead of registering at import time.
- Modules that touch the filesystem or native resources now expose `initialize(app)` to be called from `main.js` after `app.whenReady()`.

Migration steps

1. Replace ad-hoc Date usage with `nowIso()` for ISO timestamps.
2. Call `initialize(app)` for `eventLogger`, `sessionLogger`, and `storage` during app bootstrap.
3. Run `npm test` — tests mock native modules and expect explicit initialization in `main.js`.

Quick rollback checklist: revert the last commit or restore `main.old.js` / `renderer.old.js` backups; re-enable previous initialization behaviour and re-run tests.

## Technology Stack

- **Framework**: Electron 33.4.11
- **Module System**: ES Modules (ESM)
- **IPC Communication**: Electron IPC for secure main/renderer process communication
- **Storage**: Local JSON file-based storage
- **Code Quality**: ESLint + Prettier for code consistency
- **UI**: Vanilla HTML/CSS/JavaScript

## Project Structure

```
Heartbeater/
├── config/                    # Configuration files
│   ├── eslint.config.js
│   ├── prettier.config.js
│   └── .htmlhintrc
├── docs/                      # Documentation
├── src/
│   ├── main/                  # Main process (Electron)
│   │   ├── window.js
│   │   ├── scanner.js
│   │   ├── ipcScannerHandlers.js
│   │   ├── ipcDeviceHandlers.js
│   │   ├── ipcGroupHandlers.js
│   │   ├── ipcGroupDeviceHandlers.js
│   │   ├── appLifecycle.js
│   │   └── logger.js
│   ├── preload/               # Preload APIs
│   │   ├── scannerApi.js
│   │   ├── deviceStorageApi.js
│   │   ├── groupStorageApi.js
│   │   └── groupDeviceRelationApi.js
│   └── renderer/              # Renderer process (UI)
│       ├── deviceScanUI.js
│       ├── deviceGroupIndicator.js
│       ├── groupsUI.js
│       ├── scanner.js
│       ├── tabs.js
│       ├── addDeviceManuallyModal.js
│       ├── addToGroupModal.js
│       └── domElements.js
├── styles/                    # CSS styling
├── storage.js                 # Storage abstraction layer
├── preload.cjs               # Preload entry point (CommonJS)
├── main.js                    # Application entry point
├── renderer.js                # Renderer initialization
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 16+
- npm

### Installation

```bash
npm install
```

### Development

```bash
# Run the application in development mode
npm start

# Run linting and formatting
npm run lint
npm run lint:fix
npm run format

# Build for production (if configured)
npm run build
```

## Usage

### Scanning for Devices

1. Click the **Scan Network** button to discover devices on your local network
2. Devices are automatically enriched with manufacturer information
3. Add discovered devices to your inventory

### Managing Devices

1. **Add Manually**: Use the "Add Device Manually" modal to manually add devices by IP or MAC address
2. **Rename**: Set friendly names for devices for easier identification
3. **Remove**: Delete devices from your inventory as needed

### Organizing Groups

1. **Create Group**: Create logical groups to organize devices
2. **Add Devices**: Assign devices to groups
3. **Remove Devices**: Remove devices from groups

### Monitoring

The application stores monitoring data in the following files:

- `storage.json` - Device and group information
- `groups.json` - Group membership and relationships
- Event logs - Monitoring session data and connectivity events

## Architecture

### Main Process

The main process handles:

- Window creation and management
- Network scanning via `nmap`
- IPC handlers for all data operations
- Device and group persistence
- Event logging

### Renderer Process

The renderer process handles:

- User interface rendering
- User interactions
- API calls to the main process via IPC
- Real-time UI updates

### Context Bridge (Preload)

The preload script (`preload.cjs`) securely exposes the following APIs:

```javascript
window.api.scanNetwork()           // Scan network for devices
window.api.scanDeviceDetails(ip)   // Get detailed info for a device
window.api.storage.addDevice(...)  // Device operations
window.api.storage.createGroup()   // Group operations
```

## Monitoring & Event Logging

The application maintains a time-series record of all device events:

- **Device Discovery**: Logged when a device is first detected
- **Connectivity Changes**: Logged when a device goes online/offline
- **Group Changes**: Logged when devices are added/removed from groups
- **Manual Operations**: Logged for all user-initiated changes

All events include:

- Timestamp
- Device identifier
- Event type
- Relevant metadata

## Data Persistence

All application data is stored locally in JSON files:

- **storage.json**: Device inventory and metadata
- **groups.json**: Group definitions and device relationships
- **Event logs**: Time-series records of all connectivity events

Sessions can be saved and reopened to analyze historical data.

## Continuous Monitoring

The application supports infinitely-long monitoring sessions:

- Sessions run in the background
- Device status is checked continuously
- All connectivity changes are logged
- Sessions can be paused, resumed, or archived
- Historical data persists across application restarts

## Development Notes

### Module System

The project uses ES Modules (ESM) configured in `package.json`. However, the preload script uses CommonJS (`.cjs` extension) due to Electron preload context requirements.

### Code Quality

- ESLint for static analysis
- Prettier for code formatting
- Pre-commit hooks via husky (can be bypassed with `HUSKY=0`)

## Future Enhancements

- Web dashboard for remote monitoring
- Email/webhook notifications for device dropouts
- Advanced filtering and search capabilities
- Export monitoring data to CSV/charts
- Mobile app companion
- Device status predictions using machine learning

## License

[Add your license here]

## Support

[Add support/contact information here]
