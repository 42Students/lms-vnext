# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat4-college-ux-round7.test.ts (3 failing)
- Chat-4 college UX round seven > UX-college-lecture-halls-01 supports accessible narrow-screen presentation

  ```
  AssertionError: expected 'import { Input } from "@/components/u…' to contain 'min-w-0 overflow-x-clip space-y'
  - Expected
  + Received
  - min-w-0 overflow-x-clip space-y
  + import { Input } from "@/components/ui/input";
  + import { Button } from "@/components/ui/button";
  + import { Select } from "@/components/ui/select";
  + import Link from "next/link";
  ```
- Chat-4 college UX round seven > UX-college-lecture-halls-hallId-01 supports accessible narrow-screen presentation

  ```
  AssertionError: expected 'import { notFound } from "next/naviga…' to contain 'min-w-0 overflow-x-clip space-y'
  - Expected
  + Received
  - min-w-0 overflow-x-clip space-y
  + import { notFound } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { PageBackLink } from "@/components/ui/page-back-link";
  ```
- Chat-4 college UX round seven > UX-college-lessons-01 supports accessible narrow-screen presentation

  ```
  AssertionError: expected 'import { Alert } from "@/components/u…' to contain 'min-w-0 overflow-x-clip space-y'
  - Expected
  + Received
  - min-w-0 overflow-x-clip space-y
  + import { Alert } from "@/components/ui/alert";
  + import { Tabs } from "@/components/ui/tabs";
  + import { loadCourseScope } from "@/modules/courses/scope";
  + import {LessonPageSizePreference} from "@/components/courses/lesson-page-size-preference";
  ```

## tests/unit/chat4-superadmin-college-subpages-role-audit.test.ts (2 failing)
- Super Admin college and tenant subpage threat and state audit > SA-COL-AUDIT-01 branding requires Super Admin scope and validates college before fetching stored URLs

  ```
  AssertionError: expected -1 to be greater than 1221
  ❯ tests/unit/chat4-superadmin-college-subpages-role-audit.test.ts:31:25
  29|     expect(guard).toBeGreaterThan(-1);
  30|     expect(id).toBeGreaterThan(guard);
  31|     expect(readPreview).toBeGreaterThan(id);
  |                         ^
  32|     expect(branding).toContain("if (!branding) notFound()");
  33|     expect(branding).toContain('can(context,"college.manage",{collegeI…
  ```
- Super Admin college and tenant subpage threat and state audit > SA-COL-AUDIT-03 verification protects college ID before reading queue and does not fabricate availability

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'Invalid verification filters.'
  - Expected
  + Received
  - Invalid verification filters.
  + import Link from "next/link";
  + import {eq} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  + import {profileVerificationSettings} from "@/db/schema/profile-verification";
  ```

## tests/unit/chat6-admin-second-third-page-contracts.test.ts (3 failing)
- Super Admin second-third page entrypoints and ownership guards > CHAT6-ADMIN-PAGE placements/hiring keeps its server authorization or secured delegate

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'AdminScopedReadPage'
  - Expected
  + Received
  - AdminScopedReadPage
  + import { redirect } from "next/navigation";
  + /** Legacy Hiring Dashboard address. The scoped report with KPI, funnel and
  +  * company sections is the Analytics page; do not treat job-count list as the
  +  * original dashboard or synthesize three incompatible legacy API responses. */
  ```
