const { withLogContext, formatMessage } = require("./loggingUtils.js");

describe("loggingUtils", () => {
  test("formatMessage returns message when string and formats object", () => {
    const s = formatMessage("info");
    expect(s).toBe("info");

    const obj = formatMessage({ hello: "world" }, { foo: "bar" });
    expect(obj).toMatch(/hello/);
    expect(obj).toMatch(/foo/);
  });

  test("withLogContext returns logger function that builds payload", () => {
    const ctx = { id: 1 };
    const logger = withLogContext(ctx);
    const out = logger("info", 3);
    expect(out).toHaveProperty("level", "info");
    expect(out).toHaveProperty("payload");
    expect(out.payload).toHaveProperty("id", 1);
    expect(out.payload).toHaveProperty("message", 3);
  });
});
