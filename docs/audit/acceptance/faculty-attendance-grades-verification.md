# Faculty Attendance / Grades — chat-11 source verification

**DONE means code and ID-named tests authored or verified on branch, not executed.** Orchestrator must run tests, types, DB and browser assertions.

| ID | Status | Evidence |
|---|---|---|
| FAC-attendance-grades-14 | DONE | src/components/attendance/faculty-attendance-workspace.tsx; tests/unit/college-faculty-round6-gap-verification.test.ts — `it("FAC-attendance-grades-14 restores legacy attendance subtitle while keeping useful coverage navigation")` |
| FAC-attendance-grades-18 | NOT-A-GAP | src/modules/attendance/faculty-service.ts; tests/unit/college-faculty-round6-gap-verification.test.ts — `it("FAC-attendance-grades-18 verifies explicit membership lists and disjoint attendance marks")`. 1000 cap vs 500 is a capacity difference; a hard cap and cohort membership validation remain. |
| FAC-attendance-grades-19 | DONE | src/components/courses/faculty-course-home-signals.tsx, src/components/attendance/faculty-attendance-workspace.tsx; tests/unit/college-faculty-round6-gap-verification.test.ts — `it("FAC-attendance-grades-19 avoids developer risk-rule copy and honors college threshold")` |
| FAC-attendance-grades-22 | DONE (source-verified; tests not run) | Removed invented PageHeader descriptions from authorized faculty gradebook, reports and session-coverage routes while retaining purpose-specific titles, read-only data, export and navigation. No invented `Faculty · Section`/`Faculty · Course Reports` eyebrow appears. Test: `tests/unit/chat4-final-fac-attendance-grades-22.test.ts` (`FAC-attendance-grades-22`) as well as existing faculty acceptance tests. Previous DONE citation was inadequate because dynamic header descriptions remained. |

| FAC-attendance-grades-15 | NOT-A-GAP | src/modules/attendance/faculty-correction-audit-model.ts, src/components/attendance/faculty-attendance-workspace.tsx; tests/unit/college-faculty-round6-gap-verification.test.ts — `it("FAC-attendance-grades-15 keeps audited correction reason and optimistic version checks")`. Stricter no-op, audit reason and stale-version protection are intentional data-integrity safeguards; owner decision OD-05 keeps the correction reason audited. |

| FAC-attendance-grades-21 | NOT-A-GAP | docs/audit/owner-decisions-resolved.md OD-33; tests/unit/chat11-provider-copy-round5.test.ts — `it("FAC-attendance-grades-21 keeps manual non-assignment grade entry out of scope per OD-33")`. Published assignment and quiz grades remain accessible. |

| FAC-attendance-grades-02 | DONE | src/components/attendance/faculty-attendance-workspace.tsx; tests/unit/faculty-attendance-source-round5.test.ts — `it("FAC-attendance-grades-02 guards all attendance dirty-mode, date, session and unload changes")` |
| FAC-attendance-grades-05 | DONE | src/components/attendance/faculty-attendance-workspace.tsx; tests/unit/faculty-attendance-source-round5.test.ts — `it("FAC-attendance-grades-05 filters the class schedule by selected local date")` |
| FAC-attendance-grades-06 | DONE | src/components/attendance/faculty-attendance-workspace.tsx; tests/unit/faculty-attendance-source-round5.test.ts — `it("FAC-attendance-grades-06 preserves no-class and schedule-action guidance")` |
| FAC-attendance-grades-07 | DONE | src/modules/attendance/faculty-schedule-editor-model.ts; src/components/attendance/faculty-attendance-workspace.tsx; tests/unit/faculty-attendance-source-round5.test.ts — `it("FAC-attendance-grades-07 validates end after start, 12-hour bound and successful scheduling")` |
| FAC-attendance-grades-08 | DONE | src/components/attendance/faculty-attendance-workspace.tsx; tests/unit/faculty-attendance-source-round5.test.ts — `it("FAC-attendance-grades-08 shows legacy monthly attendance legend and Active days")` |
| FAC-attendance-grades-09 | DONE | src/components/attendance/faculty-attendance-workspace.tsx; tests/unit/faculty-attendance-source-round5.test.ts — `it("FAC-attendance-grades-09 shows marked and unmarked session counts with monthly report tiles")` |
| FAC-attendance-grades-11 | DONE | src/components/attendance/faculty-attendance-workspace.tsx; tests/unit/faculty-attendance-source-round5.test.ts — `it("FAC-attendance-grades-11 searches the roster with the legacy student-name label")` |
| FAC-attendance-grades-12 | DONE | src/components/attendance/faculty-attendance-workspace.tsx; tests/unit/faculty-attendance-source-round5.test.ts — `it("FAC-attendance-grades-12 offers previous, jump and next month controls")` |
| FAC-attendance-grades-13 | DONE | src/components/attendance/faculty-attendance-workspace.tsx; tests/unit/faculty-attendance-source-round5.test.ts — `it("FAC-attendance-grades-13 shows exact faculty attendance-window closure and not-started messages")` |
| FAC-attendance-grades-17 | DONE | src/components/courses/faculty-report-download.tsx; tests/unit/faculty-attendance-source-round5.test.ts — `it("FAC-attendance-grades-17 shows Download Report and safe PDF error feedback")` |

