# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat9-final-TPO-campaigns-public-28.test.ts (1 failing)
- chat-9 final sprint > TPO-campaigns-public-28 preserves verified functionality and safe failure states

  ```
  AssertionError: expected '"use client";\nimport { PageHeader } …' to contain 'preview.companyName?.trim() || previe…'
  - Expected
  + Received
  - preview.companyName?.trim() || preview.companyDomain
  + "use client";
  + import { PageHeader } from "@/components/ui/page-header";
  +
  + import authStyles from "@/components/public/public-auth-skin.module.css";
  ```

## tests/unit/chat9-super-admin-academic-existing-gap-closure.test.ts (5 failing)
- Super Admin Academic Setup gap reconciliation > SA-academics-people-07 rejects missing or oversized department names without raw server codes

  ```
  AssertionError: expected '"use client";\n\nimport { useEffect, …' to contain 'Department was not created.'
  - Expected
  + Received
  - Department was not created.
  + "use client";
  +
  + import { useEffect, useRef, useState } from "react";
  + import { useGuardedAction } from "@/hooks/use-guarded-action";
  ```
- Super Admin Academic Setup gap reconciliation > SA-academics-people-08 blocks dependency-unsafe department deletion before the request

  ```
  AssertionError: expected '"use client";\n\nimport {\n  useRef,\…' to contain 'usage.programs + usage.courses + usag…'
  - Expected
  + Received
  - usage.programs + usage.courses + usage.faculty
  + "use client";
  +
  + import {
  +   useRef,
  ```
- Super Admin Academic Setup gap reconciliation > SA-academics-people-13 restores program creation copy and links to scoped Departments

  ```
  AssertionError: expected '"use client";\n\nimport { useEffect, …' to contain 'href="/admin/departments"'
  - Expected
  + Received
  - href="/admin/departments"
  + "use client";
  +
  + import { useEffect, useState, useTransition, useSyncExternalStore, type FormEvent } from "react";
  + import { usePathname, useRouter } from "next/navigation";
  ```
- Super Admin Academic Setup gap reconciliation > SA-academics-people-37 uses exact empty state copy for departments and lecture halls

  ```
  AssertionError: expected '"use client";\n\nimport { Select } fr…' to contain 'No departments found. Create a colleg…'
  - Expected
  + Received
  - No departments found. Create a college first, then add departments.
  + "use client";
  +
  + import { Select } from "@/components/ui/select";
  + import { DEPARTMENT_COPY } from "@/modules/admin-ui/department-copy";
  ```
- Super Admin Academic Setup gap reconciliation > SA-academics-people-44 derives a bounded program code rather than making it mandatory in the UI

  ```
  AssertionError: expected '"use client";\n\nimport { useEffect, …' to contain 'code.trim() || deriveSuperAdminProgra…'
  - Expected
  + Received
  - code.trim() || deriveSuperAdminProgramCode(name)
  + "use client";
  +
  + import { useEffect, useState, useTransition, useSyncExternalStore, type FormEvent } from "react";
  + import { usePathname, useRouter } from "next/navigation";
  ```

## tests/unit/college-academic-setup-round4-gap-verification.test.ts (2 failing)
- chat-11 college academic setup remaining acceptance > COL-academic-setup-21 sorts, paginates, counts and clears department searches

  ```
  AssertionError: expected [ 'Zoology', 'Physics', 'Biology' ] to deeply equal [ 'Biology', 'Physics', 'Zoology' ]
  - Expected
  + Received
  [
  -   "Biology",
  -   "Physics",
  "Zoology",
  +   "Physics",
  ```
- chat-11 college academic setup remaining acceptance > COL-academic-setup-40 provides department retry and safe loading feedback

  ```
  AssertionError: expected 'import { PageHeader } from "@/compone…' to contain 'Loading departments…'
  - Expected
  + Received
  - Loading departments…
  + import { PageHeader } from "@/components/ui/page-header";
  +
  + /** Reserve the legacy eight-row, six-column department directory while the
  +  * scoped college and dependency counts are being loaded. */
  ```

## tests/unit/college-mapping-model.test.ts (1 failing)
- College Admin semester offering and faculty assignment models > validates teaching lifecycle filters and rejects unrecognised fields

  ```
  AssertionError: expected { role: 'ALL', q: '', …(2) } to deeply equal { q: '', status: 'ACTIVE', …(2) }
  - Expected
  + Received
  {
  "page": 1,
  "q": "",
  "role": "ALL",
  -   "status": "ACTIVE",
  ```

## tests/unit/faculty-legacy-wording.test.ts (2 failing)
- Faculty legacy wording (lists.js, CoursesContent, QuizzesContent, AssignmentsContent) > page headings are My Courses / My Quizzes / My Assignments

  ```
  AssertionError: expected 'import { assignmentFilesRuntimeEnable…' to contain 'title="My Assignments"'
  - Expected
  + Received
  - title="My Assignments"
  + import { assignmentFilesRuntimeEnabled } from "@/modules/courses/assignment-file-readiness";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {RetainedFacultyAssignments} from "@/components/courses/faculty-assignments-retention";
  + import { getFacultyAssessmentOverview } from "@/modules/courses/faculty-assessment-service";
  ```
- Faculty legacy wording (lists.js, CoursesContent, QuizzesContent, AssignmentsContent) > Contacts heading follows the selected tab

  ```
  AssertionError: expected 'import { Select } from "@/components/…' to contain 'title={selected.label}'
  - Expected
  + Received
  - title={selected.label}
  + import { Select } from "@/components/ui/select";
  + import { Button } from "@/components/ui/button";
  + import Link from "next/link";
  + import { redirect } from "next/navigation";
  ```

## tests/unit/hr-drive-draft-model.test.ts (2 failing)
- HR recruiter Request Drive draft preview > prefills a draft from an already-authorized job without saving anything

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```
- HR recruiter Request Drive draft preview > checks complete fixed/variable annual CTC against both endpoints of the advertised range

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```

## tests/unit/learner-course-page-parity.test.ts (2 failing)
- learner Course page parity contract > keeps legacy Learning Path filters, lesson expansion and deep-link focus

  ```
  AssertionError: expected 'import { MetricBar } from "@/componen…' to contain '<details'
  - Expected
  + Received
  - <details
  + import { MetricBar } from "@/components/ui/metric-bar";
  + import type {ComponentProps} from "react";
  + import progressStyles from "./learner-course-progress.module.css";
  + import { Disclosure } from "@/components/ui/disclosure";
  ```
- learner Course page parity contract > keeps Course Attendance learner-only and Discussions interactive

  ```
  AssertionError: expected '"use client";\nimport { Input } from …' to contain 'Attendance threshold'
  - Expected
  + Received
  - Attendance threshold
  + "use client";
  + import { Input } from "@/components/ui/input";
  +
  + import { learnerCourseAttendanceMonthShortcutVisible } from "@/modules/attendance/learner-course-attendance-month-shortcut-model";
  ```

## tests/unit/learner-placements-chat7-followup.test.ts (1 failing)
- Chat-7 learner placements follow-up > LEARNER-placements-04 never masks missing actionable tasks

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'aria-label="Waiting on you"'
  - Expected
  + Received
  - aria-label="Waiting on you"
  + import Link from "next/link";
  + import { SummaryStrip } from "@/components/ui/summary-strip";
  + import { StatusBadge } from "@/components/ui/status-badge";
  + import type { learnerPlacementDashboard } from "@/modules/placements/learner-dashboard-model";
  ```
