# CI unit-test packet (round 9)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/mentor-resource-audit-archive.test.ts (1 failing)
- keeps archive resource audit inside the project transaction with safe metadata

  ```
  AssertionError: expected '{"projectId":"project-a","resourceId"…' not to contain '=unsafe'
  Expected: "=unsafe"
  Received: "{"projectId":"project-a","resourceId":"resource-a","resourceKey":"resource-a","actionType":"DELETE","beforeJson":null,"afterJson":{"title":"Reference =unsafe","sequence":null,"required":null,"visibility":null,"resourceType":null,"status":null,"pinned":null,"legacyResourceKind":null,"url":
  ```
