# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

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

## tests/unit/learner-jobs-browse-parity.test.ts (1 failing)
- Learner Drives browse integration > preserves URL search/back navigation and does not mutate applications on filter

  ```
  AssertionError: expected '"use client";\n\nimport { useCallback…' to contain 'Eligible only'
  - Expected
  + Received
  - Eligible only
  + "use client";
  +
  + import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
  + import {Disclosure} from "@/components/ui/disclosure";
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

## tests/unit/tpo-accreditation-students.test.ts (2 failing)
- TPO-calendar-reports-33 NAAC student evidence > emits one row per placed student, best accepted CTC and offer count

  ```
  AssertionError: expected [] to have a length of 1 but got +0
  - Expected
  + Received
  - 1
  + 0
  ```
- TPO-calendar-reports-33 NAAC student evidence > never exports duplicate accepted offers or spreadsheet formulas unsafely

  ```
  TypeError: Cannot read properties of undefined (reading 'offersHeld')
  ❯ tests/unit/tpo-accreditation-students.test.ts:22:18
  20|    {...base,offerId:"1",name:"=IMPORTXML()",status:"ACCEPTED",annualCt…
  21|   ]);
  22|   expect(rows[0].offersHeld).toBe(1);
  |                  ^
  23|   const csv=accreditationStudentCsv(rows);
  24|   expect(csv).toContain("Employer contact");
  ```
