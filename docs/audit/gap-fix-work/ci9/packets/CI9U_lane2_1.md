# CI unit-test packet (round 9)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/PROJ-BREAK-chat9-admin-scoped-directory-states.test.tsx (1 failing)
- Super Admin last-third shared scoped directories: no false empties or leaked errors > UX-admin-directory-106 legitimate empty list remains a distinct zero-state

  ```
  AssertionError: expected 'Registered Students Scoped list Stude…' to contain '0 matching records'
  Expected: "0 matching records"
  Received: "Registered Students Scoped list Students 0 Active 0 Suspended 0 Visible now 0 Search Status Any status Active Suspended Ended Filter Rows per page 0 of 0 students  · showing  0 – 0  · page  1  of  1"
  ```
