# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat4-superadmin-college-admins-list-page.test.tsx (4 failing)
- SA-colleges-admins-list-01 tenant administrator roster page > renders the empty/permission-safe scoped directory without invented admins

  ```
  Error: [vitest] No "listCollegeAdminSessionTargetsPage" export is defined on the "@/modules/colleges/admin-session-service" mock. Did you forget to return it from "vi.mock"?
  If you need to partially mock a module, you can use "importOriginal" helper inside:
  vi.mock(import("@/modules/colleges/admin-session-service"), async (importOriginal) => {
  const actual = await importOriginal()
  return {
  ...actual,
  // your mocked methods
  }
  ```
- SA-colleges-admins-list-01 tenant administrator roster page > renders real role/status and authorized nested device and history URLs

  ```
  Error: [vitest] No "listCollegeAdminSessionTargetsPage" export is defined on the "@/modules/colleges/admin-session-service" mock. Did you forget to return it from "vi.mock"?
  If you need to partially mock a module, you can use "importOriginal" helper inside:
  vi.mock(import("@/modules/colleges/admin-session-service"), async (importOriginal) => {
  const actual = await importOriginal()
  return {
  ...actual,
  // your mocked methods
  }
  ```
- SA-colleges-admins-list-01 tenant administrator roster page > discloses a 500-record cap rather than presenting incomplete rosters as exhaustive

  ```
  Error: [vitest] No "listCollegeAdminSessionTargetsPage" export is defined on the "@/modules/colleges/admin-session-service" mock. Did you forget to return it from "vi.mock"?
  If you need to partially mock a module, you can use "importOriginal" helper inside:
  vi.mock(import("@/modules/colleges/admin-session-service"), async (importOriginal) => {
  const actual = await importOriginal()
  return {
  ...actual,
  // your mocked methods
  }
  ```
- SA-colleges-admins-list-01 tenant administrator roster page > does not render administrator details when the scoped service denies the actor

  ```
  AssertionError: expected [Function] to throw error including 'REVOKED' but got '[vitest] No "listCollegeAdminSessionT…'
  - Expected
  + Received
  - REVOKED
  + [vitest] No "listCollegeAdminSessionTargetsPage" export is defined on the "@/modules/colleges/admin-session-service" mock. Did you forget to return it from "vi.mock"?
  + If you need to partially mock a module, you can use "importOriginal" helper inside:
  +
  ```

## tests/unit/chat5-ux-tpo-middle-third.test.ts (16 failing)
- chat-5 UX /tpo middle-third route coverage (43–84) > UX-tpo-placements-jobs-jobid-applicants-applicationid-01 keeps the original route while applying safe responsive controls and recovery

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import Link from "next/link";
  + import {notFound,redirect} from "next/navigation";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {PageHeader} from "@/components/ui/page-header";
  ```
- chat-5 UX /tpo middle-third route coverage (43–84) > UX-tpo-placements-jobs-jobid-applications-export-01 keeps the original route while applying safe responsive controls and recovery

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import Link from "next/link";
  + import {notFound,redirect} from "next/navigation";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {PageHeader} from "@/components/ui/page-header";
  ```
- chat-5 UX /tpo middle-third route coverage (43–84) > UX-tpo-placements-jobs-jobid-change-requests-01 keeps the original route while applying safe responsive controls and recovery

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import Link from "next/link";
  + import {notFound,redirect} from "next/navigation";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {hasMembershipRole} from "@/modules/identity/context";
  ```
- chat-5 UX /tpo middle-third route coverage (43–84) > UX-tpo-placements-jobs-jobid-drive-day-01 keeps the original route while applying safe responsive controls and recovery

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import Link from "next/link";
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { hasMembershipRole } from "@/modules/identity/context";
  ```
