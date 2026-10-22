# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/superadmin-tenants-gap-closure.test.ts (5 failing)
- Super Admin Tenants/Modules legacy gap contracts > SA-tenants-modules-03 scoped setup retains tenant navigation and administration controls

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'Tenant details'
  - Expected
  + Received
  - Tenant details
  + import Link from "next/link";
  + import { TenantDirectoryCsvControl } from "@/components/admin/tenant-directory-csv-control";
  + import { tenantDirectoryExportHref } from "@/modules/colleges/admin-tenant-export-model";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```
- Super Admin Tenants/Modules legacy gap contracts > SA-tenants-modules-05 tenant scope list does not default to a foreign college

  ```
  AssertionError: expected 'import {PageBackLink} from "@/compone…' to contain 'No college selected. Setup cannot def…'
  - Expected
  + Received
  - No college selected. Setup cannot default to an unrelated tenant.
  + import {PageBackLink} from "@/components/ui/page-back-link";
  + import Link from "next/link";
  + import {notFound} from "next/navigation";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  ```
- Super Admin Tenants/Modules legacy gap contracts > SA-tenants-modules-21 sign-in methods use explicit choices and optimistic save

  ```
  AssertionError: expected '"use client";\nimport {Button} from "…' to contain 'apiFetch<void>'
  - Expected
  + Received
  - apiFetch<void>
  + "use client";
  + import {Button} from "@/components/ui/button";
  + import {ConfirmDialog} from "@/components/ui/confirm-dialog";
  + import {Alert} from "@/components/ui/alert";
  ```
- Super Admin Tenants/Modules legacy gap contracts > SA-tenants-modules-04 unscoped platform has four described navigation cards including Recruiter accounts

  ```
  AssertionError: expected '/**\n * W06 clone-first College Admin…' to contain 'href: "/admin/tenants"'
  - Expected
  + Received
  - href: "/admin/tenants"
  + /**
  +  * W06 clone-first College Admin Dashboard navigation contract.
  +  * Legacy source: lms2-fe/prod-2026,
  +  * src/components/admin/dashboard/config.js and college-admin/dashboard.js.
  ```
- Super Admin Tenants/Modules legacy gap contracts > SA-tenants-modules-14 college archive intentionally preserves dependencies and historical records

  ```
  AssertionError: expected '"use client";\n\nimport {\n  useRef,\…' to contain 'The server checks memberships'
  - Expected
  + Received
  - The server checks memberships
  + "use client";
  +
  + import {
  +   useRef,
  ```

## tests/unit/tpo-chat5-graceful-adoption-round4.test.ts (3 failing)
- Chat-5 graceful-operation adoption > GR-35 uses an inline consequence acknowledgement rather than native confirm

  ```
  AssertionError: expected '"use client";\nimport { Textarea } fr…' to contain 'type="checkbox"'
  - Expected
  + Received
  - type="checkbox"
  + "use client";
  + import { Textarea } from "@/components/ui/textarea";
  + import { Checkbox } from "@/components/ui/checkbox";
  + import { Button } from "@/components/ui/button";
  ```
- Chat-5 graceful-operation adoption > GR-90 announces failures through role alert in all affected forms

  ```
  AssertionError: expected '"use client";\nimport { Textarea } fr…' to contain 'role="alert"'
  - Expected
  + Received
  - role="alert"
  + "use client";
  + import { Textarea } from "@/components/ui/textarea";
  + import { Checkbox } from "@/components/ui/checkbox";
  + import { Button } from "@/components/ui/button";
  ```
- Chat-5 graceful-operation adoption > GR-91 keeps explicit acknowledgement and retry controls keyboard-operable

  ```
  AssertionError: expected '"use client";\nimport { Textarea } fr…' to contain 'type="checkbox"'
  - Expected
  + Received
  - type="checkbox"
  + "use client";
  + import { Textarea } from "@/components/ui/textarea";
  + import { Checkbox } from "@/components/ui/checkbox";
  + import { Button } from "@/components/ui/button";
  ```

## tests/unit/tpo-drives-gap-closure.test.ts (5 failing)
- TPO Drives independently inspected legacy gap contracts > TPO-drives-06 Applied is sourced from application rows and displayed per drive

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain '{job.appliedCount}'
  - Expected
  + Received
  - {job.appliedCount}
  + import Link from "next/link";
  + import { Dropdown } from "@/components/ui/dropdown";
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```
- TPO Drives independently inspected legacy gap contracts > TPO-drives-12 row More menu links to applicants, rounds and offers

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'More ···'
  - Expected
  + Received
  - More ···
  + import Link from "next/link";
  + import { Dropdown } from "@/components/ui/dropdown";
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```
- TPO Drives independently inspected legacy gap contracts > TPO-drives-22 create and edit pages use exact Create drive and Edit drive names

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'title="Edit drive"'
  - Expected
  + Received
  - title="Edit drive"
  + import Link from "next/link";
  + import {notFound,redirect} from "next/navigation";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {PageHeader} from "@/components/ui/page-header";
  ```
- TPO Drives independently inspected legacy gap contracts > TPO-drives-26 clone creates a NEW draft after explicit consequence notice

  ```
  AssertionError: expected '"use client";\nimport {useState} from…' to contain 'Dates, candidates, rounds, results, o…'
  - Expected
  + Received
  - Dates, candidates, rounds, results, offers and external links are cleared
  + "use client";
  + import {useState} from "react";
  + import {useRouter} from "next/navigation";
  + import {apiFetch} from "@/lib/api-fetch";
  ```
- TPO Drives independently inspected legacy gap contracts > TPO-drives-33 dream category is visible from persisted drive flag

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'job.isDream ? " · Dream" : " · Regula…'
  - Expected
  + Received
  - job.isDream ? " · Dream" : " · Regular"
  + import Link from "next/link";
  + import { Dropdown } from "@/components/ui/dropdown";
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```

## tests/unit/tpo-settings-layout-copy.test.ts (1 failing)
- TPO-settings-audit-02 uses exact legacy Settings subtitle

  ```
  AssertionError: expected 'import type { ReactNode } from "react…' to contain 'How your placement cell runs: its rul…'
  - Expected
  + Received
  - How your placement cell runs: its rules, its people, and what students and companies get.
  + import type { ReactNode } from "react";
  +
  + /** Each TPO Settings screen owns its shared PageHeader. The authenticated
  +  * ancestor provides the only white canvas; never duplicate either surface.
  ```

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
  - Expected
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

## tests/unit/ux-chat14-mentor-quality-04d.test.ts (5 failing)
- chat-14 mentor UX quality batch 04d > UX-mentor-projects-projectId-tasks-taskId-feedback-02 protects accessible link focus and shared actions

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'focus-visible:outline-[var(--lms-teal…'
  - Expected
  + Received
  - focus-visible:outline-[var(--lms-teal-deep)]
  + import Link from "next/link";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {PageHeader} from "@/components/ui/page-header";
  + import {StatusBadge} from "@/components/ui/status-badge";
  ```
- chat-14 mentor UX quality batch 04d > UX-mentor-projects-projectId-team-history-02 protects accessible link focus and shared actions

  ```
  AssertionError: expected 'import { FilterBar } from "@/componen…' to contain '<Button type="submit" variant="primar…'
  - Expected
  + Received
  - <Button type="submit" variant="primary">
  + import { FilterBar } from "@/components/ui/filter-bar";
  + import { Pagination } from "@/components/ui/pagination";
  + import { Tabs } from "@/components/ui/tabs";
  + import { Select } from "@/components/ui/select";
  ```
- chat-14 mentor UX quality batch 04d > UX-mentor-projects-projectId-team-meetings-02 protects accessible link focus and shared actions

  ```
  AssertionError: expected 'import { FilterBar } from "@/componen…' to contain '<Button type="submit" variant="primar…'
  - Expected
  + Received
  - <Button type="submit" variant="primary">
  + import { FilterBar } from "@/components/ui/filter-bar";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Pagination } from "@/components/ui/pagination";
  ```
- chat-14 mentor UX quality batch 04d > UX-mentor-projects-projectId-timeline-02 protects accessible link focus and shared actions

  ```
  AssertionError: expected 'import { PageHeader } from "@/compone…' to contain 'focus-visible:outline-[var(--lms-teal…'
  - Expected
  + Received
  - focus-visible:outline-[var(--lms-teal-deep)]
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Pagination } from "@/components/ui/pagination";
  + import { NeedsDoingChips } from "@/components/ui/needs-doing-chips";
  +
  ```
- chat-14 mentor UX quality batch 04d > UX-mentor-reports-02 protects accessible link focus and shared actions

  ```
  AssertionError: expected 'import { FilterBar } from "@/componen…' to contain '<Button type="submit" variant="primar…'
  - Expected
  + Received
  - <Button type="submit" variant="primary">
  + import { FilterBar } from "@/components/ui/filter-bar";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Pagination } from "@/components/ui/pagination";
  ```
