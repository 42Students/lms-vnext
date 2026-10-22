# CI unit-test packet (round 8)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat6-admin-second-third-people-inbound.test.ts (1 failing)
- /admin second third: inbound mail and People directory behavioral boundaries > CHAT6-ADMIN-INBOUND-01 validates inbox filters, refuses duplicate/privileged input and caps search

  ```
  AssertionError: {"page":"0"}: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```

## tests/unit/chat7-mentor-meeting-draft-lifecycle.test.ts (1 failing)
- MEN-projects-meetings-27 meeting draft lifecycle > MEN-projects-meetings-27 makes draft private and never notifies learners when cancelled

  ```
  AssertionError: expected 'import {\n  and,\n  asc,\n  eq,\n  in…' to contain 'scope.access!=="MENTOR" && scope.acce…'
  - Expected
  + Received
  - scope.access!=="MENTOR" && scope.access!=="ADMIN" ? [
  + import {
  +   and,
  +   asc,
  +   eq,
  ```
