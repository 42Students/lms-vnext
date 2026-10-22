# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/HR-BREAK-chat19-notifications-page.test.ts (1 failing)
- HR-BREAK-chat19-notifications-page: recruiter-scoped page behavior > valid scoped query is passed unchanged to service and empty message is explicit

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```

## tests/unit/UX-SPILL-chat19-tpo-request-responsive.test.tsx (1 failing)
- UX-SPILL-TPO-CLIP-02: request mobile cards retain selection and full fields > exposes candidate identity, company, request state and selectable row in accessible phone cards

  ```
  AssertionError: expected '<section aria-label="Request row tool…' to contain 'Request spreadsheet scrollable columns'
  - Expected
  + Received
  - Request spreadsheet scrollable columns
  + <section aria-label="Request row tools" class="space-y-2 border-y border-[var(--lms-canvas-border)] py-3"><p class="text-sm font-semibold">Select and copy request rows</p><p role="status" aria-live="polite" class="text-xs">0 selected of 1 on this page.</p><div class="flex flex-wrap gap-3"><label c
  ```

## tests/unit/chat11-college-projects-role-journeys.test.ts (1 failing)
- IIT Dharwad College Admin Projects role journeys > PROJ-COL-QUERY-03 refuses number-coercion bypasses and retains canonical decimal navigation

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```

## tests/unit/chat13-attendance-accessible-correction.test.ts (1 failing)
- Super Admin attendance correction accessibility > SA-academics-people-R05 uses in-app correction actions, not native confirm

  ```
  AssertionError: expected '"use client";\n\nimport { ADMIN_ATTEN…' to contain 'void correct(status)'
  - Expected
  + Received
  - void correct(status)
  + "use client";
  +
  + import { ADMIN_ATTENDANCE_COPY } from "@/modules/attendance/admin-attendance-copy";
  + import {AdminAttendanceParentContactEditor} from "./admin-attendance-parent-contact-editor";
  ```
