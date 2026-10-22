# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/PROJ-BREAK-chat9-admin-semesters-role-outage.test.tsx (1 failing)
- Super Admin last-third /admin/semesters security and resilience > UX-admin-semesters-13 missing selected college gives a safe next step without data reads

  ```
  AssertionError: expected 'Semesters Select a College to manage …' to contain 'Select a college to continue'
  Expected: "Select a college to continue"
  Received: "Semesters Select a College to manage Semesters. Choose Organization and College in the header first."
  ```

## tests/unit/PROJ-BREAK-chat9-sa-student-lookup-tenant.test.ts (1 failing)
- Super Admin last-third student lookup: tenant-safe application joins > SA-placements-student-lookup-07 overly long/short searches fail before authorization and query

  ```
  AssertionError: promise resolved "{ students: [ { …(8) } ], …(1) }" instead of rejecting
  - Expected
  + Received
  - Error {
  -   "message": "rejected promise",
  + {
  +   "students": [
  +     {
  ```

## tests/unit/UX-SPILL-chat19-tpo-round-drive-day-responsive.test.tsx (2 failing)
- UX-SPILL-TPO-ROUND-01: responsive IIT Dharwad roster keeps critical operator actions > shows candidate identity and both check-in/result actions on mobile cards and desktop columns

  ```
  
  ```
- UX-SPILL-TPO-ROUND-01: responsive IIT Dharwad roster keeps critical operator actions > preserves a clear empty roster without fabricating an applicant or stage result

  ```
  Error: invariant expected app router to be mounted
  ❯ useRouter node_modules/next/src/client/components/navigation.ts:169:11
  ❯ TpoRoundDriveDayReadOnly src/components/placements/tpo-round-drive-day-read-only.tsx:94:16
  92| }) {
  93|   const destinations=tpoDriveDayRoundLinks(data.job.id,data.round.id);
  94|   const router=useRouter();
  |                ^
  95|   const locked=["CANCELLED","COMPLETED"].includes(data.round.status);
  ```

## tests/unit/UX-chat7-learner-scroll-motion-01.test.ts (2 failing)
- UX-chat7-learner-scroll-motion-01 hidden scrollbar resilience > names keyboard-operable Board lanes and explains horizontal scroll on phones

  ```
  AssertionError: expected '"use client";\nimport { Badge } from …' to contain 'overscroll-x-contain'
  - Expected
  + Received
  - overscroll-x-contain
  + "use client";
  + import { Badge } from "@/components/ui/badge";
  + import { Alert } from "@/components/ui/alert";
  + import { EmptyState } from "@/components/ui/empty-state";
  ```
- UX-chat7-learner-scroll-motion-01 hidden scrollbar resilience > keeps both Semester course and credits lists operable without visible scrollbars

  ```
  AssertionError: expected '"use client";\n\nimport { MetricBar }…' to contain 'Scroll inside the list for the full c…'
  - Expected
  + Received
  - Scroll inside the list for the full credits breakdown.
  + "use client";
  +
  + import { MetricBar } from "@/components/ui/metric-bar";
  + import progressStyles from "./learner-course-progress.module.css";
  ```

## tests/unit/UX-college-college-course-progress-01.test.ts (1 failing)
- UX-college-college-course-progress-01 verifies scoped responsive details

  ```
  AssertionError: expected 'import {CollegeProgressCapture} from …' to contain 'overflow-x-clip'
  - Expected
  + Received
  - overflow-x-clip
  + import {CollegeProgressCapture} from "@/components/courses/college-progress-last-good";
  + import { CollegeCourseMissingScope } from "@/components/courses/college-course-missing-scope";
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```

## tests/unit/UX-college-cross-audit-chat19.test.ts (43 failing)
- College cross-audit fixes (independent chat-19) > COL-XA-01 people/manage exposes keyboard focus and contrast-safe link text

  ```
  AssertionError: people/manage: expected 'import { Select } from "@/components/…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { Select } from "@/components/ui/select";
  + import { Input } from "@/components/ui/input";
  + import { Button } from "@/components/ui/button";
  + import { StatTile } from "@/components/ui/stat-tile";
  ```
