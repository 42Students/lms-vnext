# CI unit-test packet (round 8)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat9-owner-decision-scope-parity.test.ts (1 failing)
- Owner-approved improvements over obsolete legacy workflows > COL-projects-05 preserves recoverable archive and restore instead of a competing delete implementation

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'href="/college/projects?status=ARCHIV…'
  - Expected
  + Received
  - href="/college/projects?status=ARCHIVED"
  + import Link from "next/link";
  + import {redirect} from "next/navigation";
  + import {AuthorizationError} from "@/modules/permissions/policy";
  +
  ```

## tests/unit/learner-placements-dashboard-parity.test.ts (1 failing)
- Learner placement dashboard route wiring > shows separate scheduled/attention and empty/error loading states

  ```
  AssertionError: expected 'import { GracefulPageLoading } from "…' to contain 'aria-busy'
  - Expected
  + Received
  - aria-busy
  + import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
  +
  + /** Legacy LMS: one canvas, compact page heading and hairline rows. */
  + export default function Loading() {
  ```
