# CI unit-test packet (round 8db)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/identity-system-roles.test.ts (1 failing)
- identity context and system roles against PostgreSQL > resolves only memberships owned by the authenticated canonical user

  ```
  AssertionError: expected { …(5) } to match object { …(3) }
  (2 matching properties omitted from actual)
  - Expected
  + Received
  {
  "collegeId": "20000000-0000-4000-8000-000000000001",
  "id": "40000000-0000-4000-8000-000000000002",
  "roles": [
  ```
