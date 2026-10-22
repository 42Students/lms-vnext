# CI unit-test packet (round 10)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat2-tpo-whole-round-apply-service.test.ts (1 failing)
- TPO-drive-workspace-42 whole-round preview/apply authorization and partial persistence > TPO-drive-workspace-42 applies only staged outcomes and reports each rejected result without leaking private errors

  ```
  AssertionError: expected "vi.fn()" to be called with arguments: [ { user: { …(4) }, …(1) }, …(2) ]
  Received:
  1st vi.fn() call:
  @@ -16,6 +16,7 @@
  "systemRoles": [],
  },
  },
  "00000000-0000-4000-8000-000000000004",
  ```
