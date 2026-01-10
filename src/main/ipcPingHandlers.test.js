// Mock electron ipcMain and capture handlers
const handlers = {};
jest.mock("electron", () => ({
  ipcMain: {
    handle: (name, fn) => {
      handlers[name] = fn;
    },
    __handlers: handlers,
  },
  app: { getPath: () => "/tmp/heartbeater" },
}));

// Mock pingManager
const mockPingManager = {
  startPing: jest.fn(),
  stopPing: jest.fn(),
  stopAllPings: jest.fn(),
  getAvailabilityStatus: jest.fn().mockReturnValue(true),
  getActivePingCount: jest.fn().mockReturnValue(2),
  getActivePings: jest.fn().mockReturnValue([{ deviceId: "d1" }]),
  getDetailedStatus: jest.fn().mockReturnValue({}),
  getStatusMetrics: jest.fn().mockReturnValue({}),
  activeWorkers: new Map(),
};
jest.mock("./pingManager.js", () => ({ pingManager: mockPingManager }));

// Mock eventLogger
const mockEventLogger = { info: jest.fn() };
const EventCategory = { PING: "ping" };
jest.mock("./eventLogger.js", () => ({
  __esModule: true,
  default: mockEventLogger,
  EventCategory,
}));

describe("ipcPingHandlers", () => {
  beforeEach(() => {
    jest.resetModules();
    for (const k of Object.keys(handlers)) delete handlers[k];
    mockEventLogger.info.mockClear();
    mockPingManager.startPing.mockClear();
    mockPingManager.stopPing.mockClear();
    mockPingManager.stopAllPings.mockClear();
  });

  test("registers handlers and start/stop behave correctly", async () => {
    const mainWindow = { isDestroyed: () => false };

    const mod = await import("./ipcPingHandlers.js");
    // initialize handlers
    mod.initializePingHandlers(mainWindow);

    const startHandler = handlers["ping:start"];
    expect(typeof startHandler).toBe("function");

    const resStart = startHandler(null, "dev1", "1.2.3.4", 1000, {
      logging: {},
    });
    expect(resStart).toEqual({ success: true });
    expect(mockPingManager.startPing).toHaveBeenCalled();
    expect(mockEventLogger.info).toHaveBeenCalled();

    // register should have ping:stop
    const stopHandler = handlers["ping:stop"];
    expect(typeof stopHandler).toBe("function");
    const resStop = stopHandler(null, "dev1");
    expect(resStop).toEqual({ success: true });
    expect(mockPingManager.stopPing).toHaveBeenCalled();
  });
});
