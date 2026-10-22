# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/college-classes-export-model.test.ts (2 failing)
- College classes safe CSV export > validates filters and excludes client-selected tenant and paging

  ```
  AssertionError: expected 9007199254740991 to be 1000 // Object.is equality
  - Expected
  + Received
  - 1000
  + 9007199254740991
  ```
- College classes safe CSV export > neutralizes formulas, quotes cells, BOM-prefixes and flags truncation

  ```
  TypeError: Cannot read properties of undefined (reading 'replaceAll')
  ❯ escapeActivityCsvCell src/modules/activity/college-activity-export-model.ts:31:24
  29| export function escapeActivityCsvCell(value: string): string {
  30|   const neutral = /^[\s]*[=+@\-\t\r]/.test(value) ? "'" + value : valu…
  31|   return '"' + neutral.replaceAll('"', '""') + '"';
  |                        ^
  32| }
  33|
  ```

## tests/unit/college-project-blocked-risk-r01.test.ts (1 failing)
- COL-projects-10 / COL-projects-11 persisted task risk > never treats archived or completed projects as active risk

  ```
  AssertionError: expected [ 'Active blocker', 'Pending review' ] to deeply equal []
  - Expected
  + Received
  - []
  + [
  +   "Active blocker",
  +   "Pending review",
  + ]
  ```

## tests/unit/faculty-legacy-wording.test.ts (2 failing)
- Faculty legacy wording (lists.js, CoursesContent, QuizzesContent, AssignmentsContent) > page headings are My Courses / My Quizzes / My Assignments

  ```
  AssertionError: expected 'import { assignmentFilesRuntimeEnable…' to contain 'title="My Assignments"'
  - Expected
  + Received
  - title="My Assignments"
  + import { assignmentFilesRuntimeEnabled } from "@/modules/courses/assignment-file-readiness";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {RetainedFacultyAssignments} from "@/components/courses/faculty-assignments-retention";
  + import { getFacultyAssessmentOverview } from "@/modules/courses/faculty-assessment-service";
  ```
- Faculty legacy wording (lists.js, CoursesContent, QuizzesContent, AssignmentsContent) > Contacts heading follows the selected tab

  ```
  AssertionError: expected 'import { Select } from "@/components/…' to contain 'title={selected.label}'
  - Expected
  + Received
  - title={selected.label}
  + import { Select } from "@/components/ui/select";
  + import { Button } from "@/components/ui/button";
  + import Link from "next/link";
  + import { redirect } from "next/navigation";
  ```

## tests/unit/graceful-mutation-adoption-round4.test.ts (3 failing)
- chat-14 guarded mutation adoption > GR-30 GR-31 guards department creation and retains accessible validation and success

  ```
  AssertionError: expected '"use client";\n\nimport { useEffect, …' to contain 'void run(async () => {'
  - Expected
  + Received
  - void run(async () => {
  + "use client";
  +
  + import { useEffect, useRef, useState } from "react";
  + import { useGuardedAction } from "@/hooks/use-guarded-action";
  ```
- chat-14 guarded mutation adoption > GR-30 GR-31 preserves resource confirmation and server message while serializing completion

  ```
  AssertionError: expected '"use client";\nimport { Badge } from …' to contain 'setComplete(true)'
  - Expected
  + Received
  - setComplete(true)
  + "use client";
  + import { Badge } from "@/components/ui/badge";
  +
  +
  ```
- chat-14 guarded mutation adoption > GR-30 GR-31 protects TPO follow-up creation and retains entered details on failure

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'setError("Could not save the follow-u…'
  - Expected
  + Received
  - setError("Could not save the follow-up")
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { InlineNotice } from "@/components/ui/inline-notice";
  + import { Input } from "@/components/ui/input";
  ```

## tests/unit/learner-career-kind-count-model.test.ts (1 failing)
- learner calendar month totals > counts only events in selected IST month

  ```
  AssertionError: expected { total: 1, assessments: 1, …(3) } to deeply equal { total: 1, assessments: 1, …(2) }
  - Expected
  + Received
  {
  "assessments": 1,
  "interviews": 0,
  "other": 0,
  +   "talks": 0,
  ```

## tests/unit/learner-offer-action-errors.test.ts (1 failing)
- non-leaking learner offer action failures > does not reveal existence on role or college denial

  ```
  AssertionError: expected 'Only learners can respond to their ow…' to contain 'current account'
  Expected: "current account"
  Received: "Only learners can respond to their own offers. Switch to your learner workspace."
  ```
