# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/ux-admin-chat6-middle-third.test.ts (17 failing)
- UX /admin middle third route and shared archetype contracts > UX-admin-module-access-01 /admin route /admin/module-access preserves its scoped page and legacy UI surface

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'No matching colleges'
  - Expected
  + Received
  - No matching colleges
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Banner } from "@/components/ui/banner";
  ```
- UX /admin middle third route and shared archetype contracts > UX-admin-organizations-01 /admin route /admin/organizations preserves its scoped page and legacy UI surface

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'No organizations in this scope'
  - Expected
  + Received
  - No organizations in this scope
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { OrganizationActions } from "@/components/admin/organization-actions";
  + import {TenantRestoreAction} from "@/components/admin/tenant-restore-action";
  ```
- UX /admin middle third route and shared archetype contracts > UX-admin-people-directory-01 /admin route /admin/people/directory preserves its scoped page and legacy UI surface

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'No matching users'
  - Expected
  + Received
  - No matching users
  + import Link from "next/link";
  + import { SuperAdminPeopleCsvControl } from "@/components/admin/super-admin-people-csv-control";
  + import { superAdminPeopleExportHref } from "@/modules/people/admin-users-export-model";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```
- UX /admin middle third route and shared archetype contracts > UX-admin-placements-calendar-01 /admin route /admin/placements/calendar preserves its scoped page and legacy UI surface

  ```
  AssertionError: expected 'import { getCurrentRequestContext } f…' to contain 'Select a college scope'
  - Expected
  + Received
  - Select a college scope
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {requireSuperAdminSelectedCollege} from "@/modules/admin-ui/super-admin-selected-college";
  + import { PlacementCalendarWorkspace } from "@/components/placements/placement-calendar-workspace";
  + import { Alert } from "@/components/ui/alert";
  ```
- UX /admin middle third route and shared archetype contracts > UX-admin-placements-drives-01 /admin route /admin/placements/drives preserves its scoped page and legacy UI surface

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'caption="All drives"'
  2026-10-22T07:23:05.9200032Z - Expected
  + Received
  - caption="All drives"
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {requireSuperAdminSelectedCollege} from "@/modules/admin-ui/super-admin-selected-college";
  + import { AuthorizationError } from "@/modules/permissions/policy";
  ```
- UX /admin middle third route and shared archetype contracts > UX-admin-placements-hiring-01 /admin route /admin/placements/hiring preserves its scoped page and legacy UI surface

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'AdminScopedReadPage'
  - Expected
  + Received
  - AdminScopedReadPage
  + import { redirect } from "next/navigation";
  + /** Legacy Hiring Dashboard address. The scoped report with KPI, funnel and
  +  * company sections is the Analytics page; do not treat job-count list as the
  +  * original dashboard or synthesize three incompatible legacy API responses. */
  ```
- UX /admin middle third route and shared archetype contracts > UX-admin-placements-interviews-01 /admin route /admin/placements/interviews preserves its scoped page and legacy UI surface

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'AdminScopedReadPage'
  - Expected
  + Received
  - AdminScopedReadPage
  + import Link from "next/link";
  + import {and,eq,inArray,sql} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  + import {
  ```
- UX /admin middle third route and shared archetype contracts > UX-admin-placements-jobs-jobId-01 /admin route /admin/placements/jobs/[jobId] preserves its scoped page and legacy UI surface

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain 'SuperAdminDriveTabs'
  - Expected
  + Received
  - SuperAdminDriveTabs
  + import { EmptyState } from "@/components/ui/empty-state";
  + import Link from "next/link";
  + import { Banner } from "@/components/ui/banner";
  + import { ErrorState } from "@/components/ui/error-state";
  ```
- UX /admin middle third route and shared archetype contracts > UX-admin-placements-jobs-jobId-applications-01 /admin route /admin/placements/jobs/[jobId]/applications preserves its scoped page and legacy UI surface

  ```
  AssertionError: expected 'import {CollegeDriveApplicationsSizeC…' to contain 'title={"Applications · "'
  - Expected
  + Received
  - title={"Applications · "
  + import {CollegeDriveApplicationsSizeControl} from "@/components/placements/college-drive-applications-size-control";
  + import Link from "next/link";
  + import { EmptyState } from "@/components/ui/empty-state";
  + import { getPlacementJobLegacyDetail } from "@/modules/placements/job-service";
  ```
- UX /admin middle third route and shared archetype contracts > UX-admin-placements-jobs-jobId-settings-01 /admin route /admin/placements/jobs/[jobId]/settings preserves its scoped page and legacy UI surface

  ```
  AssertionError: expected 'import {SuperAdminDriveDeadline} from…' to contain 'SuperAdminDriveTabs'
  - Expected
  + Received
  - SuperAdminDriveTabs
  + import {SuperAdminDriveDeadline} from "@/components/placements/super-admin-drive-deadline";
  + import {SuperAdminDriveDuplicate} from "@/components/placements/super-admin-drive-duplicate";
  + import {SuperAdminDriveArchive} from "@/components/placements/super-admin-drive-archive";
  + import {SuperAdminPublishedDriveEdit} from "@/components/placements/super-admin-published-drive-edit";
  ```
- … 7 more in this file

## tests/unit/ux-chat7-final-six.test.ts (5 failing)
- Signed-off UX rollout: learner, quiz, dashboard, notifications > UX-learn-learn-projects-01 preserves real route and accessible states

  ```
  AssertionError: expected 'import { z } from "zod";\nimport Link…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { z } from "zod";
  + import Link from "next/link";
  + import { Banner } from "@/components/ui/banner";
  + import { redirect } from "next/navigation";
  ```
- Signed-off UX rollout: learner, quiz, dashboard, notifications > UX-learn-learn-projects-projectId-01 preserves real route and accessible states

  ```
  AssertionError: expected 'import { getProjectActivityPage } fro…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { getProjectActivityPage } from "@/modules/projects/activity-service";
  + import { parseLearnerProjectActivityFilters } from "@/modules/projects/learner-project-activity-filter-model";
  + import { LearnerProjectActivity } from "@/components/projects/learner-project-activity";
  + import { notFound, redirect } from "next/navigation";
  ```
- Signed-off UX rollout: learner, quiz, dashboard, notifications > UX-quiz-quiz-01 preserves real route and accessible states

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'focus-visible:outline-[var(--lms-teal…'
  - Expected
  + Received
  - focus-visible:outline-[var(--lms-teal-deep)]
  + import Link from "next/link";
  + import type { Metadata, Viewport } from "next";
  + export const metadata: Metadata = { title: "42Learn <-> Quiz", icons: {icon:"/assets/images/legacy-42lms-logo.svg"} };
  + export const viewport: Viewport = { viewportFit:"cover" };
  ```
- Signed-off UX rollout: learner, quiz, dashboard, notifications > UX-dashboard-dashboard-01 preserves real route and accessible states

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import Link from "next/link";
  + import {getSuperAdminCollegeAtGlance} from "@/modules/colleges/admin-college-at-glance-service";
  + import {CollegeAtGlancePanel} from "@/components/admin/college-at-glance-panel";
  + import {getSuperAdminTodayBoard} from "@/modules/colleges/admin-today-attention-service";
  ```
- Signed-off UX rollout: learner, quiz, dashboard, notifications > UX-notifications-notifications-01 preserves real route and accessible states

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { NotificationList, type NotificationListItem } from "@/components/activity/notification-list";
  + import { NotificationToolbar } from "@/components/activity/notification-toolbar";
  ```
