import { describe, expect, it } from "vitest";
import {
  parseLearnerSurfaceLedger,
} from "../../scripts/learner-surface-status";

describe("learner surface parity ledger", () => {
  it("counts only operational L rows and reports the first unresolved row", () => {
    const report = parseLearnerSurfaceLedger(`
| ID | UI surface | Legacy | vNext | Status |
| --- | --- | --- | --- | --- |
| L0-001 | Sidebar | old | new | CLOSED |
| L0-002 | Mobile | old | new | FIXED |
| L0-003 | Retired redirect | old | n/a | RETIRED |
`);

    expect(report.total).toBe(3);
    expect(report.resolved).toBe(2);
    expect(report.unresolved).toBe(1);
    expect(report.counts.CLOSED).toBe(1);
    expect(report.counts.FIXED).toBe(1);
    expect(report.next).toEqual({
      id: "L0-002",
      surface: "Mobile",
      status: "FIXED",
    });
  });
});
