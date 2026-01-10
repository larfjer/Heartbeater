// Mock native modules and loggers before importing the module under test
const globalWorkers = (global.__WORKERS = global.__WORKERS || []);

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

jest.mock("./sessionLogger.js", () => ({
  logPing: jest.fn(),
}));

const mockEventLogger = {
  log: jest.fn(),
  info: jest.fn(),
  warning: jest.fn(),
  error: jest.fn(),
};
const EventCategory = { PING: "ping", DEVICE: "device" };
const EventLevel = { INFO: "info", WARNING: "warning" };
jest.mock("./eventLogger.js", () => ({
  __esModule: true,
  default: mockEventLogger,
  EventCategory,
  EventLevel,
}));

jest.mock("./logger.js", () => ({
  log: { info: jest.fn(), debug: jest.fn(), error: jest.fn() },
}));

describe("PingWorkerManager", () => {
  beforeEach(() => {
    jest.resetModules();
    global.__WORKERS = [];
    mockEventLogger.log.mockClear();
    const sessionLogger = require("./sessionLogger.js");
    sessionLogger.logPing.mockClear();
  });

  test("handles status changes and log_attempt messages", async () => {
    const { pingWorkerManager } = await import("./pingWorkerManager.js");

    const mainWindow = {
      isDestroyed: () => false,
      webContents: { send: jest.fn() },
    };
    const config = {
      logging: { enabled: true, groupId: "g1", groupName: "G1" },
    };

    // start ping which creates a worker
    pingWorkerManager.startPing("dev1", "1.2.3.4", 1000, mainWindow, config);
    expect(global.__WORKERS.length).toBeGreaterThan(0);
    const w = global.__WORKERS[global.__WORKERS.length - 1];

    // simulate a status message that changes availability
    w.emitMessage({
      type: "status",
      status: "unavailable",
      timestamp: "2020-01-01T00:00:00.000Z",
      ipAddress: "1.2.3.4",
      responseTime: 120,
      consecutiveFailures: 1,
      consecutiveSuccesses: 0,
      coefficientOfVariation: 0.1,
      totalPings: 5,
      totalFailures: 2,
    });

    // eventLogger.log should have been called for device_unavailable
    expect(mockEventLogger.log).toHaveBeenCalled();

    // simulate a log_attempt message which should call sessionLogger.logPing
    w.emitMessage({ type: "log_attempt", data: { target: "1.2.3.4" } });
    const sessionLogger = require("./sessionLogger.js");
    expect(sessionLogger.logPing).toHaveBeenCalled();
  });
});