- chat-5 UX /tpo middle-third route coverage (43–84) > UX-tpo-placements-jobs-jobid-offers-offerid-01 keeps the original route while applying safe responsive controls and recovery

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import Link from "next/link";
  + import {notFound,redirect} from "next/navigation";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {PageHeader} from "@/components/ui/page-header";
  ```
- chat-5 UX /tpo middle-third route coverage (43–84) > UX-tpo-placements-jobs-jobid-share-audit-01 keeps the original route while applying safe responsive controls and recovery

  ```
  AssertionError: expected 'import { PageHeader } from "@/compone…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { PageHeader } from "@/components/ui/page-header";
  + import Link from "next/link";
  + import { DataTable } from "@/components/ui/data-table";
  + import { Tabs } from "@/components/ui/tabs";
  ```
- chat-5 UX /tpo middle-third route coverage (43–84) > UX-tpo-placements-jobs-jobid-shortlist-01 keeps the original route while applying safe responsive controls and recovery

  ```
  AssertionError: expected 'import { Pagination } from "@/compone…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { Pagination } from "@/components/ui/pagination";
  + import Link from "next/link";
  + import { DataTable } from "@/components/ui/data-table";
  + import { EmptyState } from "@/components/ui/empty-state";
  ```
- chat-5 UX /tpo middle-third route coverage (43–84) > UX-tpo-placements-lifecycle-01 keeps the original route while applying safe responsive controls and recovery

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import Link from "next/link";
  + import { Dropdown } from "@/components/ui/dropdown";
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```
- chat-5 UX /tpo middle-third route coverage (43–84) > UX-tpo-profile-01 keeps the original route while applying safe responsive controls and recovery

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import Link from "next/link";
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { PageHeader } from "@/components/ui/page-header";
  ```
- chat-5 UX /tpo middle-third route coverage (43–84) > UX-tpo-recruiters-leadid-01 keeps the original route while applying safe responsive controls and recovery

  ```
  AssertionError: expected '"use client";\nimport { PageHeader } …' to match /<h1[^>]*>\{lead\.name\}<\/h1>/h1>
  - Expected:
  /<h1[^>]*>\{lead\.name\}<\/h1>/
  + Received:
  "\"use client\";
  import { PageHeader } from \"@/components/ui/page-header\";
  import { GracefulPageLoading } from \"@/components/ui/graceful-page-loading\";
  import { Banner } from \"@/components/ui/banner\";
  ```
- … 6 more in this file

## tests/unit/chat6-faculty-assessments-gap-closure.test.ts (4 failing)
- chat-6 Faculty assessments verified gap closure > FAC-assessments-06 single-click grade save and publication

  ```
  AssertionError: expected '"use client";\n\nimport { Select } fr…' to contain 'Grade saved and published to the lear…'
  - Expected
  + Received
  - Grade saved and published to the learner.
  + "use client";
  +
  + import { Select } from "@/components/ui/select";
  + import Link from "next/link";
  ```
- chat-6 Faculty assessments verified gap closure > FAC-assessments-23 grade pending and graded points wording

  ```
  AssertionError: expected '"use client";\n\nimport { Select } fr…' to contain 'Grade pending'
  - Expected
  + Received
  - Grade pending
  + "use client";
  +
  + import { Select } from "@/components/ui/select";
  + import Link from "next/link";
  ```
- chat-6 Faculty assessments verified gap closure > FAC-assessments-25 NOT-A-GAP legacy overview fields now shown

  ```
  AssertionError: expected '"use client";\nimport { Badge } from …' to contain 'Course: {item.courseName}'
  - Expected
  + Received
  - Course: {item.courseName}
  + "use client";
  + import { Badge } from "@/components/ui/badge";
  + import {PageHeader} from "@/components/ui/page-header";
  + import { Disclosure } from "@/components/ui/disclosure";
  ```
- chat-6 Faculty assessments verified gap closure > FAC-assessments-26 NOT-A-GAP zero-submission draft review supported

  ```
  AssertionError: expected '"use client";\n\nimport { Select } fr…' to contain 'No submissions yet. Publish this assi…'
  - Expected
  + Received
  - No submissions yet. Publish this assignment
  + "use client";
  +
  + import { Select } from "@/components/ui/select";
  + import Link from "next/link";
  ```

## tests/unit/chat6-superadmin-course-catalogue-round4.test.ts (3 failing)
- chat-6 Super Admin selected-college course directory parity > SA-academics-people-54 supports search sort pagination and route-correct actions

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'catalogueQuery={catalogueQuery.data}'
  - Expected
  + Received
  - catalogueQuery={catalogueQuery.data}
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {listSuperAdminGlobalCourses} from "@/modules/courses/super-admin-global-course-directory";
  + import { AdminCourseOverview } from "@/components/courses/admin-course-overview";
  ```
