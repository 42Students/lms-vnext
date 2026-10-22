# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat4-final-sprint-tpo-recruiters-a.test.ts (1 failing)
- chat-4 final sprint TPO recruiter gaps A > TPO-recruiters-21 has company-required add, future follow-up and dirty-draft confirmation

  ```
  AssertionError: expected '"use client";\nimport { PageHeader } …' to contain '<Dialog open={adding}'
  - Expected
  + Received
  - <Dialog open={adding}
  + "use client";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Tabs } from "@/components/ui/tabs";
  + import { FilterChip } from "@/components/ui/filter-chip";
  ```

## tests/unit/chat4-tpo-home-secondary-revalidation.test.ts (1 failing)
- chat-4 TPO home revalidation > TPO-home-32 supplies company-scoped recruiter lead and drive actions plus follow-up

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain '<TpoTopbarNewMenu'
  - Expected
  + Received
  - <TpoTopbarNewMenu
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { canOpenTpoWorkspace, hasTpoTooling } from "@/modules/placements/tpo-workspace-access-model";
  + import { TpoKeyboardShortcuts } from "@/components/tpo/tpo-keyboard-shortcuts";
  ```

## tests/unit/chat6-admin-write-safety-guards.test.ts (1 failing)
- GR-31 + GR-09 Super Admin write safety > SA-tenants-branding-01 prevents rapid duplicate writes and retains unsaved branding after network failure

  ```
  AssertionError: expected '"use client";\n\nimport { useEffect, …' to contain 'Could not save branding. Check your c…'
  - Expected
  + Received
  - Could not save branding. Check your connection and try again.
  + "use client";
  +
  + import { useEffect, useRef, useState, useTransition } from "react";
  + import { Button } from "@/components/ui/button";
  ```

## tests/unit/chat6-final-sprint-rec-home-drives-r04.test.ts (1 failing)
- Final sprint recruiter closed drive access > REC-home-drives-R04 closed drives keep read-only history and hide write actions

  ```
  AssertionError: expected 'import { MetricBar } from "@/componen…' to contain 'This drive is finished, so a selectio…'
  - Expected
  + Received
  - This drive is finished, so a selection list can no longer be sent.
  + import { MetricBar } from "@/components/ui/metric-bar";
  + import funnelStyles from "@/components/hr/recruiter-drive-funnel.module.css";
  + import { Button } from "@/components/ui/button";
  + import { ScrollCue } from "@/components/ui/scroll-cue";
  ```

## tests/unit/chat6-superadmin-middle-drives-27.test.tsx (3 failing)
- SA-middle-drives-27 platform administrator drive route isolation > missing college scope displays a recovery state without fetching private jobs

  ```
  AssertionError: expected '<div class="min-w-0 space-y-4"><heade…' to contain 'Choose a college'
  Expected: "Choose a college"
  Received: "<div class="min-w-0 space-y-4"><header data-slot="page-header" class="mb-2 flex w-full min-w-0 flex-col items-stretch gap-2 border-b border-[var(--lms-canvas-border)] pb-4 md:mb-4 md:flex-row md:items-start md:justify-between md:gap-6 [--lms-page-header-title-size:20px] md:[--lms-page-hea
  ```
- SA-middle-drives-27 platform administrator drive route isolation > authorized zero-row drive list renders truthful empty state with same-college loader

  ```
  Error: [vitest] No "listPlacementOperationsJobPage" export is defined on the "@/modules/placements/tpo-operations-service" mock. Did you forget to return it from "vi.mock"?
  If you need to partially mock a module, you can use "importOriginal" helper inside:
  vi.mock(import("@/modules/placements/tpo-operations-service"), async (importOriginal) => {
  const actual = await importOriginal()
  return {
  ...actual,
  // your mocked methods
  }
  ```
- SA-middle-drives-27 platform administrator drive route isolation > authorized job overview passes the route ID into a scoped detail workspace

  ```
  AssertionError: expected '<div class="min-w-0 space-y-4"><heade…' to contain 'Authorized drive overview'
  Expected: "Authorized drive overview"
  Received: "<div class="min-w-0 space-y-4"><header data-slot="page-header" class="mb-2 flex w-full min-w-0 flex-col items-stretch gap-2 border-b border-[var(--lms-canvas-border)] pb-4 md:mb-4 md:flex-row md:items-start md:justify-between md:gap-6 [--lms-page-header-title-size:20px] md:[--lms-page-hea
  ```

## tests/unit/chat7-college-project-legacy-one-tab.test.ts (2 failing)
- College Admin Projects legacy Workspaces and one tab strip > shows legacy Projects group and single Workspaces page heading

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'title="Workspaces"'
  - Expected
  + Received
  - title="Workspaces"
  + import Link from "next/link";
  + import {redirect} from "next/navigation";
  + import {AuthorizationError} from "@/modules/permissions/policy";
  +
  ```
- College Admin Projects legacy Workspaces and one tab strip > hides group strip on College/Admin detail routes where section strip owns navigation

  ```
  AssertionError: expected 'import { Tabs } from "@/components/ui…' to contain 'if (basePath === "/college/projects" …'
  - Expected
  + Received
  - if (basePath === "/college/projects" || basePath === "/admin/projects") return null;
  + import { Tabs } from "@/components/ui/tabs";
  + import styles from "./legacy-project-tabs.module.css";
  + import { PROJECT_ADMIN_SECTIONS } from "@/modules/projects/project-admin-navigation-model";
  +
  ```

## tests/unit/chat7-legacy-faculty-courses-copy.test.ts (1 failing)
- Faculty My Courses and course tab copy from dev legacy > uses exact My Courses heading in both normal and error states

  ```
  AssertionError: expected [ 'title="My Courses"', …(2) ] to have a length of 2 but got 3
  - Expected
  + Received
  - 2
  + 3
  ```

## tests/unit/chat7-superadmin-content-live-datetime-parity.test.ts (2 failing)
- SA-academics-people-58 live meeting IST/UTC calendar integrity > rejects unknown user-supplied zone values instead of guessing UTC

  ```
  AssertionError: expected '2099-01-01T20:30:00.000Z' to be null
  - Expected:
  null
  + Received:
  "2099-01-01T20:30:00.000Z"
  ```
- SA-academics-people-58 live meeting IST/UTC calendar integrity > rejects invalid date before calling the content PATCH endpoint and keeps the user's edit open

  ```
  AssertionError: expected 4418 to be less than -1
  ❯ tests/unit/chat7-superadmin-content-live-datetime-parity.test.ts:39:46
  37|   expect(source).toContain("parseAdminContentLocalMoment(endsAt,timeZo…
  38|   expect(source).toContain('if(!start||!end){setError("Enter a valid d…
  39|   expect(source.indexOf("if(!start||!end)")).toBeLessThan(source.index…
  |                                              ^
  40|   expect(source).toContain('className="min-h-11');
  41|   expect(source).not.toContain("min-h-10");
  ```
