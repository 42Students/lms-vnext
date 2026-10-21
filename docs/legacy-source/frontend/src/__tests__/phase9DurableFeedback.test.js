import fs from "fs";
import path from "path";

describe("Phase 9 durable feedback", () => {
  const report = fs.readFileSync(path.join(process.cwd(), "src/pages/tpo/reports/[name].js"), "utf8");

  test("TPO report load failures use one persistent feedback path", () => {
    expect(report).toContain("setError(text);");
    expect(report).not.toContain('key: "tpo-report-load-error"');
    expect(report).toContain('message="This refresh failed. Showing the last successful report."');
  });
});
