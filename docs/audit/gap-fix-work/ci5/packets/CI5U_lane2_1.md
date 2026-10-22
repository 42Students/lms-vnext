# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/HR-BREAK-chat15-calendar-page-85.test.tsx (2 failing)
- HR-CALENDAR-PAGE-85: recruiter role, malformed query and safe empty schedule > duplicate filter keys reject before reading private schedules

  ```
  AssertionError: expected '  Calendar    Invalid calendar filter…' to contain 'Clear filters'
  Expected: "Clear filters"
  Received: "  Calendar    Invalid calendar filters Review the selected date, view and event filters.   "
  ```
- HR-CALENDAR-PAGE-85: recruiter role, malformed query and safe empty schedule > authorized empty week shows zero event counts without inventing an interview or result

  ```
  AssertionError: expected "vi.fn()" to be called with arguments: [ { user: { …(4) }, …(2) }, …(1) ]
  Received:
  1st vi.fn() call:
  @@ -22,10 +22,11 @@
  "identityUid": "uid",
  "platformStatus": "ACTIVE",
  "systemRoles": [],
  },
  ```

## tests/unit/PROJ-BREAK-chat9-admin-csv-security.test.ts (2 failing)
- IIT Dharwad Projects admin exports: spreadsheet injection resilience > PROJ-BREAK-exports-17 college template catalogue rejects Unicode-mark hidden formulas

  ```
  AssertionError: expected 'import {projectAdminCsv} from "./proj…' to contain 'return projectAdminCsv(lines)'
  - Expected
  + Received
  - return projectAdminCsv(lines)
  + import {projectAdminCsv} from "./project-admin-csv-model";
  + /** COL-projects-16: safe projections for the college template catalogue. */
  + export type TemplateSectionCounts = {
  +   overview: number;
  ```
- IIT Dharwad Projects admin exports: spreadsheet injection resilience > PROJ-BREAK-exports-12/13/14/15 all six client exports use the tested sanitizer

  ```
  AssertionError: project-workspace-page-export.tsx: expected '"use client";\nimport { Button } from…' to contain 'from "@/modules/projects/project-admi…'
  - Expected
  + Received
  - from "@/modules/projects/project-admin-csv-model"
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import {useState} from "react";
  + import {projectWorkspacePageCsv} from "@/modules/projects/admin-workspace-page-export-model";
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

## tests/unit/UX-college-college-hiring-dashboard-01.test.ts (1 failing)
- UX-college-college-hiring-dashboard-01 keeps accessible shared screen state

  ```
  AssertionError: expected 'import { Alert } from "@/components/u…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { Alert } from "@/components/ui/alert";
  + import { AuthorizationError } from "@/modules/permissions/policy";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { hasMembershipRole } from "@/modules/identity/context";
  ```

## tests/unit/UX-projects-shared-overlays-02.test.ts (1 failing)
- UX-projects-shared-overlays-02 guarded action/confirmation paths > project-archive-control keeps archive/restore actions distinct

  ```
  AssertionError: expected '"use client";\nimport {useEffect,useR…' to contain 'onOpenChange={setOpen}'
  - Expected
  + Received
  - onOpenChange={setOpen}
  + "use client";
  + import {useEffect,useRef,useState} from "react";
  + import {useRouter} from "next/navigation";
  + import {Button} from "@/components/ui/button";
  ```

## tests/unit/UX-tracker-audit-findings-01.test.ts (1 failing)
- UX-tracker-audit-findings-01 > preserves canonical route, scoped data and the audited mobile/action states

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain 'focus-visible:outline-2'
  - Expected
  + Received
  - focus-visible:outline-2
  + import { EmptyState } from "@/components/ui/empty-state";
  + import { Banner } from "@/components/ui/banner";
  + import Link from "next/link";
  + import {Button} from "@/components/ui/button";
  ```

## tests/unit/chat11-tpo-team-preferences-guard-and-retries.test.ts (1 failing)
- TPO-settings-audit-PREF-TEAM-01 tenant-safe personal team preferences > rebuilds persisted active TPO or College Admin team role inside both read and write transactions

  ```
  AssertionError: expected 'import {hasPlacementTeamMembership} f…' to contain 'if(!changed)return {following,muted:!…'
  - Expected
  + Received
  - if(!changed)return {following,muted:!!mutedAt}
  + import {hasPlacementTeamMembership} from "./placement-team-access-model";
  + import {planTpoThreadPreferenceChange,tpoTeamPreferenceActionSchema} from "./tpo-team-preference-state-model";
  + export {tpoTeamPreferenceActionSchema} from "./tpo-team-preference-state-model";
  + import "server-only";
  ```

## tests/unit/chat12-verification-reasons-round3.test.ts (1 failing)
- chat-12 Verification legacy send-back reason selector > TPO-requests-verification-27 permits a custom-only reason but prevents an empty send-back

  ```
  AssertionError: expected '"use client";\nimport {apiFetch,Frien…' to contain 'The student sees your reason and fixe…'
  - Expected
  + Received
  - The student sees your reason and fixes it on their profile.
  + "use client";
  + import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
  + import {useEffect,useState} from "react";
  + import {useGuardedAction} from "@/hooks/use-guarded-action";
  ```
