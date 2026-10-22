# CI unit-test packet (round 8)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat16-tracker-findings-sync-r6.test.ts (1 failing)
- chat-16 independent audit findings sync evidence > SA-placements-projects-120 shows only persisted sync history, never synthetic GitHub sync success

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain 'No sync was performed by opening this…'
  - Expected
  + Received
  - No sync was performed by opening this page.
  + import { EmptyState } from "@/components/ui/empty-state";
  + import { Banner } from "@/components/ui/banner";
  + import Link from "next/link";
  + import {Button} from "@/components/ui/button";
  ```

## tests/unit/chat4-college-admin-projects-role-journey.test.ts (1 failing)
- Existing chat-4 CI failure regression contracts > SA-placements-projects-58 overload is strictly above 150% of the current average, not a fixed cap

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```