- College cross-audit fixes (independent chat-19) > COL-XA-01 placements exposes keyboard focus and contrast-safe link text

  ```
  AssertionError: placements: expected 'import Link from "next/link";\nimport…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import Link from "next/link";
  + import { redirect } from "next/navigation";
  + import {EmptyState} from "@/components/ui/empty-state";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```
- College cross-audit fixes (independent chat-19) > COL-XA-01 placements/drives exposes keyboard focus and contrast-safe link text

  ```
  AssertionError: placements/drives: expected 'import { DateInput } from "@/componen…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { DateInput } from "@/components/ui/date-input";
  + import { Select } from "@/components/ui/select";
  + import Link from "next/link";
  + import { redirect } from "next/navigation";
  ```
- College cross-audit fixes (independent chat-19) > COL-XA-01 placements/interviews exposes keyboard focus and contrast-safe link text

  ```
  AssertionError: placements/interviews: expected 'import { Input } from "@/components/u…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { Input } from "@/components/ui/input";
  + import { Button } from "@/components/ui/button";
  + import { Select } from "@/components/ui/select";
  + import Link from "next/link";
  ```
- College cross-audit fixes (independent chat-19) > COL-XA-01 placements/jobs/[jobId]/applications exposes keyboard focus and contrast-safe link text

  ```
  AssertionError: placements/jobs/[jobId]/applications: expected 'import {CollegeDriveApplicationsSizeC…' to contain 'text-[var(--lms-teal-deep)]'
  - Expected
  + Received
  - text-[var(--lms-teal-deep)]
  + import {CollegeDriveApplicationsSizeControl} from "@/components/placements/college-drive-applications-size-control";
  + import { CollegeDriveApplicationsExport } from "@/components/college/college-drive-applications-export";
  + import Link from "next/link";
  + import { z } from "zod";
  ```
- College cross-audit fixes (independent chat-19) > COL-XA-01 placements/jobs/[jobId]/shortlisted exposes keyboard focus and contrast-safe link text

  ```
  AssertionError: placements/jobs/[jobId]/shortlisted: expected 'import Link from "next/link";\nimport…' to contain 'focus-visible:outline-2'
  - Expected
  + Received
  - focus-visible:outline-2
  + import Link from "next/link";
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { hasMembershipRole } from "@/modules/identity/context";
  ```
- College cross-audit fixes (independent chat-19) > COL-XA-01 placements/retention exposes keyboard focus and contrast-safe link text

  ```
  AssertionError: placements/retention: expected 'import Link from "next/link";\nimport…' to contain 'text-[var(--lms-teal-deep)]'
  - Expected
  + Received
  - text-[var(--lms-teal-deep)]
  + import Link from "next/link";
  + import {z} from "zod";
  + import {Input} from "@/components/ui/input";
  + import {Button} from "@/components/ui/button";
  ```
- College cross-audit fixes (independent chat-19) > COL-XA-01 placements/student-lookup exposes keyboard focus and contrast-safe link text

  ```
  AssertionError: placements/student-lookup: expected 'import Link from "next/link";\nimport…' to contain 'text-[var(--lms-teal-deep)]'
  - Expected
  + Received
  - text-[var(--lms-teal-deep)]
  + import Link from "next/link";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {PageHeader} from "@/components/ui/page-header";
  + import {DataTable, type DataTableColumn} from "@/components/ui/data-table";
  ```
- College cross-audit fixes (independent chat-19) > COL-XA-01 projects exposes keyboard focus and contrast-safe link text

  ```
  AssertionError: projects: expected 'import Link from "next/link";\nimport…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import Link from "next/link";
  + import {redirect} from "next/navigation";
  + import {AuthorizationError} from "@/modules/permissions/policy";
  +
  ```
- College cross-audit fixes (independent chat-19) > COL-XA-01 projects/templates exposes keyboard focus and contrast-safe link text

  ```
  AssertionError: projects/templates: expected 'import Link from "next/link";\nimport…' to contain 'focus-visible:outline-2'
  - Expected
  + Received
  - focus-visible:outline-2
  + import Link from "next/link";
  + import {redirect} from "next/navigation";
  + import {AuthorizationError} from "@/modules/permissions/policy";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  ```
- … 33 more in this file
