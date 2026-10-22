# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat4-superadmin-tenant-directory-query.test.ts (2 failing)
- Super Admin tenant directory strict URL handling > SA-tenants-directory-QUERY-02 URL serialization and 20-row paging retain selected authorized filters

  ```
  AssertionError: expected 25 to be 20 // Object.is equality
  - Expected
  + Received
  - 20
  + 25
  ```
- Super Admin tenant directory strict URL handling > SA-tenants-directory-QUERY-03 malformed input renders a recovery page without a tenant query

  ```
  AssertionError: expected 'export default async function TenantD…' to contain 'requirePermission(context,"admin-scop…'
  - Expected
  + Received
  - requirePermission(context,"admin-scope.select")
  + export default async function TenantDirectory({searchParams}:{
  +  searchParams:Promise<Record<string,string|string[]|undefined>>;
  + }) {
  +  const context=await getCurrentRequestContext();
  ```

## tests/unit/chat5-tpo-second-third-behavior.test.ts (4 failing)
- chat-5 TPO second-third: direct route authorization, negative and empty states > TPO-2ND-PAGE-rounds-round-d-results-01 authenticates and handles missing/empty evidence

  ```
  AssertionError: expected 'import { Button } from "@/components/…' to contain 'No eligible shortlisted submitted app…'
  - Expected
  + Received
  - No eligible shortlisted submitted applicants match
  + import { Button } from "@/components/ui/button";
  + import { Alert } from "@/components/ui/alert";
  + import { EmptyState } from "@/components/ui/empty-state";
  + import { Select } from "@/components/ui/select";
  ```
- chat-5 TPO second-third: direct route authorization, negative and empty states > TPO-2ND-PAGE-lifecycle-02 keeps the active scoped permission in the drive list and exposes zero/error states

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'title="No requests"'
  - Expected
  + Received
  - title="No requests"
  + import Link from "next/link";
  + import { Dropdown } from "@/components/ui/dropdown";
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```
- chat-5 TPO second-third: behavioural round and offer reporting > PLACEMENTS-OFFERS-VIEW-01 never counts issued/declined as accepted or infers joining

  ```
  AssertionError: expected { all: 3, selected: +0, …(7) } to deeply equal { Object (all, issued, ...) }
  - Expected
  + Received
  @@ -2,7 +2,10 @@
  "accepted": 1,
  "all": 3,
  "declined": 1,
  "expired": 0,
  ```
- chat-5 TPO second-third: behavioural round and offer reporting > PLACEMENTS-OFFERS-EXPIRED-05 filters persisted expired offers distinctly from issued-but-overdue offers

  ```
  AssertionError: expected { all: 4, selected: +0, …(7) } to deeply equal { Object (all, issued, ...) }
  - Expected
  + Received
  @@ -2,7 +2,10 @@
  "accepted": 1,
  "all": 4,
  "declined": 1,
  "expired": 1,
  ```

## tests/unit/chat6-college-dashboard-verified.test.ts (9 failing)
- chat-6 College Admin dashboard verified legacy attention > COL-dashboard-03 shows today scheduled held and marked class counters

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'aria-label="Today"'
  - Expected
  + Received
  - aria-label="Today"
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { CollegeEditDialog } from "@/components/admin/college-edit-dialog";
  + import { CollegeSetupChecklist } from "@/components/admin/college-setup-checklist";
  ```
- chat-6 College Admin dashboard verified legacy attention > COL-dashboard-04 flags held sessions missing marked attendance for 7 days

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'aria-label="Attendance not taken"'
  - Expected
  + Received
  - aria-label="Attendance not taken"
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { CollegeEditDialog } from "@/components/admin/college-edit-dialog";
  + import { CollegeSetupChecklist } from "@/components/admin/college-setup-checklist";
  ```
- chat-6 College Admin dashboard verified legacy attention > COL-dashboard-05 checks attendance below the college policy threshold over 30 days

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'lowAttendance.threshold'
  - Expected
  + Received
  - lowAttendance.threshold
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { CollegeEditDialog } from "@/components/admin/college-edit-dialog";
  + import { CollegeSetupChecklist } from "@/components/admin/college-setup-checklist";
  ```
