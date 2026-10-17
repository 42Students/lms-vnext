import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const source = readFileSync(
  new URL("../../src/components/placements/learner-placement-jobs.tsx", import.meta.url),
  "utf8",
);

describe("Learner job application confirmations", () => {
  it("requires explicit confirmation for internal placement applications", () => {
    expect(source).toContain('onClick={() => setConfirmation("INTERNAL")}');
    expect(source).toContain('confirmation === "INTERNAL"');
    expect(source).toContain("Confirm & apply");
    expect(source).toContain('void apply("INTERNAL")');
    expect(source).toContain("learnerDriveApplyGate");
  });
  it("never treats opening an external employer link as proof of submission", () => {
    expect(source).toContain('onClick={() => setConfirmation("EXTERNAL")}');
    expect(source).toContain('confirmation === "EXTERNAL"');
    expect(source).toContain("Yes, I submitted externally");
    expect(source).toContain("not an employer receipt or verified submission");
    expect(source).toContain('externalConfirmation: true');
  });
  it("replaces browser prompt with explicit withdrawal request and safe cancellation", () => {
    expect(source).not.toContain("window.prompt(");
    expect(source).toContain('confirmation === "WITHDRAW"');
    expect(source).toContain('requestType:');
    expect(source).toContain('"APPLICATION_WITHDRAWAL"');
    expect(source).toContain("Keep application");
    expect(source).toContain("does not immediately");
    expect(source).toContain("validWithdrawalReason");
  });
  it("matches the backend reason length and guards repeated writes while pending", () => {
    expect(source).toContain("reason.length >= 3 && reason.length <= 900");
    expect(source).toContain("maxLength={900}");
    expect(source).toContain('pendingAction !== null');
    expect(source).toContain('await placementMutation(');
  });
});
