# CI unit-test packet (round 8)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat15-reassigned-learner-parity.test.ts (1 failing)
- chat-15 reassigned learner course and placement parity > LEARNER-placements-03 placement tabs render content without extra PageHeader

  ```
  AssertionError: expected 'import { Alert } from "@/components/u…' to contain '<PageHeader'
  - Expected
  + Received
  - <PageHeader
  + import { Alert } from "@/components/ui/alert";
  + import { PageLoading } from "@/components/ui/page-loading";
  + import {StatusBadge,applicationStatusTone} from "@/components/ui/status-badge";
  + import { ErrorState } from "@/components/ui/error-state";
  ```

## tests/unit/chat2-tpo-last-third-runtime-settings-pages.test.tsx (1 failing)
- chat-2 TPO last-third runtime settings pages > TPO-settings-team-page-04 keeps roster PII unrendered and exposes phone labels in the table

  ```
  AssertionError: expected '<div class="min-w-0 space-y-6"><heade…' to contain 'More details'
  - Expected
  + Received
  - More details
  + <div class="min-w-0 space-y-6"><header data-slot="page-header" class="mb-2 flex w-full min-w-0 flex-col items-stretch gap-2 border-b border-[var(--lms-canvas-border)] pb-4 md:mb-4 md:flex-row md:items-start md:justify-between md:gap-6 [--lms-page-header-title-size:20px] md:[--lms-page-header-title
  ```
