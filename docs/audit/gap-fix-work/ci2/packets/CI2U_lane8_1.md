# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/HR-BREAK-chat15-calendar-08.test.ts (1 failing)
- HR-CALENDAR-SCOPE-08 authorized recruiter calendar and IST bounds > includes only authorized job events inside the exact Jan 2 IST calendar day

  ```
  TypeError: getDb(...).select(...).from(...).innerJoin is not a function
  ❯ Module.listRecruiterCalendarEvents src/modules/placements/recruiter-calendar-service.ts:241:6
  239|     // Keep the same-job composite relationship and parent state in the
  240|     // reader so stale slots never appear as active interviews.
  241|     .innerJoin(placementJobRounds,and(
  |      ^
  242|       eq(placementJobRounds.id,hrInterviewSlots.roundId),
  243|       eq(placementJobRounds.jobId,hrInterviewSlots.jobId),
  ```

## tests/unit/HR-BREAK-chat15-superadmin-tracker-scope-67.test.ts (4 failing)
- SA-TRACKER-AUDIT-67 global issues and error logs stay outside acting tenant scopes > acting in college must not open global Tracker issues or private logs

  ```
  
  ```
- SA-TRACKER-AUDIT-67 global issues and error logs stay outside acting tenant scopes > acting in organization must not open global Tracker issues or private logs

  ```
  AssertionError: promise resolved "{ …(10) }" instead of rejecting
  - Expected
  + Received
  - Error {
  -   "message": "rejected promise",
  - }
  + <section
  +   className="mx-auto max-w-[480px] space-y-4 rounded-[12px] border border-[var(--lms-canvas-border)] bg-surface p-6 text-center"
  ```
- SA-TRACKER-AUDIT-67 global issues and error logs stay outside acting tenant scopes > a disabled Super Admin must be refused before privileged reads

  ```
  AssertionError: promise resolved "{ …(10) }" instead of rejecting
  - Expected
  + Received
  - Error {
  -   "message": "rejected promise",
  - }
  + <section
  +   className="mx-auto max-w-[480px] space-y-4 rounded-[12px] border border-[var(--lms-canvas-border)] bg-surface p-6 text-center"
  ```
- SA-TRACKER-AUDIT-67 global issues and error logs stay outside acting tenant scopes > a recruiter company grant is not a global issue or error-log permission

  ```
  AssertionError: promise resolved "{ …(10) }" instead of rejecting
  - Expected
  + Received
  - Error {
  -   "message": "rejected promise",
  - }
  + <section
  +   className="mx-auto max-w-[480px] space-y-4 rounded-[12px] border border-[var(--lms-canvas-border)] bg-surface p-6 text-center"
  ```

## tests/unit/HR-BREAK-chat19-home-portfolio-proposals.test.ts (1 failing)
- HR-BREAK-chat19-home-portfolio-proposals: no inferred tenant or false sent claims > wrong-tenant selection is rejected on Today before portfolio, calendar or profile reads

  ```
  AssertionError: promise resolved "{ …(10) }" instead of rejecting
  - Expected
  + Received
  - Error {
  -   "message": "rejected promise",
  + <div
  +   className="min-w-0 max-w-full space-y-4 md:space-y-6"
  + >
  ```

## tests/unit/HR-BREAK-tracker-detail-chat15-02.test.ts (2 failing)
- HR-BREAK-tracker-detail-chat15-02: reporter privacy and failure semantics > renders a non-querying availability state when the tracker is disabled

  ```
  AssertionError: expected 'div' to be 'p' // Object.is equality
  Expected: "p"
  Received: "div"
  ```
- HR-BREAK-tracker-detail-chat15-02: reporter privacy and failure semantics > passes only the authenticated reporter context into the scoped query

  ```
  Error: [vitest] No "listMyTrackerReportHistory" export is defined on the "@/modules/bug-tracker/reporter-service" mock. Did you forget to return it from "vi.mock"?
  If you need to partially mock a module, you can use "importOriginal" helper inside:
  vi.mock(import("@/modules/bug-tracker/reporter-service"), async (importOriginal) => {
  const actual = await importOriginal()
  return {
  ...actual,
  // your mocked methods
  }
  ```

## tests/unit/PROJ-BREAK-chat14-mentor-meeting-races.test.ts (3 failing)
- Mentor meeting writes and direct read permissions > PROJ-BREAK-MENTOR-282 meeting completion rechecks persisted Mentor after parent row lock

  ```
  AssertionError: expected [Function] to throw error including 'PROJECT_LIFECYCLE_ACCESS_DENIED' but got '[vitest] No "isNull" export is define…'
  - Expected
  + Received
  - PROJECT_LIFECYCLE_ACCESS_DENIED
  + [vitest] No "isNull" export is defined on the "drizzle-orm" mock. Did you forget to return it from "vi.mock"?
  + If you need to partially mock a module, you can use "importOriginal" helper inside:
  +
  ```
- Mentor meeting writes and direct read permissions > PROJ-BREAK-MENTOR-283 meeting cancellation rechecks persisted Mentor before mutation

  ```
  AssertionError: expected [Function] to throw error including 'PROJECT_LIFECYCLE_ACCESS_DENIED' but got '[vitest] No "isNull" export is define…'
  - Expected
  + Received
  - PROJECT_LIFECYCLE_ACCESS_DENIED
  + [vitest] No "isNull" export is defined on the "drizzle-orm" mock. Did you forget to return it from "vi.mock"?
  + If you need to partially mock a module, you can use "importOriginal" helper inside:
  +
  ```
- Mentor meeting writes and direct read permissions > PROJ-BREAK-MENTOR-352 revoked requester cannot cancel a meeting or notify others

  ```
  AssertionError: expected [Function] to throw error including 'PROJECT_ACCESS_DENIED' but got '[vitest] No "isNull" export is define…'
  - Expected
  + Received
  - PROJECT_ACCESS_DENIED
  + [vitest] No "isNull" export is defined on the "drizzle-orm" mock. Did you forget to return it from "vi.mock"?
  + If you need to partially mock a module, you can use "importOriginal" helper inside:
  +
  ```

## tests/unit/PROJ-BREAK-chat19-project-workspace-csv.test.ts (2 failing)
- PROJ-BREAK-EXPORT-01: Project workspace visible-page CSV safety and scope > exports only supplied, authorized page rows with original order and quoted titles

  ```
  AssertionError: expected '"Workspace","Status","Progress","Ment…' to contain '"45","2"'
  - Expected
  + Received
  - "45","2"
  + "Workspace","Status","Progress","Mentor","Template ID"
  + "'=IMPORTRANGE(""secret"",""A:B"")","Blocked","45","A,""B""","Not available"
  +
  ```
- PROJ-BREAK-EXPORT-01: Project workspace visible-page CSV safety and scope > never fetches or includes hidden projects: empty authorized page exports only headings

  ```
  AssertionError: expected '\ufeff"Workspace","Status","Progress"…' to contain '"Workspace","Mentor","Status","Progre…'
  - Expected
  + Received
  - "Workspace","Mentor","Status","Progress %","Members","Last changed (IST)"
  + ﻿"Workspace","Status","Progress","Mentor","Template ID"
  +
  ```
