# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/mentor-activity-round4.test.ts (1 failing)
- chat-11 mentor activity and resource parity > MEN-projects-meetings-61 humanizes activity type, category and empties

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'No project activity yet. Task moves'
  - Expected
  + Received
  - No project activity yet. Task moves
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { EmptyState } from "@/components/ui/empty-state";
  + import { Input } from "@/components/ui/input";
  ```

## tests/unit/placement-report-accreditation.test.ts (1 failing)
- accreditation evidence CSV > counts unique placed learners while preserving offer records

  ```
  AssertionError: expected +0 to be 1 // Object.is equality
  - Expected
  + Received
  - 1
  + 0
  ```

## tests/unit/public-join-client-error-model.test.ts (1 failing)
- REC-calendar-messages-profile-R04/39/45 join errors > rejects mismatched domain and invalid mobile locally

  ```
  AssertionError: expected null to be 'Use your example.org email address fo…' // Object.is equality
  - Expected:
  "Use your example.org email address for this link."
  + Received:
  null
  ```

## tests/unit/sa-semester-management-route.test.ts (1 failing)
- SA-academics-people-14 semester admin workspace > mounts the existing create, edit and delete controls on the Super Admin page

  ```
  AssertionError: expected 'import { AcademicSetupSteps } from "@…' to contain 'listCollegeSemesters(context, parsed.…'
  - Expected
  + Received
  - listCollegeSemesters(context, parsed.data)
  + import { AcademicSetupSteps } from "@/components/admin/academic-setup-steps";
  + import { SemesterRefreshBoundary } from "@/components/admin/semester-refresh-boundary";
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```

## tests/unit/super-admin-template-plan-editor.test.ts (2 failing)
- SA-placements-projects-83 Sprint repeating editor > renaming the sprint preserves its tasks and rejects deleting a populated sprint

  ```
  AssertionError: the given combination of arguments (null and string) is invalid for this assertion. You can use an array, a map, an object, a set, a string, or a weakset instead of a string
  ❯ tests/unit/super-admin-template-plan-editor.test.ts:33:63
  31|     const renamed = updateTemplateSprint(parse(), 0, { key: "sprint-ne…
  32|     expect(renamed.tasks[0].sprintKey).toBe("sprint-new");
  33|     expect(removeTemplateSprint(renamed, "sprint-new").error).toContai…
  |                                                               ^
  34|     expect(projectTemplateBlueprintSchema.safeParse(renamed).success).…
  35|   });
  ```
- SA-placements-projects-84 Task repeating editor > validates priority, sprint reference, and 1-13 point estimates

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```

## tests/unit/tpo-batches-lifecycle-chat5-round4.test.ts (1 failing)
- TPO batch retirement and recovery > GR-35 and GR-90 confirm retirement by keyboard-reachable checkbox rather than window.confirm

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'type="checkbox"'
  - Expected
  + Received
  - type="checkbox"
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import {InlineNotice} from "@/components/ui/inline-notice";
  + import { Checkbox } from "@/components/ui/checkbox";
  ```

## tests/unit/tpo-drives-gap-closure.test.ts (1 failing)
- TPO Drives independently inspected legacy gap contracts > TPO-drives-22 create and edit pages use exact Create drive and Edit drive names

  ```
  AssertionError: expected 'import { Disclosure } from "@/compone…' to contain 'Back to drives'
  - Expected
  + Received
  - Back to drives
  + import { Disclosure } from "@/components/ui/disclosure";
  + import type { ReactNode } from "react";
  + import Link from "next/link";
  + import {and,desc,eq,inArray,isNull,sql} from "drizzle-orm";
  ```

## tests/unit/tpo-spreadsheet-mounted-surfaces.test.ts (1 failing)
- TPO spreadsheet mounted on authorized Students and Applications > mounts real reusable grid and URL filter panel on both canonical TPO pages

  ```
  AssertionError: expected '"use client";\nimport {Checkbox} from…' to contain '<TpoGridFilterPanel'
  - Expected
  + Received
  - <TpoGridFilterPanel
  + "use client";
  + import {Checkbox} from "@/components/ui/checkbox";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import {Select} from "@/components/ui/select";
  ```