- Super Admin second-third page entrypoints and ownership guards > CHAT6-ADMIN-PAGE placements/interviews keeps its server authorization or secured delegate

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'AdminScopedReadPage'
  - Expected
  + Received
  - AdminScopedReadPage
  + import Link from "next/link";
  + import {and,eq,inArray,sql} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  + import {
  ```
- Super Admin second-third page entrypoints and ownership guards > CHAT6-ADMIN-PAGES-01 keeps authorization in the common paged renderer itself

  ```
  AssertionError: expected 'import { Select } from "@/components/…' to contain 'Directory unavailable'
  - Expected
  + Received
  - Directory unavailable
  + import { Select } from "@/components/ui/select";
  + import { Input } from "@/components/ui/input";
  + import { Button } from "@/components/ui/button";
  + import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
  ```

## tests/unit/chat6-faculty-round2.test.ts (1 failing)
- chat-6 faculty assessments round 2 > FAC-assessments-24 submissions drawer shows quiz title count and legacy empty copy

  ```
  AssertionError: expected '"use client";\nimport { Alert } from …' to contain 'title={quizTitle??"Submissions"}'
  - Expected
  + Received
  - title={quizTitle??"Submissions"}
  + "use client";
  + import { Alert } from "@/components/ui/alert";
  +
  + import {useEffect,useRef,useState} from "react";
  ```

## tests/unit/chat6-superadmin-lecture-hall-role-24.test.tsx (1 failing)
- SA-middle-lecture-halls-24 platform role and selected college > scoped Super Admin gets a bounded empty room listing and selected-college loader

  ```
  AssertionError: expected '<div class="min-w-0 space-y-4 md:spac…' to contain 'IIT Dharwad'
  - Expected
  + Received
  - IIT Dharwad
  + <div class="min-w-0 space-y-4 md:space-y-6"><header data-slot="page-header" class="mb-2 flex w-full min-w-0 flex-col items-stretch gap-2 border-b border-[var(--lms-canvas-border)] pb-4 md:mb-4 md:flex-row md:items-start md:justify-between md:gap-6 [--lms-page-header-title-size:20px] md:[--lms-page
  ```

## tests/unit/chat7-admin-learning-directory-resilience.test.ts (1 failing)
- SA-COURSES-CONTENT-AUDIT-03 lessons and progress list resilience > preserves an authorized directory after optional picker outage, but never presents failed data as empty

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'parseSuperAdminLearningQuery(raw)'
  - Expected
  + Received
  - parseSuperAdminLearningQuery(raw)
  + import Link from "next/link";
  + import { Button } from "@/components/ui/button";
  + import { Input } from "@/components/ui/input";
  + import { Select } from "@/components/ui/select";
  ```

## tests/unit/chat7-learner-results-service-scoping.test.ts (3 failing)
- COURSES7-07 / COURSES7-08 learner owner isolation and historical submission continuity > uses quiz ID and own membership, after authorizing the requested delivery

  ```
  TypeError: getDb(...).select(...).from(...).where(...).orderBy(...).limit is not a function
  ❯ Module.getMyQuizAttempts src/modules/courses/quiz-attempt-service.ts:529:6
  527|     )
  528|     .orderBy(desc(quizAttempts.attemptNumber),desc(quizAttempts.id))
  529|     .limit(100).offset((page-1)*100);
  |      ^
  530|
  531|   const reveal = mayRevealLearnerResults(
  ```
- COURSES7-07 / COURSES7-08 learner owner isolation and historical submission continuity > does not reveal answer keys just because an open quiz has a stale published flag

  ```
  TypeError: getDb(...).select(...).from(...).where(...).orderBy(...).limit is not a function
  ❯ Module.getMyQuizAttempts src/modules/courses/quiz-attempt-service.ts:529:6
  527|     )
  528|     .orderBy(desc(quizAttempts.attemptNumber),desc(quizAttempts.id))
  529|     .limit(100).offset((page-1)*100);
  |      ^
  530|
  531|   const reveal = mayRevealLearnerResults(
  ```
- COURSES7-07 / COURSES7-08 learner owner isolation and historical submission continuity > reveals score and correctness only after CLOSED plus explicit result release

  ```
  TypeError: getDb(...).select(...).from(...).where(...).orderBy(...).limit is not a function
  ❯ Module.getMyQuizAttempts src/modules/courses/quiz-attempt-service.ts:529:6
  527|     )
  528|     .orderBy(desc(quizAttempts.attemptNumber),desc(quizAttempts.id))
  529|     .limit(100).offset((page-1)*100);
  |      ^
  530|
  531|   const reveal = mayRevealLearnerResults(
  ```

## tests/unit/chat7-superadmin-assessment-export-filter-parity.test.ts (1 failing)
- Super Admin assessment filtered export contracts > SA-academics-people-64/65 pages use the shared filtered export link rather than dropping scope

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'adminAssessmentExportHref("QUIZ",quer…'
  - Expected
  + Received
  - adminAssessmentExportHref("QUIZ",query.data)
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {isSuperAdmin} from "@/modules/identity/context";
  + import {requireSuperAdminSelectedCollege} from "@/modules/admin-ui/super-admin-selected-college";
  ```
