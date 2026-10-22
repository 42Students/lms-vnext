# CI unit-test packet (round 9db)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/placements-requests.test.ts (1 failing)
- Placement learner requests and exceptions > extends an issued offer only through approval and blocks application withdrawal while the offer is active

  ```
  AssertionError: promise resolved "{ …(16) }" instead of rejecting
  - Expected
  + Received
  - Error {
  -   "message": "rejected promise",
  + {
  +   "applicationId": "3df3908d-f3b5-4e8a-bab9-72725cb9ea2d",
  +   "decidedAt": null,
  ```
