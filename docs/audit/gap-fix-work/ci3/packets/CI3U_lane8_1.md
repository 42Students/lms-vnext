# CI unit-test packet (round 3)

These INTEGRATION tests (real PostgreSQL in CI, all migrations applied) FAIL on main. Read the CI workflow .github/workflows/ci.yml for the DB setup. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/admin-student-rule-write.test.ts (1 failing)
- Super Admin student rule write boundaries > round-trips Set, Lock and Inherit with persisted audit and stale-write denial

  ```
  AuthorizationError: Missing permission: college.manage
  ❯ requirePermission src/modules/permissions/policy.ts:308:11
  306| ) {
  307|   if (!can(context, permission, resource)) {
  308|     throw new AuthorizationError(permission);
  |           ^
  309|   }
  310| }
  ```

## tests/integration/college-placements-interviews.test.ts (4 failing)
- College Admin interviews: isolated PostgreSQL > COL-placements-04: schedule, edit, complete persist, audit and notify the candidate

  ```
  ZodError: [
  {
  "code": "custom",
  "path": [
  "appointment",
  "interviewType"
  ],
  "message": "Please select interview type"
  ```
- College Admin interviews: isolated PostgreSQL > COL-placements-04: cancel frees the candidate slot and a stale version is refused

  ```
  ZodError: [
  {
  "code": "custom",
  "path": [
  "appointment",
  "interviewType"
  ],
  "message": "Please select interview type"
  ```
- College Admin interviews: isolated PostgreSQL > COL-placements-04: rejects past times, virtual without https, overlapping room, non-shortlisted candidate and closed drive

  ```
  ZodError: [
  {
  "code": "custom",
  "path": [
  "appointment",
  "interviewType"
  ],
  "message": "Please select interview type"
  ```
- College Admin interviews: isolated PostgreSQL > COL-placements-19: directory lists booked interviews with summary, mode/status/company filters and a student overlap conflict

  ```
  ZodError: [
  {
  "code": "custom",
  "path": [
  "appointment",
  "interviewType"
  ],
  "message": "Please select interview type"
  ```

## tests/integration/db10-notification-guards.test.ts (4 failing)
- DB10 notification correctness and privacy > reports actual inserted deliveries, not eligible attempts on duplicate

  ```
  AssertionError: expected 13 to be 1 // Object.is equality
  - Expected
  + Received
  - 1
  + 13
  ```
- DB10 notification correctness and privacy > counts all 105 unread rows, respects owner and updates after read

  ```
  AssertionError: expected 117 to be 105 // Object.is equality
  - Expected
  + Received
  - 105
  + 117
  ```
- DB10 notification correctness and privacy > rejects protocol-relative, backslash and control-character links

  ```
  AssertionError: expected 12 to be +0 // Object.is equality
  - Expected
  + Received
  - 0
  + 12
  ```
- DB10 notification correctness and privacy > returns committed read state when multiple requests acknowledge concurrently

  ```
  AssertionError: expected 12 to be +0 // Object.is equality
  - Expected
  + Received
  - 0
  + 12
  ```

## tests/integration/hr-notification-read.test.ts (1 failing)
- HR notification acknowledgement PG > marks only own exact-company notification, denies foreign and stale token

  ```
  PlacementsServiceError: PLACEMENT_JOB_NOT_PUBLISHABLE
  ❯ src/modules/placements/job-service.ts:830:13
  828|     ]);
  829|     if (!rounds.length || !policy.length) {
  830|       throw new PlacementsServiceError("PLACEMENT_JOB_NOT_PUBLISHABLE"…
  |             ^
  831|     }
  832|     const now = new Date();
  ```
