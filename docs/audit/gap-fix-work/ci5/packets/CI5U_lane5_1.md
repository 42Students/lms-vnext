# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/HR-BREAK-chat15-recruiter-change-requests-page-68.test.tsx (1 failing)
- HR-RECRUITER-PAGE-68: scoped drive change-request page > authorized employer gets a populated component without changing party or acting identity

  ```
  TypeError: Converting circular structure to JSON
  --> starting at object with constructor 'Object'
  --- property 'default' closes the circle
  ```

## tests/unit/PROJ-BREAK-chat9-admin-scope-pages.test.tsx (1 failing)
- IIT Dharwad Super Admin last-third Project route authorization > PROJ-BREAK-admin-idor-30 all four admin queues reject college-only and disabled actors before scope or data lookup

  ```
  AssertionError: At Risk: expected 'At Risk Project access denied Your ac…' to contain 'Back to dashboard'
  Expected: "Back to dashboard"
  Received: "At Risk Project access denied Your account cannot access Super Admin project workspaces. /dashboard"
  ```

## tests/unit/UX-admin-cross-chat-12-child-controls.test.ts (1 failing)
- UX-admin first-third delegated child controls > preserves contrast and touch-safe sign-in preview

  ```
  AssertionError: expected '"use client";\n\nimport { useEffect, …' to contain 'mt-3 flex min-h-11'
  - Expected
  + Received
  - mt-3 flex min-h-11
  + "use client";
  +
  + import { useEffect, useRef, useState, useTransition } from "react";
  + import { Button } from "@/components/ui/button";
  ```

## tests/unit/UX-college-overlays-01.test.ts (7 failing)
- UX-college-overlays-01 college dialog behavior > college-faculty-reassign-action delegates accessible modal focus/Escape/backdrop to shared Dialog

  ```
  
  ```
- UX-college-overlays-01 college dialog behavior > college-faculty-schedule-reassign delegates accessible modal focus/Escape/backdrop to shared Dialog

  ```
  
  ```
- UX-college-overlays-01 college dialog behavior > college-offering-metadata-action delegates accessible modal focus/Escape/backdrop to shared Dialog

  ```
  
  ```
- UX-college-overlays-01 college dialog behavior > college-person-audit-modal delegates accessible modal focus/Escape/backdrop to shared Dialog

  ```
  
  ```
- UX-college-overlays-01 college dialog behavior > college-person-edit-action delegates accessible modal focus/Escape/backdrop to shared Dialog

  ```
  
  ```
- UX-college-overlays-01 college dialog behavior > college-person-profile-overview-modal delegates accessible modal focus/Escape/backdrop to shared Dialog

  ```
  
  ```
- UX-college-overlays-01 college dialog behavior > college-student-import-history delegates accessible modal focus/Escape/backdrop to shared Dialog

  ```
  AssertionError: expected '"use client";\n\nimport { useId, useR…' to contain 'opener.current?.focus()'
  - Expected
  + Received
  - opener.current?.focus()
  + "use client";
  +
  + import { useId, useRef, type ReactNode, type CSSProperties } from "react";
  + import { Button } from "@/components/ui/button";
  ```

## tests/unit/UX-teacher-live-editor-dialog.test.ts (1 failing)
- Faculty live class authoring overlay UX > UX-teacher-live-classes-03 confirms schedule/edit/cancel in a focus-managed shared ConfirmDialog

  ```
  AssertionError: expected '"use client";\n\nimport {useRouter} f…' to contain 'onConfirm={()=>void save(true)}'
  - Expected
  + Received
  - onConfirm={()=>void save(true)}
  + "use client";
  +
  + import {useRouter} from "next/navigation";
  + import {useMemo,useState} from "react";
  ```

## tests/unit/UX-tracker-shared-nav-02.test.ts (1 failing)
- UX-tracker-shared-nav-02 > announces the active page and supports focus/touch navigation without changing tracker wording

  ```
  AssertionError: expected '"use client";\n\nimport { Button } fr…' to contain 'min-h-11'
  - Expected
  + Received
  - min-h-11
  + "use client";
  +
  + import { Button } from "@/components/ui/button";
  + import { useEffect, useState } from "react";
  ```

## tests/unit/chat12-admin-first-third-cross-audit.test.ts (3 failing)
- UX-admin-first-third-chat12 independent source cross-audit > UX-admin-academics-01 requires explicit selected-college safety scope

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'title="Select a college scope"'
  - Expected
  + Received
  - title="Select a college scope"
  + import Link from "next/link";
  + import { redirect } from "next/navigation";
  + import { isSuperAdmin } from "@/modules/identity/context";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```
- UX-admin-first-third-chat12 independent source cross-audit > UX-admin-colleges-01 validates filters before source queries and retains mobile actions

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' to contain 'parseAdminDirectorySearchParams(await…'
  - Expected
  + Received
  - parseAdminDirectorySearchParams(await searchParams)
  + import {Button} from "@/components/ui/button";
  + import {inArray,sql} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  + import {collegeMemberships} from "@/db/schema";
  ```
- UX-admin-first-third-chat12 independent source cross-audit > UX-admin-companies-01 errors on malformed filters before directory lookup and labels safety scope

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' to contain 'adminCompaniesQuerySchema.safeParse'
  - Expected
  + Received
  - adminCompaniesQuerySchema.safeParse
  + import {Button} from "@/components/ui/button";
  + import {DataTable,type DataTableColumn} from "@/components/ui/data-table";
  + import {Banner} from "@/components/ui/banner";
  + import type {AdminCompanyRow} from "@/modules/placements/admin-company-directory-model";
  ```

## tests/unit/chat13-academic-page-copy.test.ts (1 failing)
- Super Admin Academic Setup page copy > SA-academics-people-02 shows the legacy no-college guidance without exposing the six-step strip

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' to contain 'data ? <AcademicSetupSteps'
  - Expected
  + Received
  - data ? <AcademicSetupSteps
  + import {Button} from "@/components/ui/button";
  + import {Select} from "@/components/ui/select";
  + import {Input} from "@/components/ui/input";
  + import { AcademicSetupSteps } from "@/components/admin/academic-setup-steps";
  ```
