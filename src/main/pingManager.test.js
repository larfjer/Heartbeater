jest.mock("better-sqlite3");

// Mock electron early so ipcMain import won't error
jest.mock("electron", () => ({
  ipcMain: { handle: jest.fn() },
  app: { getPath: () => "/tmp/heartbeater" },
}));

// Mock sessionLogger so we can verify integration
jest.mock("./sessionLogger.js", () => ({
  logPing: jest.fn(),
}));

// Provide a mock that includes both default and named exports
const mockEventLogger = {
  log: jest.fn(),
  info: jest.fn(),
  warning: jest.fn(),
  error: jest.fn(),
};
const EventCategory = { PING: "ping", DEVICE: "device" };
const EventLevel = { INFO: "info", WARNING: "warning" };
jest.mock("./eventLogger.js", () => ({
  default: mockEventLogger,
  EventCategory,
  EventLevel,
}));

// Mock worker_threads Worker using a global workers array so tests can inspect
// created workers. The mock factory must not reference out-of-scope variables.
global.__WORKERS = global.__WORKERS || [];
jest.mock("worker_threads", () => ({
  Worker: class {
    constructor() {
      this.listeners = {};
      global.__WORKERS.push(this);
    }
    on(event, cb) {
      this.listeners[event] = cb;
    }
    postMessage(_msg) {}
    terminate() {}
    emitMessage(msg) {
      if (this.listeners.message) this.listeners.message(msg);
    }
  },
}));

describe("PingManager", () => {
  beforeEach(() => {
    jest.resetModules();
    global.__WORKERS = [];
  });
  test("startPing registers worker and handles log_attempt", async () => {
    const mainWindow = null;

    // import the module after mocks are in place so ESM syntax is transformed
    // by babel-jest
    const { pingManager } = await import("./pingManager.js");

    // start a ping with logging enabled
    const config = {
      logging: { enabled: true, groupId: "g1", groupName: "G1" },
    };
    pingManager.startPing("dev1", "1.2.3.4", 1000, mainWindow, config);

    expect(global.__WORKERS.length).toBeGreaterThan(0);
    const w = global.__WORKERS[global.__WORKERS.length - 1];

    // simulate worker sending a log_attempt message
    w.emitMessage({ type: "log_attempt", data: { target: "1.2.3.4" } });

    // sessionLogger.logPing should have been called (mocked)
    const sessionLogger = require("./sessionLogger.js");
    expect(sessionLogger.logPing).toHaveBeenCalled();
  });
});
