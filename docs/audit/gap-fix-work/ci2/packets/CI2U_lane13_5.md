# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

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

## tests/unit/chat12-round18-grid-checkboxes.test.ts (1 failing)
- TPO-students-17 keeps grid selection limited to visible page rows and drops hidden IDs on header clear

  ```
  AssertionError: expected '"use client";\nimport {Checkbox} from…' to contain 'const visibleRowIds=rows.map(rowKey)'
  - Expected
  + Received
  - const visibleRowIds=rows.map(rowKey)
  + "use client";
  + import {Checkbox} from "@/components/ui/checkbox";
  + import {FilterChip} from "@/components/ui/filter-chip";
  + import {Button} from "@/components/ui/button";
  ```

## tests/unit/chat12-students-bulk-drive-round3.test.ts (1 failing)
- Chat-12 Add to Drive notifications and confirmation > TPO-students-14 replaces window.confirm with an accessible named dialog and keeps ineligible skips

  ```
  AssertionError: expected '"use client";\nimport {Checkbox} from…' to contain 'onClick={()=>void runGuarded(submit)}'
  - Expected
  + Received
  - onClick={()=>void runGuarded(submit)}
  + "use client";
  + import {Checkbox} from "@/components/ui/checkbox";
  + import {Textarea} from "@/components/ui/textarea";
  + import {Select} from "@/components/ui/select";
  ```

## tests/unit/chat12-tpo-students-contract.test.ts (2 failing)
- Chat-12 Students claimed-main gaps — verified source contracts > TPO-students-11 gives roster and per-student private notes a persisted editor

  ```
  AssertionError: expected '"use client";\nimport {Checkbox} from…' to contain '<TpoStudentNoteEditor membershipIds={…'
  - Expected
  + Received
  - <TpoStudentNoteEditor membershipIds={noteSelection}
  + "use client";
  + import {Checkbox} from "@/components/ui/checkbox";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import {Select} from "@/components/ui/select";
  ```
- Chat-12 Students claimed-main gaps — verified source contracts > TPO-students-38 can select pasted roll numbers

  ```
  AssertionError: expected '"use client";\nimport {Textarea} from…' to contain '<textarea'
  - Expected
  + Received
  - <textarea
  + "use client";
  + import {Textarea} from "@/components/ui/textarea";
  + import { Alert } from "@/components/ui/alert";
  + import {Button} from "@/components/ui/button";
  ```

## tests/unit/chat13-attendance-accessible-correction.test.ts (1 failing)
- Super Admin attendance correction accessibility > SA-academics-people-R05 uses in-app correction actions, not native confirm

  ```
  AssertionError: expected '"use client";\n\nimport { ADMIN_ATTEN…' to contain '<Drawer'
  - Expected
  + Received
  - <Drawer
  + "use client";
  +
  + import { ADMIN_ATTENDANCE_COPY } from "@/modules/attendance/admin-attendance-copy";
  + import {AdminAttendanceParentContactEditor} from "./admin-attendance-parent-contact-editor";
  ```

## tests/unit/chat13-module-access-lock-gap30.test.ts (1 failing)
- SA-tenants-modules-30 descendant lock and orphan correction > SA-tenants-modules-30 allows persisted descendant lock toggling and inheritance

  ```
  AssertionError: expected '"use client";\nimport {useRef,useStat…' to contain 'type="checkbox" checked={locked}'
  - Expected
  + Received
  - type="checkbox" checked={locked}
  + "use client";
  + import {useRef,useState} from "react";
  + import {useRouter} from "next/navigation";
  + import {Select} from "@/components/ui/select";
  ```
