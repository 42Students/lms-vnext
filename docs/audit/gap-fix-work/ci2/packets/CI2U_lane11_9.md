# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat5-final-faculty-courses-b.test.ts (4 failing)
- chat-5 final sprint: teaching surface and discussion parity > FAC-courses-30 has exact composer hint, quick fills, new message notice, and reversible pin without a native confirmation

  ```
  AssertionError: expected '"use client";\nimport { Alert } from …' to contain 'Students can post questions here anyt…'
  - Expected
  + Received
  - Students can post questions here anytime.
  + "use client";
  + import { Alert } from "@/components/ui/alert";
  +
  +
  ```
- chat-5 final sprint: teaching surface and discussion parity > FAC-courses-33 redirects legacy cls deep links only to an assigned matching course and section

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'if(!target)notFound()'
  - Expected
  + Received
  - if(!target)notFound()
  + import Link from "next/link";
  + import {notFound,redirect} from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { FacultyCourseRoster } from "@/components/courses/faculty-course-roster";
  ```
- chat-5 final sprint: teaching surface and discussion parity > FAC-courses-35 groups lesson authoring in accessible details and describes a keyboard-operable summary

  ```
  AssertionError: expected 'import { StatTile } from "@/component…' to contain '<summary aria-label='
  - Expected
  + Received
  - <summary aria-label=
  + import { StatTile } from "@/components/ui/stat-tile";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { Badge } from "@/components/ui/badge";
  + import { assignmentFilesRuntimeEnabled } from "@/modules/courses/assignment-file-readiness";
  ```
- chat-5 final sprint: teaching surface and discussion parity > FAC-courses-R03 shows assigned Credits and Instructor in the course overview even when descriptive text is empty

  ```
  AssertionError: expected 19136 to be greater than 19939
  ❯ tests/unit/chat5-final-faculty-courses-b.test.ts:52:19
  50|   const display=workspace.indexOf("<CourseDisplayReadOnly");
  51|   expect(intro).toBeGreaterThan(0);
  52|   expect(display).toBeGreaterThan(intro);
  |                   ^
  53|  });
  54| });
  ```

## tests/unit/chat6-admin-second-third-lecture-hall-pages.test.ts (1 failing)
- Super Admin second third: actual Lecture Halls server-page states > CHAT6-ADMIN-LECTURES-PAGE-03 passes the authenticated college and validated pagination to both selectors

  ```
  AssertionError: expected '<div class="min-w-0 space-y-4 md:spac…' to contain 'IIT Dharwad'
  - Expected
  + Received
  - IIT Dharwad
  + <div class="min-w-0 space-y-4 md:space-y-6"><header data-slot="page-header" class="mb-2 flex w-full min-w-0 flex-col items-stretch gap-2 border-b border-[var(--lms-canvas-border)] pb-4 md:mb-4 md:flex-row md:items-start md:justify-between md:gap-6 [--lms-page-header-title-size:20px] md:[--lms-page
  ```

## tests/unit/chat6-faculty-assessment-r04-batched-scope.test.ts (1 failing)
- FAC-assessments-R04 faculty assessment listing cost and ownership > FAC-assessments-R04 reads only authorized teaching offerings in bounded batches, without full authoring workspaces

  ```
  AssertionError: expected 'import { and, asc, count, desc, eq, i…' to contain 'ne(courseAssignments.status, "ARCHIVE…'
  - Expected
  + Received
  - ne(courseAssignments.status, "ARCHIVED")
  + import { and, asc, count, desc, eq, inArray, isNull, ne, or } from "drizzle-orm";
  + import { getDb } from "@/db/client";
  + import {
  +   assignmentSubmissions, courseAssignments, courseLearningPaths, courseLessons, courseQuizzes, lessonContents,
  ```

## tests/unit/chat6-independent-finding-actions-round10.test.ts (1 failing)
- Independent audit finding action workflow > SA-placements-projects-121 records version-checked finding edits and reason-required terminal statuses

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```

## tests/unit/chat6-superadmin-middle-drive-ist-date.test.ts (1 failing)
- Super Admin placement drive directory date safety > SA-admin-middle-drives-IST-01 never renders a UTC ISO date fragment for either timestamp

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'adminDriveIstDate(row.job.publishedAt)'
  - Expected
  + Received
  - adminDriveIstDate(row.job.publishedAt)
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {requireSuperAdminSelectedCollege} from "@/modules/admin-ui/super-admin-selected-college";
  + import { AuthorizationError } from "@/modules/permissions/policy";
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