- chat-6 Super Admin selected-college course directory parity > SA-academics-people-74 counts lesson dependencies only in the selected college and preflights archive

  ```
  AssertionError: expected '"use client";\n\nimport Link from "ne…' to contain 'confirmDisabled={activeOfferingCount>…'
  - Expected
  + Received
  - confirmDisabled={activeOfferingCount>0}
  + "use client";
  +
  + import Link from "next/link";
  + import Image from "next/image";
  ```
- chat-6 Super Admin selected-college course directory parity > SA-academics-people-62 shows scoped student visibility and lesson ordering with safe external links

  ```
  AssertionError: expected 'import { Banner } from "@/components/…' to contain 'Students {studentContentVisible(item)?'
  - Expected
  + Received
  - Students {studentContentVisible(item)?
  + import { Banner } from "@/components/ui/banner";
  + import Link from "next/link";
  + import { Input } from "@/components/ui/input";
  + import { Select } from "@/components/ui/select";
  ```

## tests/unit/chat6-tracker-parity-round4.test.ts (2 failing)
- chat-6 tracker report and manager navigation parity > SA-placements-projects-104 supports shortcut submit, source-linked success and permission-scoped similar reports

  ```
  AssertionError: expected '"use client";\n\nimport Link from "ne…' to contain '"/api/tracker/issues?"+query.toString…'
  - Expected
  + Received
  - "/api/tracker/issues?"+query.toString()
  + "use client";
  +
  + import Link from "next/link";
  + import {Button} from "@/components/ui/button";
  ```
- chat-6 tracker report and manager navigation parity > SA-placements-projects-112 exposes the legacy manager nav destinations with an accessible skip target

  ```
  AssertionError: expected '"use client";\n\nimport Link from "ne…' to contain 'href="/tracker/issues"'
  - Expected
  + Received
  - href="/tracker/issues"
  + "use client";
  +
  + import Link from "next/link";
  + import { Tabs } from "@/components/ui/tabs";
  ```

## tests/unit/chat7-learner-course-material-link-safety.test.ts (1 failing)
- LEARNER-ASSIGNMENT-MATERIALS-04 safe instructor references and file selection > only permits uncredentialed, fragment-free HTTPS external materials

  ```
  AssertionError: expected 'https://[::1]/' to be null
  - Expected:
  null
  + Received:
  "https://[::1]/"
  ```

## tests/unit/chat7-round2-mentor-04.test.ts (2 failing)
- chat-7 mentor meetings and release contracts > MEN-projects-meetings-26 bounded historic meetings with reveal control

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'Past meetings / Meeting history'
  - Expected
  + Received
  - Past meetings / Meeting history
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import {useEffect,useState} from "react";
  +
  ```
- chat-7 mentor meetings and release contracts > MEN-projects-meetings-34 release-first sprint scheduling and definition of done

  ```
  AssertionError: expected '"use client";\n\nimport { useState } …' to contain 'Ships in release'
  - Expected
  + Received
  - Ships in release
  + "use client";
  +
  + import { useState } from "react";
  + import { Select } from "@/components/ui/select";
  ```

## tests/unit/chat9-admin-activity-export-copy.test.ts (1 failing)
- legacy Super Admin and College Admin Activity Log export button > uses exact Export button copy while retaining both scoped export endpoints

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain '            Export\n          </a>'
  - Expected
  + Received
  -             Export
  + import Link from "next/link";
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {
  ```
