# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

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

## tests/unit/chat7-legacy-faculty-uploaded-file-copy.test.ts (1 failing)
- Faculty submitted attachment viewer exact legacy copy > provides exact Uploaded File and Open file copy

  ```
  AssertionError: expected '"use client";\nimport { Alert } from …' to contain 'Unable to load this submitted file'
  - Expected
  + Received
  - Unable to load this submitted file
  + "use client";
  + import { Alert } from "@/components/ui/alert";
  + import { EmptyState } from "@/components/ui/empty-state";
  + import { PageLoading } from "@/components/ui/page-loading";
  ```

## tests/unit/chat7-superadmin-assessment-friendly-errors.test.ts (2 failing)
- Super Admin assignment and quiz authoring recoverable errors > SA-academics-people-64 does not expose unexpected API error identifiers while editing and reviewing assignments

  ```
  AssertionError: expected '"use client";\nimport { Input } from …' to contain 'Another author edited the assignment.'
  - Expected
  + Received
  - Another author edited the assignment.
  + "use client";
  + import { Input } from "@/components/ui/input";
  + import { Textarea } from "@/components/ui/textarea";
  + import { Button } from "@/components/ui/button";
  ```
- Super Admin assignment and quiz authoring recoverable errors > SA-academics-people-65 renders friendly failure text for quiz updates and submissions without leaking internal errors

  ```
  AssertionError: expected '"use client";\n\nimport {useEffect,us…' to contain 'Could not load quiz attempts. Check y…'
  - Expected
  + Received
  - Could not load quiz attempts. Check your selected Section and try again.
  + "use client";
  +
  + import {useEffect,useRef,useState} from "react";
  + import {Input} from "@/components/ui/input";
  ```

## tests/unit/chat9-calendar-adaptive-draft.test.ts (2 failing)
- TPO calendar adaptive and draft safety > TPO-calendar-reports-21 keeps unfinished lead notes across accidental navigation prompts

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'onClick={cancelDraft}'
  - Expected
  + Received
  - onClick={cancelDraft}
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { Alert } from "@/components/ui/alert";
  + import { InlineNotice } from "@/components/ui/inline-notice";
  ```
- TPO calendar adaptive and draft safety > TPO-calendar-reports-25 supports keyboard day-hour creation and escape to dismiss the modal

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'role="dialog"'
  - Expected
  + Received
  - role="dialog"
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { Alert } from "@/components/ui/alert";
  + import { InlineNotice } from "@/components/ui/inline-notice";
  ```

## tests/unit/chat9-final-TPO-campaigns-public-28.test.ts (1 failing)
- chat-9 final sprint > TPO-campaigns-public-28 preserves verified functionality and safe failure states

  ```
  AssertionError: expected '"use client";\nimport { PageHeader } …' to contain 'preview.companyName?.trim() || previe…'
  - Expected
  + Received
  - preview.companyName?.trim() || preview.companyDomain
  + "use client";
  + import { PageHeader } from "@/components/ui/page-header";
  +
  + import authStyles from "@/components/public/public-auth-skin.module.css";
  ```

## tests/unit/chat9-round9-report-evidence.test.ts (1 failing)
- chat9 report evidence, filters and privacy > TPO-calendar-reports-43 refuses to fabricate resume/mark verification on the unplaced report

  ```
  AssertionError: expected 'import { Input } from "@/components/u…' to contain 'Academic marks and resume verificatio…'
  - Expected
  + Received
  - Academic marks and resume verification require authoritative evidence
  + import { Input } from "@/components/ui/input";
  + import { SummaryStrip } from "@/components/ui/summary-strip";
  + import { TpoReportPresentation } from "@/components/placements/tpo-report-presentation";
  + import { Button } from "@/components/ui/button";
  ```
