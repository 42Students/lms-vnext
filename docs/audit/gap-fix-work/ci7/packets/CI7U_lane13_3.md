# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat6-independent-finding-actions-round10.test.ts (1 failing)
- Independent audit finding action workflow > SA-placements-projects-121 records version-checked finding edits and reason-required terminal statuses

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```

## tests/unit/chat7-legacy-faculty-assessments-copy.test.ts (1 failing)
- Faculty My Assignments and My Quizzes legacy headers > allAssignments uses exact Faculty legacy H1 rather than Learner All

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

## tests/unit/chat9-college-projects-contracts-round8.test.ts (1 failing)
- chat9 college projects scope and persistence contracts > COL-projects-07 enforces a mentor for ACTIVE creation and permits scoped class roster choices

  ```
  AssertionError: expected '"use client";\n\nimport { type FormEv…' to contain ']).slice(0,500)'
  - Expected
  + Received
  - ]).slice(0,500)
  + "use client";
  +
  + import { type FormEvent, useEffect, useRef, useState } from "react";
  + import { useRouter } from "next/navigation";
  ```

## tests/unit/college-contacts-denial-before-filters.test.ts (1 failing)
- College Contacts role-first denial > checks active account role before resolving user-supplied filters

  ```
  AssertionError: expected 'import { DateInput } from "@/componen…' to match /if\(!context\.membership\…/dashboard"\)
  - Expected:
  /if\(!context\.membership\|\|!hasMembershipRole\(context,"COLLEGE_ADMIN"\)\)redirect\("\/dashboard"\)/
  + Received:
  "import { DateInput } from \"@/components/ui/date-input\";
  import { Input } from \"@/components/ui/input\";
  import { Disclosure } from \"@/components/ui/disclosure\";
  import { Button } from \"@/components/ui/button\";
  ```
