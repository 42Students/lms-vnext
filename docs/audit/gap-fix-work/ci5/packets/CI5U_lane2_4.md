# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat9-calendar-partial-recovery.test.ts (1 failing)
- TPO calendar partial-data recovery > TPO-calendar-reports-22 keeps a successful primary calendar visible when auxiliary counts fail

  ```
  AssertionError: expected 'import {TpoWeekHourCalendar} from "@/…' to contain 'Calendar summary is partially unavail…'
  - Expected
  + Received
  - Calendar summary is partially unavailable.
  + import {TpoWeekHourCalendar} from "@/components/placements/tpo-week-hour-calendar";
  + import {TPO_OWNER_PAGE_COPY} from "@/modules/placements/tpo-page-copy";
  + import Link from "next/link";
  +
  ```

## tests/unit/chat9-phase2-college-shortlist-recovery.test.ts (1 failing)
- College Admin shortlist page recovery > recovers a stale bookmark only after an authorized scoped read

  ```
  AssertionError: expected -1 to be greater than 0
  ❯ tests/unit/chat9-phase2-college-shortlist-recovery.test.ts:18:19
  16|     const scopedRead=src.indexOf("listCollegeDriveApplications(context…
  17|     const recovery=src.indexOf("query.page>data.totalPages");
  18|     expect(guard).toBeGreaterThan(0);
  |                   ^
  19|     expect(scopedRead).toBeGreaterThan(guard);
  20|     expect(recovery).toBeGreaterThan(scopedRead);
  ```

