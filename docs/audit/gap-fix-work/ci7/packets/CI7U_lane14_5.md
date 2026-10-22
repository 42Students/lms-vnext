# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/tracker-report-sa-placements-projects-100.test.ts (2 failing)
- SA-placements-projects-100 report intake contract > rejects spoofed actor fields, invalid location and unknown type

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```
- SA-placements-projects-100 report intake contract > preserves exact validation messages

  ```
  AssertionError: expected 'description is required' to be 'Describe what went wrong.' // Object.is equality
  Expected: "Describe what went wrong."
  Received: "description is required"
  ```
