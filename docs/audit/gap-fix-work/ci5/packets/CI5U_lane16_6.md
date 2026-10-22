# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/ux-admin-chat9-batch-02.test.ts (3 failing)
- chat-9 last-third admin UX rollout, batch 02 > UX-admin-projects-templates-01 preserves verified shared UX contract

  ```
  AssertionError: expected 'import { Badge } from "@/components/u…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { Badge } from "@/components/ui/badge";
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { PageHeader } from "@/components/ui/page-header";
  ```
- chat-9 last-third admin UX rollout, batch 02 > UX-admin-projects-templates-template-id-01 preserves verified shared UX contract

  ```
  AssertionError: expected 'import { PageBackLink } from "@/compo…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { PageBackLink } from "@/components/ui/page-back-link";
  + import Link from "next/link";
  +
  + import { ProjectsServiceError } from "@/modules/projects/errors";
  ```
- chat-9 last-third admin UX rollout, batch 02 > UX-admin-projects-templates-template-id-colleges-01 preserves verified shared UX contract

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import Link from "next/link";
  + import { notFound } from "next/navigation";
  + import { resolveTemplateCollegeLegacyId, TemplateCollegeReadError } from "@/modules/projects/template-college-availability-service";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```

## tests/unit/ux-learn-chat7-batch-01.test.ts (6 failing)
- UX learner route batch 1 > UX-learn-learn-allAssignments-assignmentId-01 maintains source and route boundaries

  ```
  AssertionError: expected 'import { Button } from "@/components/…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { Button } from "@/components/ui/button";
  + import { assignmentFilesRuntimeEnabled } from "@/modules/courses/assignment-file-readiness";
  + import Link from "next/link";
  + import { learnerAssignmentPublishedGradeLabel } from "@/modules/courses/learner-assignment-grade-label-model";
  ```
- UX learner route batch 1 > UX-learn-learn-allQuizzes-01 maintains source and route boundaries

  ```
  AssertionError: expected 'import { getCurrentRequestContext } f…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {
  +   LearnerAssessmentOverview,
  +   type LearnerQuizOverviewItem,
  ```
- UX learner route batch 1 > UX-learn-learn-allQuizzes-quizId-01 maintains source and route boundaries

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import Link from "next/link";
  + import { notFound } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { PageHeader } from "@/components/ui/page-header";
  ```
- UX learner route batch 1 > UX-learn-learn-attendance-01 maintains source and route boundaries

  ```
  AssertionError: expected 'import { Suspense } from "react";\nim…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { Suspense } from "react";
  + import { z } from "zod";
  + import { ErrorState } from "@/components/ui/error-state";
  + import { AuthorizationError } from "@/modules/permissions/policy";
  ```
- UX learner route batch 1 > UX-learn-learn-attendance-calendar-01 maintains source and route boundaries

  ```
  AssertionError: expected 'import { FilterBar } from "@/componen…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { FilterBar } from "@/components/ui/filter-bar";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { SummaryStrip } from "@/components/ui/summary-strip";
  + import { Button } from "@/components/ui/button";
  ```
- UX learner route batch 1 > UX-learn-learn-calendar-01 maintains source and route boundaries

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import Link from "next/link";
  + import { notFound } from "next/navigation";
  + import { resolveOwnLearnerCalendarFilters } from "@/modules/academics/learner-calendar-filter-model";
  + import {learnerCalendarQuerySchema} from "@/modules/academics/learner-calendar-filter-model";
  ```