## tests/unit/chat9-super-admin-placement-source-reconciliation.test.ts (7 failing)
- Super Admin Placements documented parity and owner-accepted navigation > SA-placements-projects-04 restores the legacy Drives landing and no-college wording

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'Drives is college-scoped.'
  - Expected
  + Received
  - Drives is college-scoped.
  + import Link from "next/link";
  + import { listPlatformPlacementPolicy } from "@/modules/placements/platform-placement-policy-service";
  + import { SuperAdminPlatformPlacementPolicy } from "@/components/placements/super-admin-platform-placement-policy";
  + import { SuperAdminPlacementOversightNav } from "@/components/admin/super-admin-placement-oversight-nav";
  ```
- Super Admin Placements documented parity and owner-accepted navigation > SA-placements-projects-16 links a missing active season to the manager instead of crashing

  ```
  AssertionError: expected '"use client";\n\nimport {\n  useState…' to contain 'disabled={pending || !activeSeason ||…'
  - Expected
  + Received
  - disabled={pending || !activeSeason || uncertainCreate}
  + "use client";
  +
  + import {
  +   useState,
  ```
- Super Admin Placements documented parity and owner-accepted navigation > SA-placements-projects-24 implements global Verified by 42 with a not-verified filter

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' to contain '<SuperAdminCompanyVerification'
  - Expected
  + Received
  - <SuperAdminCompanyVerification
  + import {Button} from "@/components/ui/button";
  + import {DataTable,type DataTableColumn} from "@/components/ui/data-table";
  + import {Banner} from "@/components/ui/banner";
  + import type {AdminCompanyRow} from "@/modules/placements/admin-company-directory-model";
  ```
- Super Admin Placements documented parity and owner-accepted navigation > SA-placements-projects-26 implements globally scoped Edit company with a confirmed API write

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' to contain '<SuperAdminCompanyEdit'
  - Expected
  + Received
  - <SuperAdminCompanyEdit
  + import {Button} from "@/components/ui/button";
  + import {DataTable,type DataTableColumn} from "@/components/ui/data-table";
  + import {Banner} from "@/components/ui/banner";
  + import type {AdminCompanyRow} from "@/modules/placements/admin-company-directory-model";
  ```
- Super Admin Placements documented parity and owner-accepted navigation > SA-placements-projects-27 maintains company domains with removal guard and provider-side authorization

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' to contain '<SuperAdminCompanyIdentities'
  - Expected
  + Received
  - <SuperAdminCompanyIdentities
  + import {Button} from "@/components/ui/button";
  + import {DataTable,type DataTableColumn} from "@/components/ui/data-table";
  + import {Banner} from "@/components/ui/banner";
  + import type {AdminCompanyRow} from "@/modules/placements/admin-company-directory-model";
  ```
- Super Admin Placements documented parity and owner-accepted navigation > SA-placements-projects-36 uses recruiter accounts and readable Active or Suspended status labels

  ```
  AssertionError: expected '"use client";\n\nimport {\n  useRef,\…' to contain '"Active":"Disabled"'
  - Expected
  + Received
  - "Active":"Disabled"
  + "use client";
  +
  + import {
  +   useRef,
  ```
- Super Admin Placements documented parity and owner-accepted navigation > SA-placements-projects-50 provides one canonical Interviews link and collapses additional reports

  ```
  AssertionError: expected '"use client";\n\nimport { usePathname…' to contain '<details'
  - Expected
  + Received
  - <details
  + "use client";
  +
  + import { usePathname } from "next/navigation";
  + import Link from "next/link";
  ```

## tests/unit/college-contacts-denial-before-filters.test.ts (1 failing)
- College Contacts role-first denial > checks active account role before resolving user-supplied filters

  ```
  AssertionError: expected 'import { DateInput } from "@/componen…' to match /if\(!context\.membership\…/dashboard"\)
  - Expected:
  /if\(!context\.membership\|\|!hasMembershipRole\(context,"COLLEGE_ADMIN"\)\)redirect\("\/dashboard"\)/
  + Received:
  "import { DateInput } from \"@/components/ui/date-input\";
  import { Input } from \"@/components/ui/input\";
  import { Disclosure } from \"@/components/ui/disclosure\";
  import { Button } from \"@/components/ui/button\";
  ```

## tests/unit/college-section-mutation-model.test.ts (1 failing)
- College Admin class mutation model > requires explicit edit confirmation and rejects parent reassignment

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```

## tests/unit/faculty-profile-round9-6.test.ts (1 failing)
- finds reversed dates and invalid required values before a network request

  ```
  AssertionError: expected null not to be null
  ❯ tests/unit/faculty-profile-round9-6.test.ts:8:76
  6|  expect(facultyProfileRepeatableIssue("education",[{id,institutionName…
  7|  expect(facultyProfileRepeatableIssue("certifications",[{id,name:"A",c…
  8|  expect(facultyProfileRepeatableIssue("languages",[{id,language:""}]))…
  |                                                                            ^
  9|  expect(facultyProfileRepeatableIssue("about",[])).not.toBeNull();
  10| });
  ```

## tests/unit/hr-today-action-queue-scoped.test.ts (2 failing)
- REC-home-drives-01 scoped task queue > orders dated results-due first, then readable conversations and notices, then reviews

  ```
  AssertionError: expected [ 'thread:thread', 'notifications' ] to deeply equal [ 'due:round', 'notifications', …(2) ]
  - Expected
  + Received
  [
  -   "due:round",
  +   "thread:thread",
  "notifications",
  -   "thread:thread",
  ```
- REC-home-drives-01 scoped task queue > cannot leak foreign-company or unlinked deadline rows into actions

  ```
  AssertionError: expected [] to deeply equal [ Array(1) ]
  - Expected
  + Received
  - [
  -   "review:11111111-1111-4111-8111-111111111111",
  - ]
  + []
  ```

## tests/unit/learner-job-detail-parity.test.ts (3 failing)
- Learner published placement Job Detail > does not disclose unpublished/other-college jobs on arbitrary job IDs

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'listLearnerPlacementJobs(context)'
  - Expected
  + Received
  - listLearnerPlacementJobs(context)
  + import Link from "next/link";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Banner } from "@/components/ui/banner";
  + import {readOptionalLearnerPlacementSource} from "@/modules/placements/learner-optional-placement-source";
  ```
- Learner published placement Job Detail > uses a dedicated detail instead of generic uncontextualized cards

  ```
  AssertionError: expected 'import type {ReactNode} from "react";…' to contain 'Placement breadcrumbs'
  - Expected
  + Received
  - Placement breadcrumbs
  + import type {ReactNode} from "react";
  + import {learnerDriveDeadlineUrgency} from "@/modules/placements/learner-drive-deadline-urgency-model";
  + import { Breadcrumbs } from "@/components/ui/breadcrumbs";
  + import { PageHeader } from "@/components/ui/page-header";
  ```
- Learner published placement Job Detail > distinguishes loading/failure from not-found and allows retry

  ```
  AssertionError: expected 'import { GracefulPageLoading } from "…' to contain 'aria-busy="true"'
  - Expected
  + Received
  - aria-busy="true"
  + import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
  +
  + export default function LearnerJobDetailLoading() {
  +   return <GracefulPageLoading label="Loading placement job details" shape="directory" />;
  ```
