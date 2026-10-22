# CI unit-test packet (round 8db)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/courses-ui2a-faculty.test.ts (3 failing)
- courses UI2A faculty read model > discovers only exact active teaching deliveries and composes shared plus Section items

  ```
  AssertionError: expected { lessons: 1, contents: 1, …(4) } to match object { lessons: 1, contents: 2, …(4) }
  - Expected
  + Received
  {
  "assignments": 1,
  -   "contents": 2,
  -   "draftItems": 4,
  +   "contents": 1,
  ```
- courses UI2A faculty read model > round-trips Faculty attendance marking into the learner view and supports correction back to present

  ```
  AssertionError: expected ZodError: [
  {
  "code": "custom",
  … { …(2) } to match object { code: 'ATTENDANCE_ROSTER_CONFLICT' }
  (2 matching properties omitted from actual)
  - Expected
  + Received
  - {
  ```
- courses UI2A faculty read model > gives College Admin a scoped attendance grid and correction path without granting Faculty admin access

  ```
  AssertionError: expected { …(9) } to match object { attendanceStatus: 'MARKED', …(1) }
  (7 matching properties omitted from actual)
  - Expected
  + Received
  {
  -   "attendanceMarkedByUserId": "30000000-0000-4000-8000-000000000002",
  -   "attendanceStatus": "MARKED",
  +   "attendanceMarkedByUserId": null,
  ```
