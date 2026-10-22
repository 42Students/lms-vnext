# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat12-final-faculty-attendance.test.ts (1 failing)
- chat-12 final sprint faculty audit > FAC-attendance-grades-18 keeps bounded present and absent lists with duplicate checks

  ```
  AssertionError: expected 'import "server-only";\n\nimport {\n  …' to contain 'absentMembershipIds: z.array(uuid).ma…'
  - Expected
  + Received
  - absentMembershipIds: z.array(uuid).max(1000)
  + import "server-only";
  +
  + import {
  +   and,
  ```

## tests/unit/chat12-round28-learner-attention-provenance.test.ts (1 failing)
- TPO-students-31 preserves readiness evidence without fabricating unrecorded prep scores

  ```
  AssertionError: expected '"use client";\nimport {Button} from "…' to contain '"Prep %","Not recorded"'
  - Expected
  + Received
  - "Prep %","Not recorded"
  + "use client";
  + import {Button} from "@/components/ui/button";
  + import {Tabs} from "@/components/ui/tabs";
  + import {Drawer} from "@/components/ui/drawer";
  ```

## tests/unit/chat12-tpo-company-team-page-history-ssr.test.tsx (1 failing)
- UX-tpo-company-team-history-01 transparent, tenant-scoped team page states > shows an honest empty active conversation and exact company link

  ```
  AssertionError: expected '<div class="min-w-0 space-y-4"><h1>Co…' to contain '/tpo/companies/aaaaaaaa-aaaa-4aaa-8aa…'
  Expected: "/tpo/companies/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
  Received: "<div class="min-w-0 space-y-4"><h1>Company discussion · Example Employer</h1><ol aria-label="Company Team messages" class="min-w-0 divide-y divide-[var(--lms-canvas-border)]"></ol><div data-slot="alert" data-tone="info" role="status" class="flex min-w-0 max-w-full flex-col gap-[var(--lms-
  ```

## tests/unit/chat13-academic-department-guards.test.ts (3 failing)
- Super Admin department guard contracts > SA-academics-people-07 validates names and displays friendly duplicate-department messages

  ```
  AssertionError: expected '"use client";\n\nimport { useEffect, …' to contain 'payload.error === "DEPARTMENT_NAME_CO…'
  - Expected
  + Received
  - payload.error === "DEPARTMENT_NAME_CONFLICT"
  + "use client";
  +
  + import { useEffect, useRef, useState } from "react";
  + import { useGuardedAction } from "@/hooks/use-guarded-action";
  ```
- Super Admin department guard contracts > SA-academics-people-08 disables archive when dependencies are recorded or unknown

  ```
  AssertionError: expected '"use client";\n\nimport {\n  useRef,\…' to contain 'usage === null || usage === undefined'
  - Expected
  + Received
  - usage === null || usage === undefined
  + "use client";
  +
  + import {
  +   useRef,
  ```
- Super Admin department guard contracts > SA-academics-people-34 retains an actionable retry alert when an archive fails

  ```
  AssertionError: expected '"use client";\n\nimport {\n  useRef,\…' to contain 'Department was not deleted.'
  - Expected
  + Received
  - Department was not deleted.
  + "use client";
  +
  + import {
  +   useRef,
  ```

## tests/unit/chat13-company-verification.test.ts (1 failing)
- Super Admin platform company verification > SA-placements-projects-24 writes verifiedAt and verifier within the audit transaction

  ```
  AssertionError: expected 'import "server-only";\nimport {and,eq…' to contain 'Boolean(company.verifiedAt)===input.v…'
  - Expected
  + Received
  - Boolean(company.verifiedAt)===input.verified
  + import "server-only";
  + import {and,eq,sql} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  + import {placementCompanies,placementCompanyDomains} from "@/db/schema";
  ```

## tests/unit/chat13-placement-detail-graceful.test.ts (3 failing)
- Super Admin application drawer graceful actions > GR-56 external assessment links are visible and copyable if opening fails

  ```
  AssertionError: expected '"use client";\nimport {Dialog} from "…' to contain 'Copy unavailable. Select and copy the…'
  - Expected
  + Received
  - Copy unavailable. Select and copy the link shown above.
  + "use client";
  + import {Dialog} from "@/components/ui/dialog";
  + import {ConfirmDialog} from "@/components/ui/confirm-dialog";
  + import {Button} from "@/components/ui/button";
  ```
- Super Admin application drawer graceful actions > GR-91 provides a keyboard-reachable, visibly focused Refresh and Copy link action

  ```
  AssertionError: expected '"use client";\nimport {Dialog} from "…' to contain 'focus-visible:ring-2'
  - Expected
  + Received
  - focus-visible:ring-2
  + "use client";
  + import {Dialog} from "@/components/ui/dialog";
  + import {ConfirmDialog} from "@/components/ui/confirm-dialog";
  + import {Button} from "@/components/ui/button";
  ```
- Super Admin application drawer graceful actions > GR-92 uses written messages for link-copy and application errors

  ```
  AssertionError: expected '"use client";\nimport {Dialog} from "…' to contain 'Assessment link copied.'
  - Expected
  + Received
  - Assessment link copied.
  + "use client";
  + import {Dialog} from "@/components/ui/dialog";
  + import {ConfirmDialog} from "@/components/ui/confirm-dialog";
  + import {Button} from "@/components/ui/button";
  ```
