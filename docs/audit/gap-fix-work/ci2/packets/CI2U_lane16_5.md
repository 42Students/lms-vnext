# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat12-drive-visibility-cas-undo.test.ts (1 failing)
- TPO drive override concurrency > TPO-students-12 includes server-generated override IDs and guarded per-row undo with an explicit reason

  ```
  AssertionError: expected '"use client";\nimport {Textarea} from…' to contain 'current.eligibility.override.id'
  - Expected
  + Received
  - current.eligibility.override.id
  + "use client";
  + import {Textarea} from "@/components/ui/textarea";
  + import {Select} from "@/components/ui/select";
  + import {useId,useState} from "react";
  ```

## tests/unit/chat12-round24-bulk-timed-debar.test.ts (1 failing)
- TPO timed debarment bulk guard > TPO-students-06 validates batches, duration and reason before per-learner server writes

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```

## tests/unit/chat12-tpo-calendar-ssr-scope.test.tsx (1 failing)
- UX-tpo-first-third-calendar-02 SSR scope, invalid filters and navigation > valid IST date and explicit week view preserve authorized calendar/export navigation

  ```
  AssertionError: expected '<div class="min-w-0 space-y-4"><div><…' to contain '/tpo/calendar/export'
  Expected: "/tpo/calendar/export"
  Received: "<div class="min-w-0 space-y-4"><div><p>Authorized calendar: TPO</p><p>Selected day: 2099-01-31</p><p>Selected view: week</p></div></div>"
  ```

## tests/unit/chat12-verification-round2.test.ts (1 failing)
- chat-12 verified TPO verification workflows > TPO-requests-verification-29 provides history, roll, education table, private resume and masked-number explanation

  ```
  AssertionError: expected '"use client";\nimport {apiFetch,Frien…' to contain 'Roll no.:'
  - Expected
  + Received
  - Roll no.:
  + "use client";
  + import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
  + import {useEffect,useState} from "react";
  + import {useGuardedAction} from "@/hooks/use-guarded-action";
  ```

## tests/unit/chat13-company-directory-curation.test.ts (1 failing)
- Super Admin company curation directory parity > SA-placements-projects-29 projects industry, provenance, colleges, drives, active dates and domains

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' to contain 'Drives in this college'
  - Expected
  + Received
  - Drives in this college
  + import {Button} from "@/components/ui/button";
  + import {DataTable,type DataTableColumn} from "@/components/ui/data-table";
  + import {Banner} from "@/components/ui/banner";
  + import type {AdminCompanyRow} from "@/modules/placements/admin-company-directory-model";
  ```

## tests/unit/chat13-placement-access-trace-gap31.test.ts (1 failing)
- SA-tenants-modules-31 in-page learner explanation > SA-tenants-modules-31 offers college-scoped autocomplete with an accessible closeable drawer

  ```
  AssertionError: expected '"use client";\nimport {Drawer} from "…' to contain 'title="Student module access explanat…'
  - Expected
  + Received
  - title="Student module access explanation"
  + "use client";
  + import {Drawer} from "@/components/ui/drawer";
  + import {Input} from "@/components/ui/input";
  + import {Button} from "@/components/ui/button";
  ```
