# CI unit-test packet (round 10db)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/faculty-mentor-positive-courses.test.ts (1 failing)
- Chat4 Faculty SUCCESS paths against disposable PostgreSQL > scopes the old Quiz results endpoint to the owning Section Faculty and Admin, with audit

  ```
  AssertionError: promise resolved "{ …(27) }" instead of rejecting
  - Expected
  + Received
  - Error {
  -   "message": "rejected promise",
  + {
  +   "createdAt": 2026-10-22T11:42:44.794Z,
  +   "createdByUserId": "30000000-0000-4000-8000-000000000003",
  ```
