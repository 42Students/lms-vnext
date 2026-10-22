# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/HR-BREAK-chat15-recruiter-change-requests-page-40.test.tsx (1 failing)
- HR-CHANGE-REQUESTS-PAGE-40 protected recruiter drive page rendering > uses authenticated context and scoped job ID before showing company change requests

  ```
  AssertionError: expected '<div class="min-w-0 max-w-full space-…' to contain 'Back to drive'
  Expected: "Back to drive"
  Received: "<div class="min-w-0 max-w-full space-y-4"><h1>Graduate Engineer · Change requests</h1><nav aria-label="Drive communication" class="flex flex-wrap gap-4 border-b border-border pb-3 text-sm font-semibold"><a href="/recruiter/drives">Drives</a><a href="/recruiter/drives/123e4567-e89b-42d3-a4
  ```

## tests/unit/PROJ-BREAK-chat9-admin-project-sections.test.tsx (1 failing)
- Super Admin last-third Project detail role and route guard > PROJ-BREAK-ux-39 whitelisted at-risk and submission referrals preserve navigation safely

  ```
  AssertionError: expected { …(10) } to match object { mode: 'ADMIN', …(5) }
  (5 matching properties omitted from actual)
  - Expected
  + Received
  {
  "activeSection": "delivery",
  "backHref": "/admin/projects/at-risk",
  "backLabel": "Back to at-risk projects",
  ```

## tests/unit/UX-admin-courses-content-audit-01.test.ts (2 failing)
- UX-admin-courses-content-audit-01 Super Admin scoped courses and content > UX-admin-assignments-quizzes-01 requires scoped college and preserves builder/editor and failure states

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'listCollegeAssessmentAggregate(contex…'
  - Expected
  + Received
  - listCollegeAssessmentAggregate(context, "ASSIGNMENT"
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {isSuperAdmin} from "@/modules/identity/context";
  + import { EmptyState } from "@/components/ui/empty-state";
  ```
- UX-admin-courses-content-audit-01 Super Admin scoped courses and content > UX-admin-course-progress-01 distinguishes measured activity from fabricated completion

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'No completion percentage is inferred'
  - Expected
  + Received
  - No completion percentage is inferred
  + import Link from "next/link";
  + import {redirect} from "next/navigation";
  + import {and,asc,eq,sql} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  ```

## tests/unit/UX-college-college-lessons-01.test.ts (1 failing)
- UX-college-college-lessons-01 ensures route-safe responsive navigation

  ```
  AssertionError: expected 'import { Alert } from "@/components/u…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { Alert } from "@/components/ui/alert";
  + import { Tabs } from "@/components/ui/tabs";
  + import { loadCourseScope } from "@/modules/courses/scope";
  + import {LessonPageSizePreference} from "@/components/courses/lesson-page-size-preference";
  ```

## tests/unit/UX-superadmin-legacy-01.test.ts (1 failing)
- UX-superadmin-legacy-01 > preserves original wording, permissions and supported accessible UX

  ```
  AssertionError: expected 'import { createHash } from "node:cryp…' to contain 'if(!destination)notFound();'
  - Expected
  + Received
  - if(!destination)notFound();
  + import { createHash } from "node:crypto";
  + import { and, eq, isNull, sql } from "drizzle-orm";
  + import { notFound, redirect } from "next/navigation";
  + import { ErrorState } from "@/components/ui/error-state";
  ```

## tests/unit/UX-tracker-issues-publicId-01.test.ts (1 failing)
- UX-tracker-issues-publicId-01 > preserves original wording, permissions and supported accessible UX

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'min-h-11'
  - Expected
  + Received
  - min-h-11
  + import Link from "next/link";
  + import {TrackerIssueCopyActions} from "@/components/tracker/tracker-issue-copy-actions";
  + import {TrackerReporterIssueDetail} from "@/components/tracker/tracker-reporter-issue-detail";
  + import {TrackerScreenshotGallery} from "@/components/tracker/tracker-screenshot-gallery";
  ```

## tests/unit/chat12-academic-import-conflict-round7.test.ts (1 failing)
- TPO Students academic import resilience > TPO-students-33 protects an academic import preview and preserves selections on a stale-version response

  ```
  AssertionError: expected '"use client";\nimport {Checkbox} from…' to contain 'Your academic import choices are kept…'
  - Expected
  + Received
  - Your academic import choices are kept below
  + "use client";
  + import {Checkbox} from "@/components/ui/checkbox";
  + import {Textarea} from "@/components/ui/textarea";
  + import {DataTable} from "@/components/ui/data-table";
  ```

## tests/unit/chat13-academic-attendance-policy.test.ts (1 failing)
- Super Admin Academic Attendance > SA-academics-people-32 preserves exact legacy attendance-policy copy and accessible errors

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'role={failed?"alert":"status"}'
  - Expected
  + Received
  - role={failed?"alert":"status"}
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { Alert } from "@/components/ui/alert";
  + import {useToast} from "@/components/ui/toast";
  ```
