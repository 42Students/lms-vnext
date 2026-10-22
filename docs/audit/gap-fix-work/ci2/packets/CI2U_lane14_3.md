# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/UX-college-projects-create-01.test.ts (1 failing)
- UX-college-projects-create-01 /college/projects/create > renders accessible recovery for missing membership and preserves a real creation form

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'Select a college to continue.'
  - Expected
  + Received
  - Select a college to continue.
  + import Link from "next/link";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {CreateProjectControl} from "@/components/projects/project-create-control";
  + import {ClassTeamWorkspaceCreator} from "@/components/projects/class-team-workspace-creator";
  ```

## tests/unit/UX-courses-college-catalogue-tables-01.test.ts (2 failing)
- UX-courses-college-catalogue-tables-01 responsive DataTable semantics > college assessment grid preserves submit counts, grades, quiz release, review and offering navigation

  ```
  AssertionError: expected 'import { Input } from "@/components/u…' to contain 'collegeResultsLabel(Boolean(item.resu…'
  - Expected
  + Received
  - collegeResultsLabel(Boolean(item.resultsPublished))
  + import { Input } from "@/components/ui/input";
  + import { Select } from "@/components/ui/select";
  + import { Button } from "@/components/ui/button";
  + import Link from "next/link";
  ```
- UX-courses-college-catalogue-tables-01 responsive DataTable semantics > college content grid retains selected-college metadata only, material counts, preview and visibility actions

  ```
  AssertionError: expected 'import { Input } from "@/components/u…' to contain 'caption={title+" catalogue"}'
  - Expected
  + Received
  - caption={title+" catalogue"}
  + import { Input } from "@/components/ui/input";
  + import { Button } from "@/components/ui/button";
  + import { Select } from "@/components/ui/select";
  + import Link from "next/link";
  ```

## tests/unit/UX-learn-attendance-month-01.test.ts (1 failing)
- UX-learn-attendance-month-01 /learn/attendance course-month history > unmarked classes never silently count toward the marked percentage, and missing data is explained

  ```
  AssertionError: expected '"use client";\nimport { Input } from …' to contain 'Try selecting a different month.'
  - Expected
  + Received
  - Try selecting a different month.
  + "use client";
  + import { Input } from "@/components/ui/input";
  +
  + import { learnerCourseAttendanceMonthShortcutVisible } from "@/modules/attendance/learner-course-attendance-month-shortcut-model";
  ```

## tests/unit/UX-projects-mentor-overlays-01.test.ts (1 failing)
- UX-projects-mentor-overlays-01 dialog interaction and unsaved changes > mentor-meeting-reschedule preserves edited time when confirmation is cancelled

  ```
  AssertionError: expected '"use client";\nimport {useId,useState…' to contain 'if(!next&&!pending)setOpen(true)'
  - Expected
  + Received
  - if(!next&&!pending)setOpen(true)
  + "use client";
  + import {useId,useState} from "react";
  + import {useRouter} from "next/navigation";
  + import {Button} from "@/components/ui/button";
  ```

## tests/unit/UX-teacher-chat-scroll-motion.test.ts (1 failing)
- UX-teacher-scroll-motion-04 exposes chat scroll edge fades and reduces imperative smooth motion

  ```
  AssertionError: expected '"use client";\nimport { Alert } from …' to contain 'motion-safe:animate-pulse'
  - Expected
  + Received
  - motion-safe:animate-pulse
  + "use client";
  + import { Alert } from "@/components/ui/alert";
  +
  +
  ```

## tests/unit/UX-teacher-pages-round4.test.ts (7 failing)
- UX teacher and teach rollout final eight route source contracts > UX-teacher-report-assignment-contentId-01 keeps reconciled score distributions, submission reviews and CSV exports

  ```
  AssertionError: expected 'import { MetricBar } from "@/componen…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { MetricBar } from "@/components/ui/metric-bar";
  + import styles from "@/components/courses/faculty-report-legacy-charts.module.css";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { assignmentFilesRuntimeEnabled } from "@/modules/courses/assignment-file-readiness";
  ```
- UX teacher and teach rollout final eight route source contracts > UX-teacher-report-assignment-contentId-submissions-01 keeps Section scoping, publication sorting and paged submissions

  ```
  AssertionError: expected 'import { Pagination } from "@/compone…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { Pagination } from "@/components/ui/pagination";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { Input } from "@/components/ui/input";
  + import {Button} from "@/components/ui/button";
  ```
- UX teacher and teach rollout final eight route source contracts > UX-teacher-report-quiz-quizId-01 keeps exact report heading and assessment eligibility results

  ```
  AssertionError: expected 'import { MetricBar } from "@/componen…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { MetricBar } from "@/components/ui/metric-bar";
  + import styles from "@/components/courses/faculty-report-legacy-charts.module.css";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import {FacultyReportBackButton} from "@/components/courses/faculty-report-back-button";
  ```
- UX teacher and teach rollout final eight route source contracts > UX-teacher-report-quiz-quizId-attempts-01 keeps published/private quiz availability and authorized drilldown

  ```
  AssertionError: expected 'import { Pagination } from "@/compone…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { Pagination } from "@/components/ui/pagination";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { Input } from "@/components/ui/input";
  + import {Button} from "@/components/ui/button";
  ```
- UX teacher and teach rollout final eight route source contracts > UX-teacher-response-followups-01 keeps overdue published assessment scope and CSV export

  ```
  AssertionError: expected 'import { Pagination } from "@/compone…' not to contain 'min-h-9'
  - Expected
  + Received
  - min-h-9
  + import { Pagination } from "@/components/ui/pagination";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { Select } from "@/components/ui/select";
  + import { Input } from "@/components/ui/input";
  ```
- UX teacher and teach rollout final eight route source contracts > UX-teacher-results-01 keeps scoped recorded rates, friendly empty states and exact labels

  ```
  AssertionError: expected 'import { Pagination } from "@/compone…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { Pagination } from "@/components/ui/pagination";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { Button } from "@/components/ui/button";
  + import { Input } from "@/components/ui/input";
  ```
- UX teacher and teach rollout final eight route source contracts > UX-teach-courses-deliveryId-01 keeps FacultyCourseWorkspace and scoped not-found behavior

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import Link from "next/link";
  + import { notFound } from "next/navigation";
  + import { courseSectionDeliveryIdSchema } from "@/modules/courses/validation";
  + import { hidesFacultyCourseRouteError } from "@/modules/courses/faculty-course-route-errors";
  ```
