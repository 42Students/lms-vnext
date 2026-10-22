# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat4-superadmin-organizations-page-journey.test.tsx (4 failing)
- SA-organizations-page-01 real directory permission, filters and restore states > denies duplicate and unknown URL keys before any private tenant directory read

  ```
  
  ```
- SA-organizations-page-01 real directory permission, filters and restore states > renders real scoped organizations, search and pagination without invented records

  ```
  
  ```
- SA-organizations-page-01 real directory permission, filters and restore states > renders an honest empty organization directory

  ```
  Error: invariant expected app router to be mounted
  ❯ useRouter node_modules/next/src/client/components/navigation.ts:169:11
  ❯ OrganizationDirectoryRefresh src/components/admin/organization-directory-refresh.tsx:7:15
  5|
  6| export function OrganizationDirectoryRefresh(){
  7|  const router=useRouter();
  |               ^
  8|  const [pending,startTransition]=useTransition();
  ```
- SA-organizations-page-01 real directory permission, filters and restore states > shows actual archived restoration choices only for an authorized platform administrator

  ```
  TypeError: Cannot read properties of undefined (reading 'getTime')
  ❯ organizationCreatedIstDate src/modules/organizations/organization-created-date-model.ts:3:28
  1| /** Platform tenant creation dates follow the LMS-wide IST display rul…
  2| export function organizationCreatedIstDate(value:Date):string {
  3|  if(!Number.isFinite(value.getTime()))return "—";
  |                            ^
  4|  return new Intl.DateTimeFormat("en-IN",{
  5|   timeZone:"Asia/Kolkata",day:"2-digit",month:"short",year:"numeric",
  ```

## tests/unit/chat5-tpo-closure-ux-boundary.test.ts (2 failing)
- chat-5 TPO drive closure and correction journeys > PLACEMENTS-CANCEL-WAIT-34 requires settling pending waitlist reservations before cancellation

  ```
  AssertionError: expected 'import "server-only";\nimport { and, …' to contain 'if(pendingPromotions>0)'
  - Expected
  + Received
  - if(pendingPromotions>0)
  + import "server-only";
  + import { and, count, eq, inArray, sql } from "drizzle-orm";
  + import { getDb } from "@/db/client";
  + import {placementDriveSelections} from "@/db/schema/placement-drive-selections";
  ```
- chat-5 TPO drive closure and correction journeys > UX-PLACEMENTS-JOINING-23 retains correction evidence and confirmation while preventing duplicate updates

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'role="alert"'
  - Expected
  + Received
  - role="alert"
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import {InlineNotice} from "@/components/ui/inline-notice";
  + import { Select } from "@/components/ui/select";
  ```

## tests/unit/chat6-college-dashboard-graceful-round3.test.ts (3 failing)
- College Admin dashboard graceful degradation > COL-dashboard-10 isolates dashboard data sources with independent failed card states

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'CollegeDashboardSectionFailure title=…'
  - Expected
  + Received
  - CollegeDashboardSectionFailure title="Closing quizzes"
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { CollegeEditDialog } from "@/components/admin/college-edit-dialog";
  + import { CollegeSetupChecklist } from "@/components/admin/college-setup-checklist";
  ```
- College Admin dashboard graceful degradation > GR-70 and GR-72 preserve primary cards when one secondary dashboard source fails

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain '{pendingGrades?<>'
  - Expected
  + Received
  - {pendingGrades?<>
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { CollegeEditDialog } from "@/components/admin/college-edit-dialog";
  + import { CollegeSetupChecklist } from "@/components/admin/college-setup-checklist";
  ```
- College Admin dashboard graceful degradation > GR-90 and GR-91 render a keyboard retry and alert rather than false zeroes

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'role="alert"'
  - Expected
  + Received
  - role="alert"
  + import Link from "next/link";
  + import { ErrorState } from "@/components/ui/error-state";
  +
  + /** A failed secondary College Admin query never masquerades as an empty result. */
  ```

## tests/unit/chat6-final-sprint-rec-home-drives-06.test.ts (1 failing)
- Final sprint recruiter this-week combined feed > REC-home-drives-06 week feed includes scoped round slot deadline and result events

  ```
  AssertionError: expected 'import {NeedsDoingChips} from "@/comp…' to contain 'recruiterTodayEightDayWindow(now)'
  - Expected
  + Received
  - recruiterTodayEightDayWindow(now)
  + import {NeedsDoingChips} from "@/components/ui/needs-doing-chips";
  + import { Badge } from "@/components/ui/badge";
  + import { Alert } from "@/components/ui/alert";
  + import Link from "next/link";
  ```

## tests/unit/chat6-superadmin-content-verified-exports.test.ts (1 failing)
- Super Admin content CSV parity > SA-academics-people-69 exposes four selected-college bounded CSV endpoints

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain '/api/admin/assignments/export'
  - Expected
  + Received
  - /api/admin/assignments/export
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {isSuperAdmin} from "@/modules/identity/context";
  + import { EmptyState } from "@/components/ui/empty-state";
  ```

## tests/unit/chat6-superadmin-scoped-directory-filters.test.ts (1 failing)
- Super Admin selected-college directory filters > SA-academics-people-66 filters selected college assessments by course, section scope and result publication

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'courseCode:raw.courseCode'
  - Expected
  + Received
  - courseCode:raw.courseCode
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {isSuperAdmin} from "@/modules/identity/context";
  + import { EmptyState } from "@/components/ui/empty-state";
  ```
