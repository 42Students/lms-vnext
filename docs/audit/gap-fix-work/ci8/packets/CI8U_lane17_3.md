# CI unit-test packet (round 8)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat6-auth-admin-scope-private-16.test.ts (3 failing)
- AUTH-handoff-16 account scope response cache safety > GET never caches selected college identity and role choices

  ```
  AssertionError: expected 500 to be 200 // Object.is equality
  - Expected
  + Received
  - 200
  + 500
  ```
- AUTH-handoff-16 account scope response cache safety > POST returns a private response and only server-resolved scope as a secure cookie

  ```
  AssertionError: expected 500 to be 200 // Object.is equality
  - Expected
  + Received
  - 200
  + 500
  ```
- AUTH-handoff-16 account scope response cache safety > DELETE clears the admin scope cookie without caching the prior scope

  ```
  AssertionError: expected 500 to be 200 // Object.is equality
  - Expected
  + Received
  - 200
  + 500
  ```

## tests/unit/chat7-superadmin-course-catalogue-touch-pagination.test.ts (1 failing)
- SA-COURSES-TOUCH-13 Super Admin course catalogue mobile filters and safe pagination > renders accessible 44px Super Admin filters and all touch/keyboard course actions

  ```
  AssertionError: expected 'import { FilterBar } from "@/componen…' not to contain 'min-h-9'
  - Expected
  + Received
  - min-h-9
  + import { FilterBar } from "@/components/ui/filter-bar";
  + import { StatTile } from "@/components/ui/stat-tile";
  + import { Alert } from "@/components/ui/alert";
  + import { Disclosure } from "@/components/ui/disclosure";
  ```
