# Faculty Attendance / Grades — chat-11 source verification

**DONE means code and ID-named tests authored or verified on branch, not executed.** Orchestrator must run tests, types, DB and browser assertions.

| ID | Status | Evidence |
|---|---|---|
| FAC-attendance-grades-14 | DONE | src/components/attendance/faculty-attendance-workspace.tsx; tests/unit/college-faculty-round6-gap-verification.test.ts — `it("FAC-attendance-grades-14 restores legacy attendance subtitle while keeping useful coverage navigation")` |
| FAC-attendance-grades-18 | NOT-A-GAP | src/modules/attendance/faculty-service.ts; tests/unit/college-faculty-round6-gap-verification.test.ts — `it("FAC-attendance-grades-18 verifies explicit membership lists and disjoint attendance marks")`. 1000 cap vs 500 is a capacity difference; a hard cap and cohort membership validation remain. |
| FAC-attendance-grades-19 | DONE | src/components/courses/faculty-course-home-signals.tsx, src/components/attendance/faculty-attendance-workspace.tsx; tests/unit/college-faculty-round6-gap-verification.test.ts — `it("FAC-attendance-grades-19 avoids developer risk-rule copy and honors college threshold")` |
| FAC-attendance-grades-22 | DONE | src/app/(authenticated)/teacher/courses/[deliveryId]/{gradebook,reports,session-coverage}/page.tsx; tests/unit/college-faculty-round6-gap-verification.test.ts — `it("FAC-attendance-grades-22 avoids extra invented Faculty eyebrow copy")` |

| FAC-attendance-grades-15 | NOT-A-GAP | src/modules/attendance/faculty-correction-audit-model.ts, src/components/attendance/faculty-attendance-workspace.tsx; tests/unit/college-faculty-round6-gap-verification.test.ts — `it("FAC-attendance-grades-15 keeps audited correction reason and optimistic version checks")`. Stricter no-op, audit reason and stale-version protection are intentional data-integrity safeguards; owner decision OD-05 keeps the correction reason audited. |

## Outstanding
FAC-attendance-grades-01/02/03/04/05/06/07/08/09/10/11/12/13/16/17/20/21 remain to be reconciled; no tests executed by chat-11.
