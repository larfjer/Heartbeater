# Heartbeater Application Refactoring Summary

## Overview

Complete modularization of the Heartbeater Electron application following the Single Responsibility Principle and separation of concerns. Both main and renderer processes have been refactored into modular, maintainable components.

## File Size Reductions

### Main Process

- **Original**: `main.js` (323 lines) → **New**: `main.js` (38 lines) + 7 service modules
- **Reduction**: 88% smaller entry point with clearer responsibilities

### Renderer Process

- **Original**: `renderer.js` (998 lines) → **New**: `renderer.js` (33 lines) + 8 UI modules
- **Reduction**: 97% smaller entry point with isolated UI logic

## Architecture

### Entry Points (Minimal Bootstrap)

- **main.js** (38 lines): App initialization, storage setup, IPC handler registration
- **renderer.js** (33 lines): DOM ready listener, module imports, UI initialization

### Main Process Modules (`src/main/`)

| File                        | Purpose                                 | Key Exports                                                                                          |
| --------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `logger.js`                 | Centralized logging with timestamps     | `log` object (info, error, debug methods)                                                            |
| `window.js`                 | Electron window creation and management | `createWindow()`                                                                                     |
| `scanner.js`                | Network device scanning and enrichment  | `scanNetwork()`, `enrichDeviceWithManufacturer()`, `scanDeviceDetails()`                             |
| `ipcScannerHandlers.js`     | IPC handlers for scan operations        | Registers 2 handlers: `scan-network`, `scan-device-details`                                          |
| `ipcDeviceHandlers.js`      | Device CRUD operations via IPC          | Registers 8 handlers: add, update, get, getByMac, getAll, getDisplayName, remove                     |
| `ipcGroupHandlers.js`       | Group CRUD operations via IPC           | Registers 5 handlers: create, update, get, getAll, delete                                            |
| `ipcGroupDeviceHandlers.js` | Group-device relationship IPC handlers  | Registers 4 handlers: addDeviceToGroup, removeDeviceFromGroup, getDevicesInGroup, getGroupsForDevice |
| `appLifecycle.js`           | App lifecycle event handlers            | `registerAppLifecycleHandlers()`, `initializeApp(storage)`                                           |

### Renderer Process Modules (`src/renderer/`)

| File                        | Purpose                                  | Lines | Key Exports                                                                          |
| --------------------------- | ---------------------------------------- | ----- | ------------------------------------------------------------------------------------ |
| `domElements.js`            | Centralized DOM references and app state | ~40   | `domElements` object, `appState` object                                              |
| `tabs.js`                   | Tab switching and navigation logic       | ~25   | `initializeTabs()`                                                                   |
| `scanner.js`                | Scan button initialization               | ~30   | `initializeScanButton()`                                                             |
| `deviceScanUI.js`           | Device scan results rendering            | ~250  | `renderDeviceScan(devices)` async                                                    |
| `deviceGroupIndicator.js`   | Group count badge updates                | ~70   | `updateDeviceGroupIndicator(deviceId, device)` async                                 |
| `addToGroupModal.js`        | Group selection modal                    | ~160  | `openAddToGroupModal()`, `initializeAddToGroupModal()`, `initializeCreateNewGroup()` |
| `groupsUI.js`               | Device groups table rendering            | ~200  | `renderGroups()` async                                                               |
| `addDeviceManuallyModal.js` | Manual device addition form              | ~130  | `initializeAddDeviceManually()`                                                      |

**Total New Code**: ~1,000 lines split across 8 modular, single-responsibility files

## Core Services (Unchanged)

- **storage.js** (230 lines): `GroupStorageService` class providing persistent data management
- **preload.js**: IPC context bridge unchanged
- **index.html**: UI markup unchanged

## Module Dependencies

### Main Process Chain

```
main.js (bootstrap)
├── appLifecycle.js (app events)
│   └── window.js (window creation)
├── ipcScannerHandlers.js
│   └── scanner.js (network scanning)
├── ipcDeviceHandlers.js
│   └── storage.js (device operations)
├── ipcGroupHandlers.js
│   └── storage.js (group operations)
├── ipcGroupDeviceHandlers.js
│   └── storage.js (relationships)
└── logger.js (logging utility)
```

### Renderer Process Chain

