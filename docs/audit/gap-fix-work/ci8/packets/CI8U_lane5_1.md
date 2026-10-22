# CI unit-test packet (round 8)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/PROJ-BREAK-chat7-learner-board-filters-and-scroll.test.ts (1 failing)
- PROJ-BREAK-LEARNER-96/97 board filter and mobile navigation resilience > preserves keyboard and touch access when Board lanes overflow a 320px device

  ```
  AssertionError: expected '"use client";\nimport { Badge } from …' to contain 'className={styles.scrollRegion}'
  - Expected
  + Received
  - className={styles.scrollRegion}
  + "use client";
  + import { Badge } from "@/components/ui/badge";
  + import { Alert } from "@/components/ui/alert";
  + import { EmptyState } from "@/components/ui/empty-state";
  ```

## tests/unit/UX-superadmin-legacy-01.test.ts (1 failing)
- UX-superadmin-legacy-01 > preserves original wording, permissions and supported accessible UX

  ```
  AssertionError: expected '/** The legacy client used six pulsin…' to contain 'GracefulPageLoading'
  - Expected
  + Received
  - GracefulPageLoading
  + /** The legacy client used six pulsing Skeleton paragraphs before routing.
  +  * Server redirects normally skip this fallback, but streaming/slow navigation
  +  * retains its accessible single-column silhouette on every viewport. */
  + export default function Loading() {
  ```