- chat-6 College Admin dashboard verified legacy attention > COL-dashboard-06 shows waiting-to-be-graded submissions per course

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'aria-label="Waiting to be graded"'
  - Expected
  + Received
  - aria-label="Waiting to be graded"
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { CollegeEditDialog } from "@/components/admin/college-edit-dialog";
  + import { CollegeSetupChecklist } from "@/components/admin/college-setup-checklist";
  ```
- chat-6 College Admin dashboard verified legacy attention > COL-dashboard-07 reports current unstaffed active course deliveries

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'aria-label="Courses with no teacher"'
  - Expected
  + Received
  - aria-label="Courses with no teacher"
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { CollegeEditDialog } from "@/components/admin/college-edit-dialog";
  + import { CollegeSetupChecklist } from "@/components/admin/college-setup-checklist";
  ```
- chat-6 College Admin dashboard verified legacy attention > COL-dashboard-08 surfaces specific persisted setup relationship gaps

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'aria-label="Setup gaps"'
  - Expected
  + Received
  - aria-label="Setup gaps"
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { CollegeEditDialog } from "@/components/admin/college-edit-dialog";
  + import { CollegeSetupChecklist } from "@/components/admin/college-setup-checklist";
  ```
- chat-6 College Admin dashboard verified legacy attention > COL-dashboard-09 shows published quizzes closing in the next seven days

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'CollegeClosingQuizzesCard'
  - Expected
  + Received
  - CollegeClosingQuizzesCard
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { CollegeEditDialog } from "@/components/admin/college-edit-dialog";
  + import { CollegeSetupChecklist } from "@/components/admin/college-setup-checklist";
  ```
- chat-6 College Admin dashboard verified legacy attention > COL-dashboard-15 handles a missing college membership with the legacy warning

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'title="Admin not assigned to a colleg…'
  - Expected
  + Received
  - title="Admin not assigned to a college"
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { CollegeEditDialog } from "@/components/admin/college-edit-dialog";
  + import { CollegeSetupChecklist } from "@/components/admin/college-setup-checklist";
  ```
- chat-6 College Admin dashboard verified legacy attention > COL-dashboard-16 keeps links keyboard accessible and avoids noisy row live regions

  ```
  AssertionError: expected '"use client";\nimport {useState,useTr…' to contain '<Link key={card.key} href={card.href}'
  - Expected
  + Received
  - <Link key={card.key} href={card.href}
  + "use client";
  + import {useState,useTransition} from "react";
  + import { StatTile } from "@/components/ui/stat-tile";
  + import { Button } from "@/components/ui/button";
  ```

## tests/unit/chat6-final-sprint-rec-home-drives-07.test.ts (1 failing)
- Final sprint recruiter live drive highlight > REC-home-drives-07 live drive highlight counts only college-shared applicants

  ```
  AssertionError: expected 'import {NeedsDoingChips} from "@/comp…' to contain 'recruiterVisiblePortfolioCounts(conte…'
  - Expected
  + Received
  - recruiterVisiblePortfolioCounts(context,selectedId,liveDrives.map(row=>row.job.id))
  + import {NeedsDoingChips} from "@/components/ui/needs-doing-chips";
  + import { Badge } from "@/components/ui/badge";
  + import { Alert } from "@/components/ui/alert";
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

## tests/unit/chat6-superadmin-teaching-role-edit-101.test.ts (1 failing)
- SA-academics-people-101 role edit transactional contract > SA-academics-people-101 guards PATCH origin and offers create, edit, and end actions on the tab

  ```
  AssertionError: expected 'import { NextResponse } from "next/se…' to contain 'changeCourseTeachingAssignmentRole(co…'
  - Expected
  + Received
  - changeCourseTeachingAssignmentRole(context,assignmentId,body.role)
  + import { NextResponse } from "next/server";
  + import {and,eq} from "drizzle-orm";
  + import {z} from "zod";
  + import {getDb} from "@/db/client";
  ```
