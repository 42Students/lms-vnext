# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/UX-college-placements-jobs-jobId-overview-01.test.ts (2 failing)
- /college/placements/jobs/[jobId]/overview UX > UX-college-placements-jobs-overview-01 keeps audited user-visible behavior

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain '<StatTile key={name}'
  - Expected
  + Received
  - <StatTile key={name}
  + import Link from "next/link";
  + import { ErrorState } from "@/components/ui/error-state";
  + import { Alert } from "@/components/ui/alert";
  + import { AuthorizationError } from "@/modules/permissions/policy";
  ```
- /college/placements/jobs/[jobId]/overview UX > UX-college-placements-jobs-overview-02 keeps audited user-visible behavior

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'View hired candidates'
  - Expected
  + Received
  - View hired candidates
  + import Link from "next/link";
  + import { ErrorState } from "@/components/ui/error-state";
  + import { Alert } from "@/components/ui/alert";
  + import { AuthorizationError } from "@/modules/permissions/policy";
  ```

## tests/unit/UX-college-students-import-01.test.ts (1 failing)
- /college/students/import UX > UX-college-students-import-01 keeps audited user-visible behavior

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'min-h-11'
  - Expected
  + Received
  - min-h-11
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { hasMembershipRole } from "@/modules/identity/context";
  + import { can } from "@/modules/permissions/policy";
  ```

## tests/unit/UX-hr-invite-token-01.test.ts (1 failing)
- UX-hr-invite-token-01 legacy HR invitation > uses bounded public loading and public-safe recovery instead of a duplicate form

  ```
  AssertionError: expected 'import { PublicPageLoading } from "@/…' to contain 'min-h-dvh'
  - Expected
  + Received
  - min-h-dvh
  + import { PublicPageLoading } from "@/components/public/public-page-loading";
  +
  + export default function Loading() {
  +   return <PublicPageLoading label="Loading invitation..." />;
  ```

## tests/unit/UX-mentor-cross-touch-batch-01.test.ts (1 failing)
- UX mentor cross audit mobile target batch one > UX-mentor-cross-TCH01 links and native controls provide 44px action areas

  ```
  AssertionError: /mentor/projects/[projectId]: expected 'ml-2 font-semibold text-link underline' to contain 'min-h-11'
  Expected: "min-h-11"
  Received: "ml-2 font-semibold text-link underline"
  ```

## tests/unit/UX-superadmin-import-tables-chat17.test.ts (2 failing)
- UX-UNOWNED-TABLE-07/08 Super Admin import surfaces > student import history uses the shared mobile DataTable with intact four legacy headings

  ```
  AssertionError: expected '"use client";\n\nimport { useState } …' to contain 'aria-label="Bulk import history"'
  - Expected
  + Received
  - aria-label="Bulk import history"
  + "use client";
  +
  + import { useState } from "react";
  + import { Button } from "@/components/ui/button";
  ```
- UX-UNOWNED-TABLE-07/08 Super Admin import surfaces > faculty CSV import preserves CAS confirmation, upload bounds and per-row outcomes

  ```
  AssertionError: expected '"use client";\nimport { useRef, useSt…' to contain 'await askConfirm("Onboard "+count+" f…'
  - Expected
  + Received
  - await askConfirm("Onboard "+count+" faculty from this file?")
  + "use client";
  + import { useRef, useState } from "react";
  + import { useRouter } from "next/navigation";
  + import { parseFacultyBulkCsv } from "@/modules/people/faculty-bulk-import-model";
  ```

## tests/unit/UX-teacher-live-editor-dialog.test.ts (1 failing)
- Faculty live class authoring overlay UX > UX-teacher-live-classes-03 confirms schedule/edit/cancel in a focus-managed shared ConfirmDialog

  ```
  AssertionError: expected '"use client";\n\nimport {useRouter} f…' to contain 'facultyLiveConfirmText(action,chosen'
  - Expected
  + Received
  - facultyLiveConfirmText(action,chosen
  + "use client";
  +
  + import {useRouter} from "next/navigation";
  + import {useMemo,useState} from "react";
  ```
