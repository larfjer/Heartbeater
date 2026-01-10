const { toIso8601, nowIso, formatLocal, parseIso } = require("./timeUtils.js");

describe("timeUtils", () => {
  test("nowIso returns ISO8601 string", () => {
    const iso = nowIso();
    expect(typeof iso).toBe("string");
    // Basic ISO pattern
    expect(iso).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/);
  });

  test("toIso8601 formats Date or string", () => {
    const d = new Date("2020-01-02T03:04:05.006Z");
    expect(toIso8601(d)).toBe("2020-01-02T03:04:05.006Z");
    expect(toIso8601("2020-01-02T03:04:05.006Z")).toBe(
      "2020-01-02T03:04:05.006Z",
    );
  });

  test("parseIso returns Date or null", () => {
    const d = parseIso("2020-01-02T03:04:05.006Z");
    expect(d instanceof Date).toBe(true);
    expect(parseIso(null)).toBeNull();
  });

  test("formatLocal returns string", () => {
    expect(typeof formatLocal()).toBe("string");
  });
});
