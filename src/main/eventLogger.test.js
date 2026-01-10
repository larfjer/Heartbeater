import fs from "fs";

jest.mock("electron", () => ({
  app: { getPath: () => "/tmp/heartbeater" },
}));

// Provide a mock Database at module import time
const mockDb = {
  exec: jest.fn(),
  prepare: jest.fn(() => ({ run: jest.fn(), get: jest.fn(), all: jest.fn() })),
  close: jest.fn(),
};

const mockDatabaseConstructor = jest.fn(() => mockDb);
// We'll use `jest.doMock` inside beforeEach so mocking happens before the
// module is imported and we avoid hoisting/temporal-dead-zone issues.
let Database;
let eventLogger;

describe("EventLogger", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.spyOn(fs, "existsSync").mockImplementation(() => true);
    jest.spyOn(fs, "mkdirSync").mockImplementation(() => {});

    // apply mocks then import modules

    jest.doMock("better-sqlite3", () => mockDatabaseConstructor);

    Database = require("better-sqlite3");

    eventLogger = require("./eventLogger.js").default;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("initialize prepares database and insert statement", () => {
    eventLogger.initialize(require("electron").app);
    expect(Database).toHaveBeenCalled();
    expect(mockDb.exec).toHaveBeenCalled();
  });

  test("log writes event using prepared statement", () => {
    const mockInsert = { run: jest.fn(() => ({ lastInsertRowid: 1 })) };
    mockDb.prepare.mockReturnValueOnce(mockInsert);

    eventLogger.initialize(require("electron").app);
    const id = eventLogger.log({
      level: "info",
      category: "system",
      eventType: "test",
      message: "it works",
    });

    expect(mockInsert.run).toHaveBeenCalled();
    expect(id).toBe(1);
  });
});
