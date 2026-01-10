import fs from "fs";

jest.mock("better-sqlite3");
jest.mock("electron", () => ({
  app: { getPath: () => "/tmp/heartbeater" },
}));

import Database from "better-sqlite3";
import sessionLogger from "./sessionLogger.js";

describe("SessionLogger", () => {
  let mockDb;

  beforeEach(() => {
    jest.resetModules();

    mockDb = {
      exec: jest.fn(),
      prepare: jest.fn(() => ({
        run: jest.fn(),
        get: jest.fn(),
        all: jest.fn(),
      })),
      close: jest.fn(),
    };

    Database.mockImplementation(() => mockDb);

    // Ensure logs dir behavior is predictable
    jest.spyOn(fs, "existsSync").mockImplementation(() => true);
    jest.spyOn(fs, "mkdirSync").mockImplementation(() => {});

    // Initialize sessionLogger with mocked electron app
    sessionLogger.initialize(require("electron").app);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("startSession creates database and returns filename", () => {
    const filename = sessionLogger.startSession("group1", "MyGroup");
    expect(filename).toMatch(/timeseries_MyGroup_\d{8}-\d{6}\.db/);
    expect(Database).toHaveBeenCalled();
    expect(mockDb.exec).toHaveBeenCalled();
  });

  test("logPing uses prepared statement when session active", () => {
    const insertMock = { run: jest.fn() };
    mockDb.prepare.mockReturnValueOnce(insertMock);

    sessionLogger.startSession("group2", "G2");
    // activeSessions set inside startSession; logPing should find it
    sessionLogger.logPing("group2", {
      timestamp_utc: new Date().toISOString(),
      timestamp_local: new Date().toString(),
      target: "1.2.3.4",
      latency_ms: 123,
      status: "responding",
      jitter_cv: 0.1,
    });

    expect(insertMock.run).toHaveBeenCalled();
  });

  test("stopSession closes and removes session", () => {
    sessionLogger.startSession("group3", "G3");
    sessionLogger.stopSession("group3");
    expect(mockDb.close).toHaveBeenCalled();
  });
});
