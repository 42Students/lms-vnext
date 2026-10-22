# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/PROJ-BREAK-chat9-admin-content-last-third.test.tsx (2 failing)
- Super Admin last third: Videos and Resources protected directory > SA-content-admin-01 disabled and college-only accounts do not read any college lesson or resource

  ```
  AssertionError: expected 'Videos Content access denied Your acc…' to contain 'Back to dashboard'
  Expected: "Back to dashboard"
  Received: "Videos Content access denied Your account cannot access Super Admin course content. /dashboard"
  ```
- Super Admin last third: Videos and Resources protected directory > SA-content-admin-02 directory, lesson and section failures retain validated filters without leaking errors

  ```
  AssertionError: expected 'Videos Upload a video or link a YouTu…' to contain 'Content directory unavailable'
  Expected: "Content directory unavailable"
  Received: "Videos Upload a video or link a YouTube video to a lesson. Courses /admin/courses Lessons /admin/lessons Videos /admin/videos Resources /admin/resources Live classes /admin/live-classes Class syllabus order /admin/content-order Video policy Video "watched" threshold: 90% by default. The p
  ```

## tests/unit/PROJ-BREAK-chat9-admin-verification-entry.test.tsx (3 failing)
- Super Admin last-third: verification entry security and scope > UX-admin-verification-19 expired and college-only roles see a safe denial with no selected-scope redirect

  ```
  TypeError: Cannot destructure property 'searchParams' of 'undefined' as it is undefined.
  ❯ Module.AdminVerificationEntry src/app/(authenticated)/admin/verification/page.tsx:15:55
  13|  * Do not implicitly select the first college in a global organization.
  14|  */
  15| export default async function AdminVerificationEntry({searchParams}:{s…
  |                                                       ^
  16|   const context = await getCurrentRequestContext();
  17|   if(!isSuperAdmin(context)||!can(context,"admin-scope.select"))
  ```
- Super Admin last-third: verification entry security and scope > UX-admin-verification-20 a global operator must select a college rather than inheriting a guessed default

  ```
  TypeError: Cannot destructure property 'searchParams' of 'undefined' as it is undefined.
  ❯ Module.AdminVerificationEntry src/app/(authenticated)/admin/verification/page.tsx:15:55
  13|  * Do not implicitly select the first college in a global organization.
  14|  */
  15| export default async function AdminVerificationEntry({searchParams}:{s…
  |                                                       ^
  16|   const context = await getCurrentRequestContext();
  17|   if(!isSuperAdmin(context)||!can(context,"admin-scope.select"))
  ```
- Super Admin last-third: verification entry security and scope > UX-admin-verification-21 a scoped operator navigates only to the selected college

  ```
  AssertionError: expected [Function] to throw error including 'EXPECTED_REDIRECT:/admin/colleges/222…' but got 'Cannot destructure property \'searchP…'
  Expected: "EXPECTED_REDIRECT:/admin/colleges/22222222-2222-4222-8222-222222222222/verification"
  Received: "Cannot destructure property 'searchParams' of 'undefined' as it is undefined."
  ```

## tests/unit/PROJ-BREAK-chat9-submission-kpi-consistency.test.ts (1 failing)
- IIT Dharwad Projects: dashboard counts navigate to equivalent result sets > PROJ-BREAK-reports-50 Pending and Needs-action cards target ACTIVE workspaces, not archived history

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain 'basePath+"?status=ACTIVE"'
  - Expected
  + Received
  - basePath+"?status=ACTIVE"
  + import { EmptyState } from "@/components/ui/empty-state";
  + import Link from "next/link";
  + import { safeProjectExternalHref } from "@/modules/projects/mentor-workspace-evidence-model";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```

## tests/unit/UX-admin-cross-chat-12-confirmations.test.ts (1 failing)
- UX-admin cross-audit BLOCKER native confirmations > only invokes session revocation on explicit dialog confirmation

  ```
  AssertionError: expected '"use client";\nimport {Button} from "…' to contain 'onClick={()=>setConfirmOpen(true)}'
  - Expected
  + Received
  - onClick={()=>setConfirmOpen(true)}
  + "use client";
  + import {Button} from "@/components/ui/button";
  + import {ConfirmDialog} from "@/components/ui/confirm-dialog";
  +
  ```

## tests/unit/UX-college-college-activity-01.test.ts (1 failing)
- UX-college-college-activity-01 preserves legacy copy and responsive UX contracts

  ```
  AssertionError: expected 'import { DateInput } from "@/componen…' to contain 'overflow-x-clip'
  - Expected
  + Received
  - overflow-x-clip
  + import { DateInput } from "@/components/ui/date-input";
  + import { Select } from "@/components/ui/select";
  + import { Input } from "@/components/ui/input";
  + import Link from "next/link";
  ```

## tests/unit/UX-college-college-electives-slot-id-offerings-offering-id-roster-01.test.ts (1 failing)
- UX-college-college-electives-slot-id-offerings-offering-id-roster-01 provides keyboard-scrolling wide roster with fixed identity

  ```
  AssertionError: expected 'import type { ReactNode } from "react…' to contain 'sm:first:sticky sm:first:left-0'
  - Expected
  + Received
  - sm:first:sticky sm:first:left-0
  + import type { ReactNode } from "react";
  + import Link from "next/link";
  + import { ScrollCue } from "@/components/ui/scroll-cue";
  + import { TableSelectAll } from "@/components/ui/table-select-all";
  ```
