# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/UX-college-projects-workspaces-01.test.ts (2 failing)
- /college/projects/workspaces UX > UX-college-projects-workspaces-01 retains safe route or shared-workspace UX

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'redirect("/college/projects")'
  - Expected
  + Received
  - redirect("/college/projects")
  + import { redirect } from "next/navigation";
  +
  + /** Preserve old Workspaces bookmarks and the selected project filter/tab context. */
  + export default async function LegacyCollegeWorkspacesRedirect({searchParams}:{
  ```
- /college/projects/workspaces UX > UX-college-projects-workspaces-02 retains safe route or shared-workspace UX

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'Canonical College Admin Workspaces'
  - Expected
  + Received
  - Canonical College Admin Workspaces
  + import { redirect } from "next/navigation";
  +
  + /** Preserve old Workspaces bookmarks and the selected project filter/tab context. */
  + export default async function LegacyCollegeWorkspacesRedirect({searchParams}:{
  ```

## tests/unit/UX-courses-learner-quiz-table-01.test.ts (2 failing)
- UX-courses-learner-quiz-table-01 /learn/allQuizzes > renders one shared DataTable with quiz-only rows, mobile priorities and explicit empty text

  ```
  AssertionError: expected '"use client";\nimport { StatTile } fr…' to contain 'caption="Quiz list"'
  - Expected
  + Received
  - caption="Quiz list"
  + "use client";
  + import { StatTile } from "@/components/ui/stat-tile";
  + import styles from "./learner-assessment-metrics.module.css";
  + import { AssessmentMetricGlyph } from "./learner-assessment-metric-glyph";
  ```
- UX-courses-learner-quiz-table-01 /learn/allQuizzes > retains published-results privacy, independent attempt history and deadline-safe quiz actions

  ```
  AssertionError: expected '"use client";\nimport { StatTile } fr…' to contain 'item.resultsPublished?"View result":"…'
  - Expected
  + Received
  - item.resultsPublished?"View result":"Not released"
  + "use client";
  + import { StatTile } from "@/components/ui/stat-tile";
  + import styles from "./learner-assessment-metrics.module.css";
  + import { AssessmentMetricGlyph } from "./learner-assessment-metric-glyph";
  ```

## tests/unit/UX-login-01.test.ts (1 failing)
- UX-login-01 secure OTP entry > provides phone-first bounded skeleton and public rather than dashboard-only error recovery

  ```
  AssertionError: expected 'import { PublicPageLoading } from "@/…' to contain 'min-h-dvh'
  - Expected
  + Received
  - min-h-dvh
  + import { PublicPageLoading } from "@/components/public/public-page-loading";
  +
  + /** Branded public loading with a bounded reload action on slow requests. */
  + export default function Loading() {
  ```

## tests/unit/UX-projects-tables-chat14.test.ts (2 failing)
- UX-projects-tables-chat14 responsive and accessible data tables > UX-projects-table-01 preserves preflight duplicate decisions and cohort outcome results

  ```
  AssertionError: expected '"use client";\nimport { EmptyState } …' to contain 'row.status==="TO_CREATE"?"To create"'
  - Expected
  + Received
  - row.status==="TO_CREATE"?"To create"
  + "use client";
  + import { EmptyState } from "@/components/ui/empty-state";
  + import { useEffect, useRef, useState } from "react";
  + import { useRouter } from "next/navigation";
  ```
- UX-projects-tables-chat14 responsive and accessible data tables > UX-projects-table-02 retains unsubmitted action, ageing and empty copy

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain 'Math.max(0,Math.floor((renderedAt.get…'
  - Expected
  + Received
  - Math.max(0,Math.floor((renderedAt.getTime()-row.updatedAt.getTime())/86400000))
  + import { EmptyState } from "@/components/ui/empty-state";
  + import Link from "next/link";
  + import { safeProjectExternalHref } from "@/modules/projects/mentor-workspace-evidence-model";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```

## tests/unit/UX-teacher-courses-deliveryid-assignments-manage-coverage-01.test.ts (1 failing)
- UX-teacher-courses-deliveryid-assignments-manage-01 /teacher/courses/[deliveryId]/assignments/manage enforces page access and feedback contracts

  ```
  AssertionError: expected 'import {getCurrentRequestContext} fro…' to contain '<PageHeader eyebrow="Faculty · Course…'
  - Expected
  + Received
  - <PageHeader eyebrow="Faculty · Courses" title="Section assignments"
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {getFacultyCourseWorkspace} from "@/modules/courses/faculty-course-service";
  + import {facultyAssignmentParamsSchema} from "@/modules/courses/faculty-assignment-authoring-model";
  + import {FacultyAssignmentEditor} from "@/components/courses/faculty-assignment-editor";
  ```

## tests/unit/UX-teacher-profile-details-coverage-01.test.ts (1 failing)
- UX-teacher-profile-details-01 /teacher/profile/details keeps access and honest feedback

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain '<PageHeader eyebrow="Faculty · Profil…'
  - Expected
  + Received
  - <PageHeader eyebrow="Faculty · Profile" title="About & details"
  + import Link from "next/link";
  + import { notFound, redirect } from "next/navigation";
  + import { Banner } from "@/components/ui/banner";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```