```
renderer.js (bootstrap)
├── tabs.js (tab switching)
├── scanner.js (scan button)
│   └── deviceScanUI.js (render results)
│       └── deviceGroupIndicator.js (badges)
│       └── addToGroupModal.js (group selection)
├── addToGroupModal.js (group creation)
├── addDeviceManuallyModal.js (manual form)
│   └── groupsUI.js (render groups)
└── domElements.js (DOM refs & state)
```

## Key Features Preserved

✅ Network device scanning with manufacturer detection
✅ Device storage with friendly names
✅ Group creation and management
✅ Add devices to multiple groups
✅ Manual device addition with validation
✅ Device removal from groups
✅ Persistent storage (JSON-based)
✅ IPC communication between processes
✅ Error handling and user feedback
✅ Material Design UI

## Improvements

### Code Organization

- **Single Responsibility**: Each file has one clear purpose
- **Easier Testing**: Individual modules can be tested in isolation
- **Better Debugging**: Errors trace to specific modules
- **Clearer Dependencies**: Module relationships are explicit

### Maintainability

- **Main Process**: 323 → 38 lines (clear app lifecycle)
- **Renderer Process**: 998 → 33 lines (clean UI initialization)
- **Feature Isolation**: Each feature lives in its own module
- **Reduced Cognitive Load**: Smaller files are easier to understand

### Consistency

- Both entry points follow identical patterns
- All modules use ES6 import/export
- Consistent error handling and logging
- Clear module initialization functions

## File Structure

```
Heartbeater/
├── main.js                        (38 lines - entry point)
├── renderer.js                    (33 lines - entry point)
├── preload.js                     (IPC bridge)
├── storage.js                     (230 lines - core service)
├── index.html                     (UI markup)
├── package.json
│
└── src/
    ├── main/                      (7 service modules)
    │   ├── logger.js
    │   ├── window.js
    │   ├── scanner.js
    │   ├── ipcScannerHandlers.js
    │   ├── ipcDeviceHandlers.js
    │   ├── ipcGroupHandlers.js
    │   ├── ipcGroupDeviceHandlers.js
    │   └── appLifecycle.js
    │
    └── renderer/                  (8 UI modules)
        ├── domElements.js
        ├── tabs.js
        ├── scanner.js
        ├── deviceScanUI.js
        ├── deviceGroupIndicator.js
        ├── addToGroupModal.js
        ├── groupsUI.js
        └── addDeviceManuallyModal.js
```

## Testing Checklist

- [x] App starts without errors
- [x] All modules import correctly
- [x] IPC handlers registered
- [ ] Network scan functionality
- [ ] Device storage operations
- [ ] Group creation and management
- [ ] Add device to group modal
- [ ] Remove device from group
- [ ] Manual device addition
- [ ] Friendly name editing
- [ ] Badge updates on group changes
- [ ] Tab switching
- [ ] Group expansion/collapse

## Future Improvements

1. **Unit Tests**: Add Jest/Vitest tests for individual modules
2. **Integration Tests**: Test module interactions via IPC
3. **Error Boundaries**: Add React-style error handling
4. **State Management**: Consider state store for complex renderer state
5. **Documentation**: Add JSDoc comments to exports
6. **Configuration**: Externalize constants to config file
7. **Logging Levels**: Add configurable log levels per module
8. **Performance**: Add timing metrics to key operations

## Migration Notes

### For Developers

- Modifications to feature X should be in `src/main/featureX.js` or `src/renderer/featureX.js`
- New IPC handlers go in `src/main/ipcXyzHandlers.js`
- New UI components go in individual files in `src/renderer/`
- Always add modules to the appropriate entry point bootstrap

### For Reviewers

- Entry points should remain minimal (~30-40 lines)
- Each module should be ≤300 lines (break up larger modules)
- All exports must be explicitly defined
- Module dependencies should be clear from imports

## Backup

The original monolithic files are preserved:

- `renderer.old.js` - Original 998-line renderer.js
- `main.old.js` (if created) - Original main.js

These can be referenced for comparison or reverted if issues arise.

## Recent Changes (2026-01-10)

