# CI unit-test packet (round 10db)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/super-admin-live-classes-directory.test.ts (1 failing)
- Super Admin live classes directory disposable PostgreSQL > returns only live classes, hides other kinds and foreign-college content

  ```
  AssertionError: expected { …(30) } to not have property "externalUrl"
  - Expected:
  undefined
  + Received:
  "https://example.test/meet/admin-live-2e583c2c"
  ```
