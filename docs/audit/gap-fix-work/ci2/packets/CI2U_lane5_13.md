# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/tenant-domain-validation.test.ts (1 failing)
- tenant-domain validation > normalizes configured DNS hosts deterministically

  ```
  AssertionError: expected { …(3) } to deeply equal { …(2) }
  - Expected
  + Received
  {
  "collegeId": "11111111-1111-4111-8111-111111111111",
  "host": "portal.example.edu",
  +   "isPrimary": false,
  }
  ```

## tests/unit/tpo-drive-day-checkin-model.test.ts (1 failing)
- TPO confirmed Drive Day attendance > accepts only a confirmed check-in or no-show without forged college

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```

## tests/unit/tpo-inbox-team-copy.test.ts (1 failing)
- TPO Messages copy parity > TPO-inbox-team-10 uses the exact legacy Messages subtitle without developer status jargon

  ```
  AssertionError: expected 'import { TpoTeamMessagesDirectory } f…' to contain 'Keep recruiter conversations tied to …'
  - Expected
  + Received
  - Keep recruiter conversations tied to the right drive and follow up without leaving the placement workspace.
  + import { TpoTeamMessagesDirectory } from "@/components/tpo/tpo-team-messages-directory";
  + import Link from "next/link";
  + import {TpoRecruiterMessageReply} from "@/components/tpo/tpo-recruiter-message-reply";
  + import {getTpoRecruiterThreadDetail} from "@/modules/placements/tpo-recruiter-thread-detail-service";
  ```

## tests/unit/tpo-students-empty-grid-recovery.test.ts (1 failing)
- TPO Students empty roster spreadsheet recovery > shows the existing first-page action and keeps grid-column/filter controls present

  ```
  AssertionError: expected '"use client";\nimport {Checkbox} from…' to contain '<TpoGridFilterPanel fields={filters} …'
  - Expected
  + Received
  - <TpoGridFilterPanel fields={filters} mobileSheet/>
  + "use client";
  + import {Checkbox} from "@/components/ui/checkbox";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import {Select} from "@/components/ui/select";
  ```

## tests/unit/ux-admin-chat9-batch-04.test.ts (5 failing)
- chat-9 last-third admin UX rollout, batch 04 > UX-admin-settings-auth-01 preserves shared UX and scoped route behavior

  ```
  AssertionError: expected 'import { PageBackLink } from "@/compo…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { PageBackLink } from "@/components/ui/page-back-link";
  + import Link from "next/link";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {PageHeader} from "@/components/ui/page-header";
  ```
- chat-9 last-third admin UX rollout, batch 04 > UX-admin-students-01 preserves shared UX and scoped route behavior

  ```
  AssertionError: expected 'import {getCurrentRequestContext} fro…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {isSuperAdmin} from "@/modules/identity/context";
  + import {PageHeader} from "@/components/ui/page-header";
  + import {PageBackLink} from "@/components/ui/page-back-link";
  ```
- chat-9 last-third admin UX rollout, batch 04 > UX-admin-tenants-01 preserves shared UX and scoped route behavior

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import Link from "next/link";
  + import { TenantDirectoryCsvControl } from "@/components/admin/tenant-directory-csv-control";
  + import { tenantDirectoryExportHref } from "@/modules/colleges/admin-tenant-export-model";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```
- chat-9 last-third admin UX rollout, batch 04 > UX-admin-tenants-create-01 preserves shared UX and scoped route behavior

  ```
  AssertionError: expected 'import { PageBackLink } from "@/compo…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { PageBackLink } from "@/components/ui/page-back-link";
  + import Link from "next/link";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {can} from "@/modules/permissions/policy";
  ```
- chat-9 last-third admin UX rollout, batch 04 > UX-admin-tenants-setup-01 preserves shared UX and scoped route behavior

  ```
  AssertionError: expected 'import {PageBackLink} from "@/compone…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import {PageBackLink} from "@/components/ui/page-back-link";
  + import Link from "next/link";
  + import {notFound} from "next/navigation";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  ```

## tests/unit/ux-learn-chat7-batch-01.test.ts (7 failing)
- UX learner route batch 1 > UX-learn-learn-01 maintains source and route boundaries

  ```
  Error: ENOENT: no such file or directory, open '/home/runner/work/lms-vnext/lms-vnext/src/app/(authenticated)/learn/page.tsx'
  ❯ read tests/unit/ux-learn-chat7-batch-01.test.ts:3:27
  1| import {describe,it,expect} from "vitest";
  2| import {readFileSync} from "node:fs";
  3| const read=(path:string)=>readFileSync(new URL("../../"+path,import.me…
  |                           ^
  4| describe("UX learner route batch 1",()=>{
  5| it("UX-learn-learn-01 maintains source and route boundaries",()=>{
  ```
- UX learner route batch 1 > UX-learn-learn-allAssignments-assignmentId-01 maintains source and route boundaries

  ```
  AssertionError: expected 'import { Button } from "@/components/…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { Button } from "@/components/ui/button";
  + import { assignmentFilesRuntimeEnabled } from "@/modules/courses/assignment-file-readiness";
  + import Link from "next/link";
  + import { learnerAssignmentPublishedGradeLabel } from "@/modules/courses/learner-assignment-grade-label-model";
  ```
- UX learner route batch 1 > UX-learn-learn-allQuizzes-01 maintains source and route boundaries

  ```
  AssertionError: expected 'import { getCurrentRequestContext } f…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {
  +   LearnerAssessmentOverview,
  +   type LearnerQuizOverviewItem,
  ```
- UX learner route batch 1 > UX-learn-learn-allQuizzes-quizId-01 maintains source and route boundaries

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import Link from "next/link";
  + import { notFound } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { PageHeader } from "@/components/ui/page-header";
  ```
- UX learner route batch 1 > UX-learn-learn-attendance-01 maintains source and route boundaries

  ```
  AssertionError: expected 'import { Suspense } from "react";\nim…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { Suspense } from "react";
  + import { z } from "zod";
  + import { ErrorState } from "@/components/ui/error-state";
  + import { AuthorizationError } from "@/modules/permissions/policy";
  ```
- UX learner route batch 1 > UX-learn-learn-attendance-calendar-01 maintains source and route boundaries

  ```
  AssertionError: expected 'import { FilterBar } from "@/componen…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { FilterBar } from "@/components/ui/filter-bar";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { SummaryStrip } from "@/components/ui/summary-strip";
  + import { Button } from "@/components/ui/button";
  ```
- UX learner route batch 1 > UX-learn-learn-calendar-01 maintains source and route boundaries

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import Link from "next/link";
  + import { notFound } from "next/navigation";
  + import { resolveOwnLearnerCalendarFilters } from "@/modules/academics/learner-calendar-filter-model";
  + import {learnerCalendarQuerySchema} from "@/modules/academics/learner-calendar-filter-model";
  ```
