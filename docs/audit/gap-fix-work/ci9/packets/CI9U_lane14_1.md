# CI unit-test packet (round 9)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/UX-teacher-shared-surfaces.test.ts (1 failing)
- Faculty shared surface mobile and focus rollout > UX-teacher-courses-shared-02 preserves course summary roles and 44px filter disclosures

  ```
  AssertionError: expected 'import type { ReactNode } from "react…' to contain 'flex min-h-11 cursor-pointer'
  - Expected
  + Received
  - flex min-h-11 cursor-pointer
  + import type { ReactNode } from "react";
  + import { cx } from "@/lib/class-names";
  +
  + /** Semantic keyboard disclosure. Native details handles Enter/Space and
  ```
