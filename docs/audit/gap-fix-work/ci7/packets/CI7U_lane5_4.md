# CI unit-test packet (round 7)

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

## tests/unit/learner-placement-parity.test.ts (1 failing)
- learner placement route parity > keeps every old learner placement sub-route materialized with real content

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'LearnerCareerCalendar'
  - Expected
  + Received
  - LearnerCareerCalendar
  + import { redirect } from "next/navigation";
  + import { z } from "zod";
  + import { parseLearnerCareerDate } from "@/modules/placements/learner-career-date-model";
  +
  ```

## tests/unit/projects-phase2-exact-tabs.test.ts (1 failing)
- Phase2 exact legacy Projects labels + single tab strip > has one workspace-level Admin tab strip, not the list-level strip too

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to contain 'ProjectAdminNav'
  - Expected
  + Received
  - ProjectAdminNav
  + import Link from "next/link";
  + import { notFound } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {isSuperAdmin} from "@/modules/identity/context";
  ```

## tests/unit/tpo-batches-40-chat5.test.ts (1 failing)
- TPO batch eligibility import presentation > TPO-batches-40 uses an accessible modal and exact import copy without raw identifiers

  ```
  AssertionError: expected '"use client";\nimport { Tabs } from "…' to contain 'disabled={busy||preview.ready===0||un…'
  - Expected
  + Received
  - disabled={busy||preview.ready===0||unresolved>0||!acknowledged}
  + "use client";
  + import { Tabs } from "@/components/ui/tabs";
  + import { InlineNotice } from "@/components/ui/inline-notice";
  + import { Checkbox } from "@/components/ui/checkbox";
  ```
