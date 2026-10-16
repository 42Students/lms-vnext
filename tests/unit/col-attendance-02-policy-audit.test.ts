import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("COL-attendance-02 attendance policy audit", () => {
  const source = readFileSync("src/modules/attendance/policy-service.ts", "utf8");
  it("records an activity event in the same transaction as the policy upsert", () => {
    expect(source).toContain("getDb().transaction");
    expect(source).toContain("ATTENDANCE_POLICY_UPDATED");
    expect(source.indexOf("onConflictDoUpdate")).toBeLessThan(source.indexOf("tx.insert(activityEvents)"));
  });
  it("captures previous and new values", () => {
    expect(source).toContain("fromEligibilityThresholdPercent");
    expect(source).toContain("toCorrectionWindowHours");
  });
});
