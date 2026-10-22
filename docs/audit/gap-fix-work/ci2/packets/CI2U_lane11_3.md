# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/UX-college-programs-01.test.ts (1 failing)
- /college/programs UX > UX-college-programs-02 preserves responsive or failure recovery contract

  ```
  AssertionError: expected 'import { Alert } from "@/components/u…' to contain 'aria-label="Archived programs"'
  - Expected
  + Received
  - aria-label="Archived programs"
  + import { Alert } from "@/components/ui/alert";
  + import { ErrorState } from "@/components/ui/error-state";
  + import {AuthorizationError} from "@/modules/permissions/policy";
  + import Link from "next/link";
  ```

## tests/unit/UX-college-videos-01.test.ts (1 failing)
- /college/videos UX > UX-college-videos-01 preserves responsive or failure recovery contract

  ```
  AssertionError: expected 'import {CollegeCourseMissingScope} fr…' to contain 'Export filtered video metadata CSV'
  - Expected
  + Received
  - Export filtered video metadata CSV
  + import {CollegeCourseMissingScope} from "@/components/courses/college-course-missing-scope";
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { CollegeContentAggregate } from "@/components/courses/college-content-aggregate";
  ```

## tests/unit/UX-kit-role-and-overlay-chat17.test.tsx (3 failing)
- UX-kit-HARDEN-23 authorization boundaries and WebView history > UX-kit-HARDEN-36 redacts mixed-permission hidden cells and never exposes denied detail links

  ```
  AssertionError: expected '<div data-slot="data-table" class="mi…' to contain 'href="/college/projects/allowed/detai…'
  Expected: "href="/college/projects/allowed/details""
  Received: "<div data-slot="data-table" class="min-w-0"><div data-slot="scroll-cue" data-axis="x" data-scroll-start="false" data-scroll-end="false" class="relative min-w-0 min-w-0 md:rounded-[var(--lms-radius-md)] md:border md:border-[var(--lms-canvas-border)]"><div tabindex="-1" class="min-w-0 overf
  ```
- UX-kit-HARDEN-23 authorization boundaries and WebView history > UX-kit-HARDEN-45 explicit mobile-hidden fields never appear in expanded mobile details

  ```
  AssertionError: expected '<div data-slot="data-table" class="mi…' to contain 'More details'
  Expected: "More details"
  Received: "<div data-slot="data-table" class="min-w-0"><div data-slot="scroll-cue" data-axis="x" data-scroll-start="false" data-scroll-end="false" class="relative min-w-0 min-w-0 md:rounded-[var(--lms-radius-md)] md:border md:border-[var(--lms-canvas-border)]"><div tabindex="-1" class="min-w-0 overf
  ```
- UX-kit-HARDEN-23 authorization boundaries and WebView history > UX-kit-HARDEN-32 external evidence rejects backslash, trailing whitespace and embedded controls

  ```
  AssertionError: expected '<span class="inline-flex min-w-0 flex…' not to contain 'target="_blank"'
  Expected: "target="_blank""
  Received: "<span class="inline-flex min-w-0 flex-col gap-[var(--lms-space-2)]"><a href="https://example.test/proof%20one" target="_blank" rel="noopener noreferrer" class="inline-flex min-h-11 md:min-h-[var(--lms-control-height)] items-center rounded-[var(--lms-control-radius)] border border-[var(--l
  ```

## tests/unit/UX-mentor-reports-01.test.ts (1 failing)
- Mentor UX cross-audit /mentor/reports > UX-mentor-reports-02 preserves exact legacy labels and navigable pagination

  ```
  AssertionError: expected 'import { FilterBar } from "@/componen…' to contain 'title="Assigned Project reports"'
  - Expected
  + Received
  - title="Assigned Project reports"
  + import { FilterBar } from "@/components/ui/filter-bar";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Pagination } from "@/components/ui/pagination";
  ```

## tests/unit/UX-teacher-allquizzes-coverage-01.test.ts (1 failing)
- Faculty UX route /teacher/allQuizzes > UX-teacher-allquizzes-01: retains routing, access and learner-facing states

  ```
  AssertionError: expected 'import { assignmentFilesRuntimeEnable…' to contain 'aria-label="Quiz report shortcuts"'
  - Expected
  + Received
  - aria-label="Quiz report shortcuts"
  + import { assignmentFilesRuntimeEnabled } from "@/modules/courses/assignment-file-readiness";
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { FacultyAssessmentOverview } from "@/components/courses/faculty-assessment-overview";
  ```

## tests/unit/UX-teacher-pages-round1.test.ts (6 failing)
- UX teacher rollout first ten route source contracts > UX-teacher-allQuizzes-01 keeps initialQuizId deep link unchanged

  ```
  AssertionError: expected 'import { assignmentFilesRuntimeEnable…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { assignmentFilesRuntimeEnabled } from "@/modules/courses/assignment-file-readiness";
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { FacultyAssessmentOverview } from "@/components/courses/faculty-assessment-overview";
  ```
- UX teacher rollout first ten route source contracts > UX-teacher-calendar-01 keeps IST month query, validation and schedule unchanged

  ```
  AssertionError: expected 'import { DateInput } from "@/componen…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { DateInput } from "@/components/ui/date-input";
  + import { Select } from "@/components/ui/select";
  + import {Button} from "@/components/ui/button";
  + import {Disclosure} from "@/components/ui/disclosure";
  ```
- UX teacher rollout first ten route source contracts > UX-teacher-contacts-contactsTab-01 keeps search and role filters unchanged

  ```
  AssertionError: expected 'import { Select } from "@/components/…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { Select } from "@/components/ui/select";
  + import { Button } from "@/components/ui/button";
  + import Link from "next/link";
  + import { redirect } from "next/navigation";
  ```
- UX teacher rollout first ten route source contracts > UX-teacher-contacts-contactsTab-membershipId-01 keeps contact privacy and directory return query unchanged

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import Link from "next/link";
  + import {notFound} from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { PageHeader } from "@/components/ui/page-header";
  ```
- UX teacher rollout first ten route source contracts > UX-teacher-courses-01 keeps faculty course list and real Section scope unchanged

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import Link from "next/link";
  + import { parseFacultyCourseListLocation } from "@/modules/courses/faculty-course-list-model";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { FacultyCourseList } from "@/components/courses/faculty-course-list";
  ```
- UX teacher rollout first ten route source contracts > UX-teacher-courses-deliveryId-assessment-health-01 keeps source-backed published health data and empty text unchanged

  ```
  AssertionError: expected 'import { Select } from "@/components/…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { Select } from "@/components/ui/select";
  + import {Button} from "@/components/ui/button";
  + import Link from "next/link";
  +
  ```
