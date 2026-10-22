# CI unit-test packet (round 8)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/faculty-courses-chat7-acceptance.test.ts (1 failing)
- Faculty Courses verified source contracts > FAC-courses-05 maintains the faculty course behavior

  ```
  AssertionError: expected 'import { Badge } from "@/components/u…' to contain 'Teaching assignment(s)'
  - Expected
  + Received
  - Teaching assignment(s)
  + import { Badge } from "@/components/ui/badge";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import Link from "next/link";
  + import {FacultyCourseCover} from "./faculty-course-cover";
  ```

## tests/unit/proj-break-chat9-services.test.ts (1 failing)
- IIT Dharwad Projects adversarial service and route contracts > PROJ-BREAK-ux-01 admin and college Project screens preserve explicit empty/denied UX, no raw crash

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'title="Workspaces"'
  - Expected
  + Received
  - title="Workspaces"
  + import Link from "next/link";
  + import {redirect} from "next/navigation";
  + import {AuthorizationError} from "@/modules/permissions/policy";
  +
  ```
