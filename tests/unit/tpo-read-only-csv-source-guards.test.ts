import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
describe("TPO CSV readiness and missing-season contracts", () => {
  it("protects DB09 offer expiry CSV until verified", () => {
    const source = fs.readFileSync(path.join(process.cwd(),
      "src/app/api/placements/tpo/offers/expiry/route.ts"), "utf8");
    expect(source).toContain('process.env["DB09_TPO_API_READY"] !== "DB09_VERIFIED"');
    expect(source).toContain("status: 503");
  });
  it("rejects CSV requests without a placement season", () => {
    const source = fs.readFileSync(path.join(process.cwd(),
      "src/app/api/placements/reports/placed-branch/route.ts"), "utf8");
    expect(source).toContain("if (!report.season)");
    expect(source).toContain("PLACEMENT_SEASON_NOT_FOUND");
  });
});
