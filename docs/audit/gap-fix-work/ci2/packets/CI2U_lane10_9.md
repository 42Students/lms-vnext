# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat5-final-faculty-courses-a.test.ts (4 failing)
- chat-5 final sprint faculty course list and core lesson contracts > FAC-courses-02 keeps an accessible non-upload initial fallback while real thumbnail persistence remains unavailable

  ```
  AssertionError: expected 'import { Badge } from "@/components/u…' to contain 'import Image from "next/image"'
  - Expected
  + Received
  - import Image from "next/image"
  + import { Badge } from "@/components/ui/badge";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import Link from "next/link";
  + import {FacultyCourseCover} from "./faculty-course-cover";
  ```
- chat-5 final sprint faculty course list and core lesson contracts > FAC-courses-07 debounces course search and immediately submits assigned-period, section and role filters via scoped GET

  ```
  AssertionError: expected 'import { Badge } from "@/components/u…' to contain 'placeholder="Course, code, Section or…'
  - Expected
  + Received
  - placeholder="Course, code, Section or academic period"
  + import { Badge } from "@/components/ui/badge";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import Link from "next/link";
  + import {FacultyCourseCover} from "./faculty-course-cover";
  ```
- chat-5 final sprint faculty course list and core lesson contracts > FAC-courses-10 collapses the lesson blueprint into accessible native accordions with the first lesson initially expanded

  ```
  AssertionError: expected 'import { StatTile } from "@/component…' to contain 'open={selectedLessonId?true:lessonInd…'
  - Expected
  + Received
  - open={selectedLessonId?true:lessonIndex===0?true:undefined}
  + import { StatTile } from "@/components/ui/stat-tile";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { Badge } from "@/components/ui/badge";
  + import { assignmentFilesRuntimeEnabled } from "@/modules/courses/assignment-file-readiness";
  ```
- chat-5 final sprint faculty course list and core lesson contracts > FAC-courses-28 renders contacts and missing-roll copy, sorted roster, and an authorized avatar preview fallback

  ```
  AssertionError: expected '"use client";\n\nimport { useMemo, us…' to contain 'aria-label={"Preview avatar for "+nam…'
  - Expected
  + Received
  - aria-label={"Preview avatar for "+nameOf(learner)}
  + "use client";
  +
  + import { useMemo, useState } from "react";
  + import Link from "next/link";
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

## tests/unit/chat6-cross-page-verification-round4.test.ts (6 failing)
- chat-6 cross-page gap source verification > SA-academics-people-68 filters course progress by course and batch with legacy completion guidance

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' to contain 'SuperAdminLearningFilterFields'
  - Expected
  + Received
  - SuperAdminLearningFilterFields
  + import {Button} from "@/components/ui/button";
  + import {Select} from "@/components/ui/select";
  + import {Input} from "@/components/ui/input";
  + import Link from "next/link";
  ```
- chat-6 cross-page gap source verification > COL-placements-20 provides drive-scoped interview scheduling, statuses and calendar download

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'getCollegeRoundSlotAppointments(conte…'
  - Expected
  + Received
  - getCollegeRoundSlotAppointments(context,jobId)
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { ErrorState } from "@/components/ui/error-state";
  + import {resolveOptionalModuleAccess} from "@/modules/module-access/service";
  ```
- chat-6 cross-page gap source verification > SA-academics-people-72 shows resource editing and archive confirmation without raw API errors

  ```
  AssertionError: expected '"use client";\nimport { Alert } from …' to contain 'transition("ARCHIVE")'
  - Expected
  + Received
  - transition("ARCHIVE")
  + "use client";
  + import { Alert } from "@/components/ui/alert";
  + import { Dialog } from "@/components/ui/dialog";
  + import { LessonResourceMaterialsControl } from "@/components/courses/lesson-resource-materials-control";
  ```
- chat-6 cross-page gap source verification > COL-placements-26 exposes a persisted Hired count and Mark Hired action without inferring joining

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'funnel.totals.HIRED'
  - Expected
  + Received
  - funnel.totals.HIRED
  + import Link from "next/link";
  + import { ErrorState } from "@/components/ui/error-state";
  + import { Alert } from "@/components/ui/alert";
  + import { AuthorizationError } from "@/modules/permissions/policy";
  ```
- chat-6 cross-page gap source verification > SA-academics-people-72 guards unsaved resource changes and uses legacy resource confirmations

  ```
  AssertionError: expected '"use client";\nimport { Alert } from …' to contain 'Discard resource changes?'
  - Expected
  + Received
  - Discard resource changes?
  + "use client";
  + import { Alert } from "@/components/ui/alert";
  + import { Dialog } from "@/components/ui/dialog";
  + import { LessonResourceMaterialsControl } from "@/components/courses/lesson-resource-materials-control";
  ```
- chat-6 cross-page gap source verification > SA-academics-people-79 renders selected-college faculty and student overview metrics from scoped directory counts

  ```
  AssertionError: expected 'import { Select } from "@/components/…' to contain 'peopleFilters?await Promise.all(['
  - Expected
  + Received
  - peopleFilters?await Promise.all([
  + import { Select } from "@/components/ui/select";
  + import { Input } from "@/components/ui/input";
  + import { Button } from "@/components/ui/button";
  + import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
  ```

## tests/unit/chat6-independent-audit-findings-round9.test.ts (1 failing)
- Independent Super Admin audit findings > SA-placements-projects-122 provides Open Release All, multi filters and bounded 50-row paging

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain 'Assigned'
  - Expected
  + Received
  - Assigned
  + import { EmptyState } from "@/components/ui/empty-state";
  + import { Banner } from "@/components/ui/banner";
  + import Link from "next/link";
  + import {Button} from "@/components/ui/button";
  ```

## tests/unit/chat6-superadmin-mentor-role-round3.test.ts (1 failing)
- Mentor faculty role parity > SA-academics-people-115 recognizes real mentor memberships and filters faculty by mentor role

  ```
  AssertionError: expected 'import "server-only";\nimport {and,as…' to contain 'query.employmentType.toLowerCase()===…'
  - Expected
  + Received
  - query.employmentType.toLowerCase()==="mentor"
  + import "server-only";
  + import {and,asc,count,eq,exists,ilike,or,sql} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  + import {aliasedColumn} from "@/db/aliased-column";
  ```

## tests/unit/chat6-tracker-theme-nav-verification.test.ts (1 failing)
- 42 Tracker manager navigation theme parity > SA-placements-projects-112 provides exact tracker navigation, skip link and a working keyboard-operable Light / Dark toggle

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
