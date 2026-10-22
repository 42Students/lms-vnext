# CI unit-test packet (round 9)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/PROJ-BREAK-SA-admin-pages-and-scope.test.ts (1 failing)
- Super Admin Projects and Placements page routes — independent security and UX audit > PROJ-BREAK-SA-15 audits every live /admin placement/project page for auth or scope-enforcing delegate

  ```
  AssertionError: src/app/(authenticated)/admin/placements/hiring/page.tsx: expected 'import { redirect } from "next/naviga…' to contain 'getCurrentRequestContext'
  - Expected
  + Received
  - getCurrentRequestContext
  + import { redirect } from "next/navigation";
  + /** Legacy Hiring Dashboard address. The scoped report with KPI, funnel and
  +  * company sections is the Analytics page; do not treat job-count list as the
  +  * original dashboard or synthesize three incompatible legacy API responses. */
  ```
