# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat2-tpo-recruiters-needs-toggle.test.ts (1 failing)
- Engage attention and legacy counters > TPO-recruiters-07 allows Needs doing strip to collapse without losing the active filters

  ```
  AssertionError: expected '"use client";\nimport { PageHeader } …' to contain 'setNeedsExpanded(open=>!open)'
  - Expected
  + Received
  - setNeedsExpanded(open=>!open)
  + "use client";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Tabs } from "@/components/ui/tabs";
  + import { FilterChip } from "@/components/ui/filter-chip";
  ```

## tests/unit/chat3-faculty-assessment-report-service-scope.test.ts (1 failing)
- FAC-REPORT-SERVICE-01 authenticated Section report projections > fails safely when roster or report source rejects an access grant after page load

  ```
  AssertionError: promise resolved "{ quiz: { …(3) }, …(8) }" instead of rejecting
  - Expected
  + Received
  - Error {
  -   "message": "rejected promise",
  + {
  +   "attempts": [
  +     {
  ```

## tests/unit/chat3-sa-recruiter-directory-partial-service.test.tsx (3 failing)
- SA-RECRUITERS-PARTIAL-01 administrative recruiter directory resilience > legacy /admin/recruiters aliases the same guarded /admin/hr route

  ```
  AssertionError: expected [AsyncFunction SuperAdminRecruitersPage] to be [AsyncFunction SuperAdminHrPage] // Object.is equality
  - Expected
  + Received
  - [Function SuperAdminHrPage]
  + [Function SuperAdminRecruitersPage]
  ```
- SA-RECRUITERS-PARTIAL-01 administrative recruiter directory resilience > still renders the selected-scoped account list while summary query is offline

  ```
  AssertionError: expected undefined to be null
  - Expected:
  null
  + Received:
  undefined
  ```
- SA-RECRUITERS-PARTIAL-01 administrative recruiter directory resilience > does not invent a successful directory when its primary list query fails

  ```
  AssertionError: expected undefined to be null
  - Expected:
  null
  + Received:
  undefined
  ```

## tests/unit/chat4-college-company-identity-gap-closure.test.ts (1 failing)
- chat-4 college company identity > COL-placements-R02 distinguishes platform verification, college trust and archived employer cues

  ```
  AssertionError: expected '"use client";\n\nimport { useRef, use…' to contain 'Domains:'
  - Expected
  + Received
  - Domains:
  + "use client";
  +
  + import { useRef, useState } from "react";
  + import Link from "next/link";
  ```

## tests/unit/chat4-college-term-mapping-phone-actions.test.tsx (4 failing)
- COL-UX-TERM-MAPPINGS-04 keyboard/mobile curriculum mapping > rejects invalid, duplicate-position or missing-course moves before sending updates

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```
- COL-UX-TERM-MAPPINGS-04 keyboard/mobile curriculum mapping > retains the empty-state guidance instead of rendering a zero-row modal or phantom mapping

  ```
  Error: [vitest] No "usePathname" export is defined on the "next/navigation" mock. Did you forget to return it from "vi.mock"?
  If you need to partially mock a module, you can use "importOriginal" helper inside:
  vi.mock(import("next/navigation"), async (importOriginal) => {
  const actual = await importOriginal()
  return {
  ...actual,
  // your mocked methods
  }
  ```
- COL-UX-TERM-MAPPINGS-04 keyboard/mobile curriculum mapping > renders one DataTable with all original actions, drag fallback and phone-visible order controls

  ```
  AssertionError: expected '"use client";\n\nimport { Select } fr…' to contain 'draggable={!pending}'
  - Expected
  + Received
  - draggable={!pending}
  + "use client";
  +
  + import { Select } from "@/components/ui/select";
  + import { Input } from "@/components/ui/input";
  ```
- COL-UX-TERM-MAPPINGS-04 keyboard/mobile curriculum mapping > rejects simultaneous mutations and maps failures to friendly copy

  ```
  AssertionError: expected '"use client";\n\nimport { Select } fr…' to contain 'if(inFlight.current)return;'
  - Expected
  + Received
  - if(inFlight.current)return;
  + "use client";
  +
  + import { Select } from "@/components/ui/select";
  + import { Input } from "@/components/ui/input";
  ```

## tests/unit/chat4-project-archive-cas-handler.test.ts (1 failing)
- PROJ-BREAK-COLLEGE-04-ARCHIVE-07 optimistic College Admin archive > passes the visible project's timestamp and scoped actor to the archive service

  ```
  AssertionError: expected { project: { …(2) }, …(4) } to deeply equal { project: { …(2) } }
  - Expected
  + Received
  {
  +   "destructive": false,
  +   "legacyOperation": "ARCHIVE",
  +   "message": "Project archived",
  "project": {
  ```
