import {
  describe,
  expect,
  it,
} from "vitest";
import {
  parseParityMatrix,
} from "../../scripts/parity-status";

describe("parity status parser", () => {
  it("counts only matrix rows with a terminal parity status", () => {
    const report = parseParityMatrix(`
# Example

| Surface | Legacy | Status |
| --- | --- | --- |
| Courses | /courses | DONE |
| Calendar | /calendar | MISSING |
| Old redirect | /old | RETIRED |
| Login | /login | BLOCKED |
| Profile | /profile | PARTIAL |
| Decision | /x | VERIFY |

DONE is also mentioned in prose and must not count.
`);

    expect(report).toMatchObject({
      total: 6,
      resolved: 2,
      unresolved: 4,
      percentResolved: 33.33,
      counts: {
        DONE: 1,
        PARTIAL: 1,
        MISSING: 1,
        VERIFY: 1,
        REDESIGNED: 0,
        RETIRED: 1,
        BLOCKED: 1,
      },
    });

    expect(
      report.unresolvedRows.map(
        (row) => row.surface,
      ),
    ).toEqual([
      "Calendar",
      "Login",
      "Profile",
      "Decision",
    ]);
  });
});