- Centralized time utilities: `src/main/timeUtils.js` (`nowIso`, `toIso8601`, `formatLocal`, `parseIso`).
- Centralized logging helpers: `src/main/loggingUtils.js` (`withLogContext`, `formatMessage`) and `src/main/logger.js` updated to use them.
- Introduced a persistent `eventLogger` module: `src/main/eventLogger.js` (ISO8601 timestamps, query APIs, explicit `initialize(app)` to avoid import-time side-effects).
- Split ping orchestration: `src/main/pingWorkerManager.js` (worker orchestration) and `src/main/pingWorker.js` (worker code). `src/main/pingManager.js` is a lightweight facade.
- Moved IPC registration into dedicated modules (`src/main/ipcPingHandlers.js`, `ipcScannerHandlers.js`, etc.) and exposed them via explicit initializer functions.
- `sessionLogger` and `storage` now require explicit `initialize(app)` to avoid opening files at import time and to make testing deterministic.
- Tests: Jest + `babel-jest` configured for ESM; added unit tests for time/logging utilities and worker/IPC modules. Native resources (workers, better-sqlite3) are mocked at test-top-level.

These changes centralize time and logging behavior, remove import-time side effects, and improve modular testability.

## New Module Boundaries & Public APIs

- `src/main/timeUtils.js`
  - Exports: `nowIso()`, `toIso8601()`, `formatLocal()`, `parseIso()`

- `src/main/loggingUtils.js`
  - Exports: `withLogContext(context) -> loggerFn`, `formatMessage(message, meta)`

- `src/main/logger.js`
  - Exports: `log` object with `info()`, `error()`, `debug()` — uses `nowIso()` and `formatMessage()` internally

- `src/main/eventLogger.js`
  - Exports: default `eventLogger` singleton and named `EventLogger` class, plus enums `EventCategory`, `EventLevel`
  - API highlights: `initialize(app)`, `log(event) -> id`, `info()`, `warning()`, `error()`, `queryByTimeInterval(startIso, endIso)`, `pruneEvents()`

- `src/main/sessionLogger.js`
  - Exports: default `sessionLogger` with `initialize(app)`, `startSession(groupId, groupName)`, `logPing(groupId, pingData)`, `stopSession()`

- `src/main/pingWorkerManager.js`
  - Exports: `pingWorkerManager` and `PingWorkerManager` class
  - Key methods: `startPing(deviceId, ip, intervalMs, mainWindow, config)`, `stopPing(deviceId)`, `stopAllPings()`, `getAvailabilityStatus()`, `getDetailedStatus()`

- `src/main/ipcPingHandlers.js`
  - Exports: `initializePingHandlers(mainWindow)` and default export
  - Registers `ipcMain.handle(...)` for ping control and queries; uses `pingManager` and `eventLogger` internally

## Migration Steps (how to adopt)

1. Replace any direct `new Date().toISOString()` usages with `nowIso()` from `src/main/timeUtils.js` when an ISO timestamp is intended.
2. When importing `eventLogger`, `sessionLogger`, or `storage` in `main.js`, call their `initialize(app)` method after `app` is available (e.g. in `app.whenReady()` or equivalent) — do not rely on import-time initialization.
3. If you add IPC handlers, follow the pattern in `src/main/ipcPingHandlers.js`: provide an `initializeXHandlers(mainWindow)` function and call it from the bootstrap after window creation.
4. For worker-based functionality, use `pingWorkerManager`'s APIs rather than spawning `Worker` directly from other modules; this centralizes lifecycle and error handling.
5. Update tests to mock `worker_threads` and `better-sqlite3` at the top of the test file before importing modules that use those natives.

## Rollback Checklist (quick revert steps)

If the refactor causes regressions, follow this rollback checklist:

1. Revert to the previous commit (or use the saved `main.old.js` / `renderer.old.js` backups if present).
   - Git: `git checkout -- <file>` or `git reset --hard <commit>`
2. Restore import-time behavior temporarily by removing calls to `initialize(app)` and replacing `initialize` calls with the previous instantiation pattern (search for `initialize(` in `main.js`).
3. Re-enable any worker spawning that was centralized (revert to previous worker creation locations).
4. Re-run the test suite: `npm test` and fix failing tests incrementally.
5. If database schema or event table changes were introduced, restore the backed-up DB files from `docs/` if available or from the original install location.

Keep this checklist with the release notes for a quick emergency rollback.

## Notes for Reviewers

- Look for explicit `initialize(app)` calls during app bootstrap; these are intentional to avoid import-time side-effects.
- Verify new unit tests mock native modules at top-level.
- Prefer the new `eventLogger` APIs for persistent events and the `sessionLogger` for timeseries session data.
