# CI unit-test packet (round 8)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/faculty-profile-round9-13.test.ts (1 failing)
- lists every actual Faculty self-profile editor exactly once with stable anchors

  ```
  AssertionError: expected 13 to be 12 // Object.is equality
  - Expected
  + Received
  - 12
  + 13
  ```

## tests/unit/projects-phase2-exact-tabs.test.ts (1 failing)
- Phase2 exact legacy Projects labels + single tab strip > has one workspace-level Admin tab strip, not the list-level strip too

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain 'aria-label="Project workspace section…'
  - Expected
  + Received
  - aria-label="Project workspace sections"
  + import { EmptyState } from "@/components/ui/empty-state";
  + import Link from "next/link";
  + import { Tabs } from "@/components/ui/tabs";
  + import { Disclosure } from "@/components/ui/disclosure";
  ```
