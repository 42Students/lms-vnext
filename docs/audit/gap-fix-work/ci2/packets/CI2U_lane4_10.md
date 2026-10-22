# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat7-learner-assessment-feed-privacy.test.ts (5 failing)
- LEARNER-ASSESSMENT-FEED-PRIVACY-01 selected course dashboard projection > never queries the database for a learner with no authorized deliveries

  ```
  AssertionError: expected { assignments: [], quizzes: [], …(1) } to deeply equal { assignments: [], quizzes: [] }
  - Expected
  + Received
  {
  "assignments": [],
  "quizzes": [],
  +   "totals": {
  +     "assignments": 0,
  ```
- LEARNER-ASSESSMENT-FEED-PRIVACY-01 selected course dashboard projection > never exposes privately saved grades or feedback before publish, even when graded

  ```
  TypeError: db.select(...).from(...).innerJoin(...).innerJoin(...).innerJoin(...).leftJoin(...).where(...).orderBy is not a function
  ❯ Module.listOwnLearnerAssessmentRows src/modules/courses/learner-assessment-flat-query.ts:47:5
  45|     eq(assignmentSubmissions.membershipId,membershipId)))
  46|    .where(and(...baseConditions,eq(courseAssignments.status,"PUBLISHED…
  47|    .orderBy(sql`coalesce(${courseAssignments.dueAt},'infinity'::timest…
  |     ^
  48|      courseAssignments.title,courseAssignments.id)
  49|    .limit(pageSize).offset(offset),
  ```
- LEARNER-ASSESSMENT-FEED-PRIVACY-01 selected course dashboard projection > reveals an explicitly published score only after the persisted flag changes

  ```
  TypeError: db.select(...).from(...).innerJoin(...).innerJoin(...).innerJoin(...).leftJoin(...).where(...).orderBy is not a function
  ❯ Module.listOwnLearnerAssessmentRows src/modules/courses/learner-assessment-flat-query.ts:47:5
  45|     eq(assignmentSubmissions.membershipId,membershipId)))
  46|    .where(and(...baseConditions,eq(courseAssignments.status,"PUBLISHED…
  47|    .orderBy(sql`coalesce(${courseAssignments.dueAt},'infinity'::timest…
  |     ^
  48|      courseAssignments.title,courseAssignments.id)
  49|    .limit(pageSize).offset(offset),
  ```
- LEARNER-ASSESSMENT-FEED-PRIVACY-01 selected course dashboard projection > does not reveal even flagged quiz results until both the deadline and close rule hold

  ```
  TypeError: db.select(...).from(...).innerJoin(...).innerJoin(...).innerJoin(...).leftJoin(...).where(...).orderBy is not a function
  ❯ Module.listOwnLearnerAssessmentRows src/modules/courses/learner-assessment-flat-query.ts:47:5
  45|     eq(assignmentSubmissions.membershipId,membershipId)))
  46|    .where(and(...baseConditions,eq(courseAssignments.status,"PUBLISHED…
  47|    .orderBy(sql`coalesce(${courseAssignments.dueAt},'infinity'::timest…
  |     ^
  48|      courseAssignments.title,courseAssignments.id)
  49|    .limit(pageSize).offset(offset),
  ```
- LEARNER-ASSESSMENT-FEED-PRIVACY-01 selected course dashboard projection > does not invent a passed quiz on a closed/missed attempt, or allow retries on closed quizzes

  ```
  TypeError: db.select(...).from(...).innerJoin(...).innerJoin(...).innerJoin(...).leftJoin(...).where(...).orderBy is not a function
  ❯ Module.listOwnLearnerAssessmentRows src/modules/courses/learner-assessment-flat-query.ts:47:5
  45|     eq(assignmentSubmissions.membershipId,membershipId)))
  46|    .where(and(...baseConditions,eq(courseAssignments.status,"PUBLISHED…
  47|    .orderBy(sql`coalesce(${courseAssignments.dueAt},'infinity'::timest…
  |     ^
  48|      courseAssignments.title,courseAssignments.id)
  49|    .limit(pageSize).offset(offset),
  ```

## tests/unit/chat7-legacy-faculty-quiz-report-copy.test.ts (2 failing)
- Faculty QuizReportContent.jsx dev legacy headings and empty states > preserves dynamic report title and exact legacy section names

  ```
  AssertionError: expected 'import { MetricBar } from "@/componen…' to contain '<PageHeader title={quiz.title} />'
  - Expected
  + Received
  - <PageHeader title={quiz.title} />
  + import { MetricBar } from "@/components/ui/metric-bar";
  + import styles from "@/components/courses/faculty-report-legacy-charts.module.css";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import {FacultyReportBackButton} from "@/components/courses/faculty-report-back-button";
  ```
- Faculty QuizReportContent.jsx dev legacy headings and empty states > uses exact empty text without claiming unreleased question results are visible

  ```
  AssertionError: expected 'import { MetricBar } from "@/componen…' to contain 'latest attempt only'
  - Expected
  + Received
  - latest attempt only
  + import { MetricBar } from "@/components/ui/metric-bar";
  + import styles from "@/components/courses/faculty-report-legacy-charts.module.css";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import {FacultyReportBackButton} from "@/components/courses/faculty-report-back-button";
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

## tests/unit/chat9-attendance-department-entry.test.ts (1 failing)
- attendance department report entry > is reachable from the Attendance tab without inventing a new group tab

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'href="/college/attendance/departments"'
  - Expected
  + Received
  - href="/college/attendance/departments"
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { isSuperAdmin } from "@/modules/identity/context";
  + import { z } from "zod";
  ```

## tests/unit/chat9-final-TPO-campaigns-public-27.test.ts (1 failing)
- chat-9 final sprint > TPO-campaigns-public-27 preserves verified functionality and safe failure states

  ```
  AssertionError: expected 'import "server-only";\n\nimport { cre…' to contain 'scope === "COMPANY" && !companyJoinEm…'
  - Expected
  + Received
  - scope === "COMPANY" && !companyJoinEmailCandidate
  + import "server-only";
  +
  + import { createHash, createHmac } from "node:crypto";
  + import {companyDomainAcceptsMail} from "../company-mail-domain-resolver";
  ```

## tests/unit/chat9-round9-report-actions.test.ts (1 failing)
- chat9 TPO report drilldowns and presentation > TPO-calendar-reports-44 sends authorized batch and branch to the Students subset with an honest scope disclaimer

  ```
  AssertionError: expected 'import { Input } from "@/components/u…' to contain 'it is not an exhaustive filter of eve…'
  - Expected
  + Received
  - it is not an exhaustive filter of every unplaced student
  + import { Input } from "@/components/ui/input";
  + import { SummaryStrip } from "@/components/ui/summary-strip";
  + import { TpoReportPresentation } from "@/components/placements/tpo-report-presentation";
  + import { Button } from "@/components/ui/button";
  ```
