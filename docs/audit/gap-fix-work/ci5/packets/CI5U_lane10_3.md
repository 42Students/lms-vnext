# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat4-remaining-queue-revalidation-round.test.ts (2 failing)
- chat-4 remaining source contracts after final-sprint split > SA-placements-projects-75 shows persisted audit summary, export, and event details

  ```
  AssertionError: expected 'import { getCurrentRequestContext } f…' to contain '<ActivityCenter'
  - Expected
  + Received
  - <ActivityCenter
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {type ReactNode} from "react";
  + import {ProjectAuditRefreshButton} from "@/components/projects/project-audit-filters";
  + import {StatusBadge} from "@/components/ui/status-badge";
  ```
- chat-4 remaining source contracts after final-sprint split > SA-placements-projects-71 keeps pending-age, reviewer evidence, scoped export, and mentor reassignment

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain 'Reassign mentor'
  - Expected
  + Received
  - Reassign mentor
  + import { EmptyState } from "@/components/ui/empty-state";
  + import Link from "next/link";
  + import { safeProjectExternalHref } from "@/modules/projects/mentor-workspace-evidence-model";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```

## tests/unit/chat5-next-batch-states.test.ts (1 failing)
- Chat5 next batch states > TPO-batches-17 renders accessible batch card skeleton and retry without falsely reporting changed decisions

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'Couldn&apos;t refresh batches'
  - Expected
  + Received
  - Couldn&apos;t refresh batches
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { ErrorState } from "@/components/ui/error-state";
  + import { PageHeader } from "@/components/ui/page-header";
  ```

## tests/unit/chat6-college-placements-read-parity.test.ts (1 failing)
- College Admin placement register and drive parity > COL-placements-07 College pipeline table exposes legacy email college source applied date age and match score

  ```
  AssertionError: expected '"use client";\nimport Link from "next…' to contain 'No persisted match score available'
  - Expected
  + Received
  - No persisted match score available
  + "use client";
  + import Link from "next/link";
  + import {Dialog} from "@/components/ui/dialog";
  + import {ConfirmDialog} from "@/components/ui/confirm-dialog";
  ```

## tests/unit/chat6-learner-profile-round2-verified.test.ts (2 failing)
- Learner profile and notifications fixed-on-main parity evidence > LEARNER-profile-misc-07 restores exact legacy section headings

  ```
  AssertionError: expected '"use client";\nimport {LEARNER_EDUCAT…' to contain 'Education/Qualification'
  - Expected
  + Received
  - Education/Qualification
  + "use client";
  + import {LEARNER_EDUCATION_TYPES,learnerQualifyingExamSuggestions,LEARNER_QUALIFYING_EXAM_DETAILS,learnerEducationValidationProblem} from "@/modules/people/learner-education-picker-model";
  + import {LearnerSkillCatalogInput} from "@/components/profile/learner-skill-catalog-input";
  + import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
  ```
- Learner profile and notifications fixed-on-main parity evidence > LEARNER-profile-misc-13 provides skill catalogue searching instead of free text only

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'Search and select skills...'
  - Expected
  + Received
  - Search and select skills...
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import {useEffect,useId,useRef,useState} from "react";
  + import { Input } from "@/components/ui/input";
  ```

## tests/unit/chat6-superadmin-people-parity-verified.test.ts (2 failing)
- Super Admin legacy people roster verified gaps > SA-academics-people-104 People Directory exposes legacy All contacts Faculty and Students tabs

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'aria-label="People directory tabs"'
  - Expected
  + Received
  - aria-label="People directory tabs"
  + import Link from "next/link";
  + import { SuperAdminPeopleCsvControl } from "@/components/admin/super-admin-people-csv-control";
  + import { superAdminPeopleExportHref } from "@/modules/people/admin-users-export-model";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```
- Super Admin legacy people roster verified gaps > SA-academics-people-113 recruiter list shows status counts actions and terminate sessions drawer

  ```
  AssertionError: expected '"use client";\n\nimport {\n  useRef,\…' to contain 'statusSummary.archived'
  - Expected
  + Received
  - statusSummary.archived
  + "use client";
  +
  + import {
  +   useRef,
  ```

## tests/unit/chat7-learner-assessment-result-release.test.ts (7 failing)
- COURSES7-06 learner assessment results are released only after official publication > no authorized delivery IDs means no database reads and no results

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
- COURSES7-06 learner assessment results are released only after official publication > keeps graded but unreleased assignment points and feedback private

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
- COURSES7-06 learner assessment results are released only after official publication > reveals only explicitly published assignment feedback

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
- COURSES7-06 learner assessment results are released only after official publication > quiz PUBLISHED, release flag true => learner visibility false

  ```
  
  ```
- COURSES7-06 learner assessment results are released only after official publication > quiz PUBLISHED, release flag false => learner visibility false

  ```
  
  ```
- COURSES7-06 learner assessment results are released only after official publication > quiz CLOSED, release flag false => learner visibility false

  ```
  
  ```
- COURSES7-06 learner assessment results are released only after official publication > quiz CLOSED, release flag true => learner visibility true

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

## tests/unit/chat7-mentor-meeting-draft-lifecycle.test.ts (2 failing)
- MEN-projects-meetings-27 meeting draft lifecycle > MEN-projects-meetings-27 makes draft private and never notifies learners when cancelled

  ```
  AssertionError: expected 'import {\n  and,\n  asc,\n  eq,\n  in…' to contain 'inArray(projectMeetings.status, ["DRA…'
  - Expected
  + Received
  - inArray(projectMeetings.status, ["DRAFT", "REQUESTED", "SCHEDULED","RESCHEDULED"])
  + import {
  +   and,
  +   asc,
  +   eq,
  ```
- MEN-projects-meetings-27 meeting draft lifecycle > MEN-projects-meetings-27 does not announce manager-only facilitator changes

  ```
  AssertionError: expected 'import {\n  and,\n  asc,\n  eq,\n  in…' to contain 'targetStatus==="RESCHEDULED" && exist…'
  - Expected
  + Received
  - targetStatus==="RESCHEDULED" && existing && existing.status!=="RESCHEDULED"
  + import {
  +   and,
  +   asc,
  +   eq,
  ```

## tests/unit/chat7-superadmin-course-catalogue-touch-pagination.test.ts (1 failing)
- SA-COURSES-TOUCH-13 Super Admin course catalogue mobile filters and safe pagination > renders accessible 44px Super Admin filters and all touch/keyboard course actions

  ```
  AssertionError: expected 'import { FilterBar } from "@/componen…' to contain 'Previous'
  - Expected
  + Received
  - Previous
  + import { FilterBar } from "@/components/ui/filter-bar";
  + import { StatTile } from "@/components/ui/stat-tile";
  + import { Alert } from "@/components/ui/alert";
  + import { Disclosure } from "@/components/ui/disclosure";
  ```
