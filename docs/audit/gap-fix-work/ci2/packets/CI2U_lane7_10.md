# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat7-learner-course-delivery-security.test.ts (2 failing)
- LEARNER-courses-roster-01 active course and elective ownership matrix > includes only explicitly authorized group electives and never duplicates host-section visibility

  ```
  AssertionError: expected [ { …(2) } ] to deeply equal [ { …(2) }, { …(2) } ]
  - Expected
  + Received
  [
  {
  "courseName": "Core",
  "deliveryId": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  },
  ```
- LEARNER-courses-roster-01 active course and elective ownership matrix > enforces exact offering cohort and period against persisted section and program rows

  ```
  AssertionError: expected 'import {\n  and,\n  asc,\n  desc,\n  …' to contain 'eq(sections.cohortId,courseOfferings.…'
  - Expected
  + Received
  - eq(sections.cohortId,courseOfferings.cohortId)
  + import {
  +   and,
  +   asc,
  +   desc,
  ```

## tests/unit/chat7-legacy-learner-courses-copy.test.ts (1 failing)
- legacy Learner My Courses copy — legacy-copy-A course listing and Header > uses legacy Back to courses wording in the course workspace and recovery pages

  ```
  AssertionError: expected 'import { Banner } from "@/components/…' not to contain 'Back to Courses'
  - Expected
  + Received
  - Back to Courses
  + import { Banner } from "@/components/ui/banner";
  + import { CoursesServiceError } from "@/modules/courses/errors";
  + import { AuthorizationError } from "@/modules/permissions/policy";
  + import { ZodError } from "zod";
  ```

## tests/unit/chat7-superadmin-content-live-datetime-parity.test.ts (2 failing)
- SA-academics-people-58 live meeting IST/UTC calendar integrity > rejects unknown user-supplied zone values instead of guessing UTC

  ```
  AssertionError: expected '2099-01-01T20:30:00.000Z' to be null
  - Expected:
  null
  + Received:
  "2099-01-01T20:30:00.000Z"
  ```
- SA-academics-people-58 live meeting IST/UTC calendar integrity > rejects invalid date before calling the content PATCH endpoint and keeps the user's edit open

  ```
  AssertionError: expected 4418 to be less than -1
  ❯ tests/unit/chat7-superadmin-content-live-datetime-parity.test.ts:39:46
  37|   expect(source).toContain("parseAdminContentLocalMoment(endsAt,timeZo…
  38|   expect(source).toContain('if(!start||!end){setError("Enter a valid d…
  39|   expect(source.indexOf("if(!start||!end)")).toBeLessThan(source.index…
  |                                              ^
  40|   expect(source).toContain('className="min-h-11');
  41|   expect(source).not.toContain("min-h-10");
  ```

## tests/unit/chat9-calendar-event-legend.test.ts (1 failing)
- TPO Calendar kind legend > TPO-calendar-reports-11 renders counted color chips and supports multi-kind selection

  ```
  AssertionError: expected 'import {TpoWeekHourCalendar} from "@/…' to contain 'name="kind"'
  - Expected
  + Received
  - name="kind"
  + import {TpoWeekHourCalendar} from "@/components/placements/tpo-week-hour-calendar";
  + import {TPO_OWNER_PAGE_COPY} from "@/modules/placements/tpo-page-copy";
  + import Link from "next/link";
  +
  ```

## tests/unit/chat9-owner-decision-scope-parity.test.ts (1 failing)
- Owner-approved improvements over obsolete legacy workflows > COL-projects-05 preserves recoverable archive and restore instead of a competing delete implementation

  ```
  AssertionError: expected '"use client";\nimport {useEffect,useR…' to contain 'Archived workspaces can be reopened w…'
  - Expected
  + Received
  - Archived workspaces can be reopened with all of their content.
  + "use client";
  + import {useEffect,useRef,useState} from "react";
  + import {useRouter} from "next/navigation";
  + import {Button} from "@/components/ui/button";
  ```

## tests/unit/chat9-super-admin-academic-existing-gap-closure.test.ts (5 failing)
- Super Admin Academic Setup gap reconciliation > SA-academics-people-07 rejects missing or oversized department names without raw server codes

  ```
  AssertionError: expected '"use client";\n\nimport { useEffect, …' to contain 'Department was not created.'
  - Expected
  + Received
  - Department was not created.
  + "use client";
  +
  + import { useEffect, useRef, useState } from "react";
  + import { useGuardedAction } from "@/hooks/use-guarded-action";
  ```
- Super Admin Academic Setup gap reconciliation > SA-academics-people-08 blocks dependency-unsafe department deletion before the request

  ```
  AssertionError: expected '"use client";\n\nimport {\n  useRef,\…' to contain 'usage.programs + usage.courses + usag…'
  - Expected
  + Received
  - usage.programs + usage.courses + usage.faculty
  + "use client";
  +
  + import {
  +   useRef,
  ```
- Super Admin Academic Setup gap reconciliation > SA-academics-people-13 restores program creation copy and links to scoped Departments

  ```
  AssertionError: expected '"use client";\n\nimport { useEffect, …' to contain 'href="/admin/departments"'
  - Expected
  + Received
  - href="/admin/departments"
  + "use client";
  +
  + import { useEffect, useState, useTransition, useSyncExternalStore, type FormEvent } from "react";
  + import { usePathname, useRouter } from "next/navigation";
  ```
- Super Admin Academic Setup gap reconciliation > SA-academics-people-37 uses exact empty state copy for departments and lecture halls

  ```
  AssertionError: expected '"use client";\n\nimport { Select } fr…' to contain 'No departments found. Create a colleg…'
  - Expected
  + Received
  - No departments found. Create a college first, then add departments.
  + "use client";
  +
  + import { Select } from "@/components/ui/select";
  + import { DEPARTMENT_COPY } from "@/modules/admin-ui/department-copy";
  ```
- Super Admin Academic Setup gap reconciliation > SA-academics-people-44 derives a bounded program code rather than making it mandatory in the UI

  ```
  AssertionError: expected '"use client";\n\nimport { useEffect, …' to contain 'code.trim() || deriveSuperAdminProgra…'
  - Expected
  + Received
  - code.trim() || deriveSuperAdminProgramCode(name)
  + "use client";
  +
  + import { useEffect, useState, useTransition, useSyncExternalStore, type FormEvent } from "react";
  + import { usePathname, useRouter } from "next/navigation";
  ```
