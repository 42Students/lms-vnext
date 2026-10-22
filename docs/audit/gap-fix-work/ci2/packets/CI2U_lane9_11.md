# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/college-academic-setup-gap-verification.test.ts (5 failing)
- College Academic Setup source acceptance > COL-academic-setup-04 verified academic workflow

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'Waitlist:'
  - Expected
  + Received
  - Waitlist:
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { Select } from "@/components/ui/select";
  + import { Input } from "@/components/ui/input";
  ```
- College Academic Setup source acceptance > COL-academic-setup-05 verified academic workflow

  ```
  AssertionError: expected 'import type { ReactNode } from "react…' to contain 'Pick:'
  - Expected
  + Received
  - Pick:
  + import type { ReactNode } from "react";
  + import { FilterBar } from "@/components/ui/filter-bar";
  + import { Button } from "@/components/ui/button";
  + import { Disclosure } from "@/components/ui/disclosure";
  ```
- College Academic Setup source acceptance > COL-academic-setup-07 verified academic workflow

  ```
  AssertionError: expected '"use client";\n\nimport { Select } fr…' to contain 'Semester course mapping updated.'
  - Expected
  + Received
  - Semester course mapping updated.
  + "use client";
  +
  + import { Select } from "@/components/ui/select";
  + import { Input } from "@/components/ui/input";
  ```
- College Academic Setup source acceptance > COL-academic-setup-13 verified academic workflow

  ```
  AssertionError: expected '"use client";\n\nimport Link from "ne…' to contain 'Academic setup · Step'
  - Expected
  + Received
  - Academic setup · Step
  + "use client";
  +
  + import Link from "next/link";
  + import { Tabs } from "@/components/ui/tabs";
  ```
- College Academic Setup source acceptance > COL-academic-setup-38 verified academic workflow

  ```
  AssertionError: expected '"use client";\n\nimport { useRouter }…' to contain 'title="Archive lecture hall"'
  - Expected
  + Received
  - title="Archive lecture hall"
  + "use client";
  +
  + import { useRouter } from "next/navigation";
  + import Link from "next/link";
  ```

## tests/unit/college-export-cap-messages.test.ts (3 failing)
- College Admin export cap disclosures > Electives export UI discloses the same bounded cap as the exporter

  ```
  AssertionError: expected 'import { collegeDirectoryValidationMe…' to contain 'flex flex-wrap items-center gap-3'
  - Expected
  + Received
  - flex flex-wrap items-center gap-3
  + import { collegeDirectoryValidationMessage } from "@/modules/academics/college-directory-validation";
  + import Link from "next/link";
  + import {isSuperAdmin} from "@/modules/identity/context";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```
- College Admin export cap disclosures > Semesters export UI discloses the same bounded cap as the exporter

  ```
  AssertionError: expected 'import { collegeDirectoryValidationMe…' to contain 'flex flex-wrap items-center gap-3'
  - Expected
  + Received
  - flex flex-wrap items-center gap-3
  + import { collegeDirectoryValidationMessage } from "@/modules/academics/college-directory-validation";
  + import Link from "next/link";
  + import { Banner } from "@/components/ui/banner";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```
- College Admin export cap disclosures > Batches export UI discloses the same bounded cap as the exporter

  ```
  AssertionError: expected 'import { collegeDirectoryValidationMe…' to contain 'flex flex-wrap items-center gap-3'
  - Expected
  + Received
  - flex flex-wrap items-center gap-3
  + import { collegeDirectoryValidationMessage } from "@/modules/academics/college-directory-validation";
  + import Link from "next/link";
  + import {isSuperAdmin} from "@/modules/identity/context";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```

## tests/unit/faculty-attendance-grid-model.test.ts (2 failing)
- W02 Faculty attendance daily aggregation > collapses a mixed two-session day to the legacy 1/2 ratio with accessible detail

  ```
  AssertionError: expected { code: 'MIXED', …(7) } to deeply equal { code: 'MIXED', …(7) }
  - Expected
  + Received
  @@ -1,9 +1,9 @@
  {
  "absent": 1,
  "code": "MIXED",
  -   "label": "1 present, 1 absent, 0 not marked of 2 sessions",
  ```
- W02 Faculty attendance daily aggregation > treats absence evidence as marked for imported sessions lacking session metadata

  ```
  AssertionError: expected { code: 'P', label: 'Present', …(6) } to match object { code: 'A', absent: 1, notMarked: +0 }
  (5 matching properties omitted from actual)
  - Expected
  + Received
  {
  -   "absent": 1,
  -   "code": "A",
  +   "absent": 0,
  ```

## tests/unit/faculty-schedule-editor-model.test.ts (2 failing)
- Faculty attendance schedule editor > round trips a stored instant into IST independently of the device

  ```
  Error: Cannot schedule a class in the past
  ❯ facultyScheduleInstants src/modules/attendance/faculty-schedule-editor-model.ts:27:11
  25|   // separate correction authority, never by relaxing create validatio…
  26|   if(!original&&new Date(startsAt).getTime()<Date.now())
  27|     throw new Error("Cannot schedule a class in the past");
  |           ^
  28|   if(new Date(endsAt).getTime()-new Date(startsAt).getTime()>12*60*60*…
  29|     throw new Error("A single class session cannot exceed 12 hours");
  ```
- Faculty attendance schedule editor > rejects missing, invalid and reversed session windows

  ```
  AssertionError: expected 'Cannot schedule a class in the past' to be null
  - Expected:
  null
  + Received:
  "Cannot schedule a class in the past"
  ```

## tests/unit/inbound-mail-message-model.test.ts (1 failing)
- inbound mail search > rejects unknown filters and unbounded pages

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```

## tests/unit/learner-drive-deadline-urgency-model.test.ts (1 failing)
- learner drive persisted deadline urgency > never claims a deadline without persisted evidence

  ```
  AssertionError: expected 'Closed 17 Oct 2026' to be 'Deadline listed' // Object.is equality
  Expected: "Deadline listed"
  Received: "Closed 17 Oct 2026"
  ```