| FAC-attendance-grades-10 | DONE | src/components/courses/faculty-course-tab-navigation.tsx; tests/unit/chat11-session-course-gap-verification.test.ts — `it("FAC-attendance-grades-10 offers the legacy class selector on the attendance tab")`. Navigation remains centralized in the course tab strip. |
| FAC-attendance-grades-16 | DONE | src/app/(authenticated)/teacher/courses/[deliveryId]/attendance-corrections/page.tsx; tests/unit/chat11-session-course-gap-verification.test.ts — `it("FAC-attendance-grades-16 retires the dead-end correction request page after access validation")`. Redirects to working Attendance tab. |

## Outstanding
FAC-attendance-grades-01/03/04/20 remain to be reconciled; no tests executed by chat-11.

## Chat-11 styled confirmation and mobile source witness

| FAC-attendance-grades-04 | DONE | src/components/attendance/faculty-attendance-workspace.tsx; tests/unit/chat11-faculty-attendance-confirm-round3.test.ts — `it("FAC-attendance-grades-04 uses styled Submit Attendance confirmation and exact count message")` |
| FAC-attendance-grades-20 | DONE | src/components/attendance/faculty-attendance-workspace.tsx; tests/unit/chat11-faculty-attendance-confirm-round3.test.ts — `it("FAC-attendance-grades-20 keeps a narrow-screen sticky submission bar and responsive roster")`. Mobile browser acceptance at 375px remains for orchestrator. |

| FAC-attendance-grades-03 | DONE | src/components/attendance/faculty-attendance-workspace.tsx; tests/unit/chat11-attendance-delivery-recovery.test.ts — `it("FAC-attendance-grades-03 has an atomic-failure explanation and deliberate persisted-roster re-read")` |
| FAC-attendance-grades-01 | PARTIAL — SMS provider registration outstanding | src/modules/attendance/faculty-service.ts; src/modules/attendance/faculty-correction-audit-model.ts; tests/unit/chat11-attendance-learner-notifications-round8.test.ts — `it("FAC-attendance-grades-01 only notifies learners whose absent/present state changed")`. In-app notices persisted in the same transaction as attendance. Parent absence/correction SMS remains OPEN pending registered DLT attendance templates and opted-in parent recipients. |


## Final sprint — chat-12 verification

| ID | Disposition | Test and acceptance evidence |
|---|---|---|
| FAC-attendance-grades-18 | NOT-A-GAP (intentional safe capacity 1000 instead of legacy 500) | `src/modules/attendance/faculty-service.ts`: 1000 maximum per list, unique and disjoint learner lists, scoped scheduled-roster verification. `tests/unit/chat12-final-faculty-attendance.test.ts`: `FAC-attendance-grades-18 keeps bounded present and absent lists with duplicate checks`, `FAC-attendance-grades-18 checks roster membership within the scheduled class`. |
| FAC-attendance-grades-19 | DONE | Persisted college attendance threshold is read from `attendancePolicies.eligibilityThresholdPercent`; no "legacy risk rules" user-visible explanation in `src/components/courses/faculty-course-home-signals.tsx`. `tests/unit/chat12-final-faculty-attendance.test.ts`: `FAC-attendance-grades-19 honors persisted college policy rather than hardcoded UI risk rules`. |

### chat-3 FAC-attendance-grades-18 additional current-roster privacy acceptance

| ID | Status | Evidence |
|---|---|---|
| FAC-attendance-grades-18 / FAC-WORKSPACE-TENANT-01 | DONE (source/test authored; runtime unverified) | `src/modules/attendance/faculty-service.ts` now constrains Faculty workspace attendance records by active same-college membership, active user and exact current delivery learner roster, not event ID alone. `tests/unit/chat3-faculty-attendance-workspace-tenant-boundary.test.ts` checks compiled SQL predicates, no historical records for an empty roster, revoked teaching and invalid delivery. Requires cloud CI, real PostgreSQL moved/disabled-learner fixtures and browser acceptance. |

Tests authored, not run in this environment; orchestrator must execute TypeScript, Vitest, and the database/browser acceptance.
