# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat4-superadmin-college-domain-page-journey.test.tsx (2 failing)
- SA-colleges-domains-page-01 verified domain admin scope > allows managing only the selected authorized college and renders an empty state without fabricated hosts

  ```
  TypeError: Cannot read properties of null (reading 'ready')
  ❯ Module.CollegeWebAddressContent src/app/(authenticated)/admin/colleges/[collegeId]/subdomain/page.tsx:76:65
  74|      <p className="my-3 max-w-3xl text-sm text-body">
  75|        The address students and staff open to sign in.
  76|        {managedResult.status==="fulfilled"&&managedResult.value.ready?
  |                                                                 ^
  77|         " It works straight away, with HTTPS, as soon as you allot it.…
  78|         " Allotment becomes available after the platform wildcard DNS …
  ```
- SA-colleges-domains-page-01 verified domain admin scope > passes persisted tenant domain facts and host ownership to the manager

  ```
  TypeError: Cannot read properties of null (reading 'ready')
  ❯ Module.CollegeWebAddressContent src/app/(authenticated)/admin/colleges/[collegeId]/subdomain/page.tsx:76:65
  74|      <p className="my-3 max-w-3xl text-sm text-body">
  75|        The address students and staff open to sign in.
  76|        {managedResult.status==="fulfilled"&&managedResult.value.ready?
  |                                                                 ^
  77|         " It works straight away, with HTTPS, as soon as you allot it.…
  78|         " Allotment becomes available after the platform wildcard DNS …
  ```

## tests/unit/chat6-admin-second-third-drives-page.test.ts (4 failing)
- Super Admin drives: page-level behavior, denial and friendly recovery > CHAT6-ADMIN-DRIVES-PAGE-01 refuses to fetch tenant data without a selected college

  ```
  AssertionError: expected '<div class="min-w-0 space-y-4"><heade…' to contain 'Choose a college'
  Expected: "Choose a college"
  Received: "<div class="min-w-0 space-y-4"><header data-slot="page-header" class="mb-2 flex w-full min-w-0 flex-col items-stretch gap-2 border-b border-[var(--lms-canvas-border)] pb-4 md:mb-4 md:flex-row md:items-start md:justify-between md:gap-6 [--lms-page-header-title-size:20px] md:[--lms-page-hea
  ```
- Super Admin drives: page-level behavior, denial and friendly recovery > CHAT6-ADMIN-DRIVES-PAGE-04 passes only authenticated college and displays visible results/actions

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
- Super Admin drives: page-level behavior, denial and friendly recovery > CHAT6-ADMIN-DRIVES-PAGE-05 preserves validated filters and hides backend errors on an outage

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
- Super Admin drives: page-level behavior, denial and friendly recovery > CHAT6-ADMIN-DRIVES-PAGE-06 shows a distinct role-revocation denial instead of retrying private data

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

## tests/unit/chat6-faculty-assignment-role-cas-101.test.ts (2 failing)
- SA-academics-people-101 teaching role concurrency > retains exact scope, row locks, active membership and primary-teacher uniqueness in the same transaction

  ```
  AssertionError: expected 'export async function changeCourseTea…' to contain 'if(locked.role===role)return locked'
  - Expected
  + Received
  - if(locked.role===role)return locked
  + export async function changeCourseTeachingAssignmentRole(
  +   context: RequestContext,
  +   assignmentIdInput: string,
  +   roleInput: unknown,
  ```
- SA-academics-people-101 teaching role concurrency > passes only the persisted version from directory into a single guarded UI PATCH

  ```
  AssertionError: expected 'import {and,eq,isNull,sql} from "driz…' to contain 'role&&row.revision?'
  - Expected
  + Received
  - role&&row.revision?
  + import {and,eq,isNull,sql} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  + import {courseTeachingAssignments,courseSectionDeliveries,courseOfferings,courses,departments} from "@/db/schema";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  ```

## tests/unit/chat6-superadmin-course-pagination-54.test.ts (1 failing)
- Super Admin Courses bounded page size > SA-academics-people-54 wires bounded UI page size and Refresh into the Super Admin page

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'pageSize:query.pageSize'
  - Expected
  + Received
  - pageSize:query.pageSize
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {listSuperAdminGlobalCourses} from "@/modules/courses/super-admin-global-course-directory";
  + import { AdminCourseOverview } from "@/components/courses/admin-course-overview";
  ```

## tests/unit/chat6-unconfirmed-decisions-round13.test.ts (1 failing)
- chat-6 verified UNCONFIRMED decisions (18) > SA-placements-projects-68 keeps workspace tab navigation on the readiness route

  ```
  AssertionError: expected 'import { MetricBar } from "@/componen…' to contain 'aria-label="Workspace sections"'
  - Expected
  + Received
  - aria-label="Workspace sections"
  + import { MetricBar } from "@/components/ui/metric-bar";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {requireProjectManageAccess} from "@/modules/projects/access";
  + import {getProjectReadiness} from "@/modules/projects/readiness-service";
  ```

## tests/unit/chat7-learner-discussion-scope-and-race.test.ts (2 failing)
- COURSES7-11 Learner discussion access and response isolation > COURSES7-11 guards repeated submit events and whitespace-only messages

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```
- COURSES7-11 Learner discussion access and response isolation > COURSES7-11 enforces the same finite message length used for all persisted writers

  ```
  AssertionError: expected 4000 to be 3900 // Object.is equality
  - Expected
  + Received
  - 3900
  + 4000
  ```

## tests/unit/chat7-round3-mentor-execution.test.ts (1 failing)
- chat-7 round 3 mentor execution controls > MEN-projects-meetings-38 mentor-visible release/sprint vocabulary and empty state

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain 'No sprints yet. Add the sprints'
  - Expected
  + Received
  - No sprints yet. Add the sprints
  + import { EmptyState } from "@/components/ui/empty-state";
  + import Link from "next/link";
  + import { Tabs } from "@/components/ui/tabs";
  + import { Disclosure } from "@/components/ui/disclosure";
  ```

## tests/unit/chat9-calendar-adaptive-draft.test.ts (2 failing)
- TPO calendar adaptive and draft safety > TPO-calendar-reports-21 keeps unfinished lead notes across accidental navigation prompts

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'onClick={cancelDraft}'
  - Expected
  + Received
  - onClick={cancelDraft}
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { Alert } from "@/components/ui/alert";
  + import { InlineNotice } from "@/components/ui/inline-notice";
  ```
- TPO calendar adaptive and draft safety > TPO-calendar-reports-25 supports keyboard day-hour creation and escape to dismiss the modal

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'role="dialog"'
  - Expected
  + Received
  - role="dialog"
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { Alert } from "@/components/ui/alert";
  + import { InlineNotice } from "@/components/ui/inline-notice";
  ```
