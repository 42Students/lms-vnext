# CI unit-test packet (round 8)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat6-admin-second-third-lecture-hall-pages.test.ts (1 failing)
- Super Admin second third: actual Lecture Halls server-page states > CHAT6-ADMIN-LECTURES-PAGE-03 passes the authenticated college and validated pagination to both selectors

  ```
  AssertionError: expected '<div class="min-w-0 space-y-4 md:spac…' to contain 'IIT Dharwad'
  - Expected
  + Received
  - IIT Dharwad
  + <div class="min-w-0 space-y-4 md:space-y-6"><header data-slot="page-header" class="mb-2 flex w-full min-w-0 flex-col items-stretch gap-2 border-b border-[var(--lms-canvas-border)] pb-4 md:mb-4 md:flex-row md:items-start md:justify-between md:gap-6 [--lms-page-header-title-size:20px] md:[--lms-page
  ```

## tests/unit/chat7-legacy-learner-submission-form-copy.test.ts (1 failing)
- SubmitAssignmentModal.jsx dev copy in Learner submission form > uses exact drawer and submission-method labels

  ```
  AssertionError: expected '"use client";\nimport { Select } from…' to contain 'Add your work using the allowed metho…'
  - Expected
  + Received
  - Add your work using the allowed methods below. Submission is final once recorded.
  + "use client";
  + import { Select } from "@/components/ui/select";
  +
  + import {
  ```
