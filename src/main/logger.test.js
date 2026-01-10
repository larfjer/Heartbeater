import { log } from "./logger.js";

describe("logger", () => {
  let consoleSpy;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  test("should log messages correctly", () => {
    log.info("Hello, World!");
    expect(consoleSpy).toHaveBeenCalled();
    const calledWith = consoleSpy.mock.calls[0][0];
    expect(calledWith).toContain("Hello, World!");
  });
});
