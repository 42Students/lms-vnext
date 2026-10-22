# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

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

## tests/unit/chat9-phase2-college-group-tabs.test.ts (1 failing)
- college group tabs exact legacy navigation labels > COL-academic-setup-13 keeps the academic-period overview reachable without inventing a legacy tab

  ```
  AssertionError: expected 'import { AcademicSetupSteps } from "@…' to contain 'href="/admin/academics"'
  - Expected
  + Received
  - href="/admin/academics"
  + import { AcademicSetupSteps } from "@/components/admin/academic-setup-steps";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { DepartmentCreateForm } from "@/components/admin/department-create-form";
  + import { DepartmentDirectory } from "@/components/admin/department-directory";
  ```

## tests/unit/chat9-super-admin-placement-remaining-gap-verification.test.ts (2 failing)
- Super Admin Placement operations remaining source parity > SA-placements-projects-12 previews drive deletion impact and requires confirmation before archiving

  ```
  AssertionError: expected '"use client";\nimport {useState,type …' to contain 'Confirm delete (archive)'
  - Expected
  + Received
  - Confirm delete (archive)
  + "use client";
  + import {useState,type FormEvent} from "react";
  + import {useRouter} from "next/navigation";
  + import {Button} from "@/components/ui/button";
  ```
- Super Admin Placement operations remaining source parity > SA-placements-projects-13 allows guarded changes to a published drive with recorded reason

  ```
  AssertionError: expected '"use client";\nimport {useEffect,useR…' to contain 'Edit published drive'
  - Expected
  + Received
  - Edit published drive
  + "use client";
  + import {useEffect,useRef,useState,type FormEvent} from "react";
  + import {useRouter} from "next/navigation";
  + import {Input} from "@/components/ui/input";
  ```

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

## tests/unit/college-role-directory-mobile-parity.test.ts (1 failing)
- Mobile Faculty and Learner roster parity > uses a card list on small screens and retains a real table on desktop

  ```
  AssertionError: expected 'import { Select } from "@/components/…' to match /<table[^>]*md:table/
  - Expected:
  /<table[^>]*md:table/
  + Received:
  "import { Select } from \"@/components/ui/select\";
  import { Disclosure } from \"@/components/ui/disclosure\";
  import { Input } from \"@/components/ui/input\";
  import { Button } from \"@/components/ui/button\";
  ```

## tests/unit/faculty-profile-round9-13.test.ts (1 failing)
- lists every actual Faculty self-profile editor exactly once with stable anchors

  ```
  AssertionError: expected [ { section: 'about', …(1) }, …(12) ] to have a length of 12 but got 13
  - Expected
  + Received
  - 12
  + 13
  ```

## tests/unit/hr-today-action-queue-model.test.ts (1 failing)
- filters foreign-company and foreign-college drives before constructing review links

  ```
  AssertionError: expected [ { key: 'notifications', …(5) } ] to have a length of 2 but got 1
  - Expected
  + Received
  - 2
  + 1
  ```

## tests/unit/learner-education-picker-model.test.ts (3 failing)
- LEARNER-profile-misc-06 education examination validation > preserves 10th, 12th/Diploma and degree choices

  ```
  AssertionError: expected [ '10th', '12th', 'Diploma', …(4) ] to deeply equal [ '10th', '12th', 'Diploma', …(2) ]
  - Expected
  + Received
  @@ -2,6 +2,8 @@
  "10th",
  "12th",
  "Diploma",
  "UG",
  ```
- LEARNER-profile-misc-06 education examination validation > guards CGPA, percentage, impossible year order and maximum

  ```
  AssertionError: expected undefined to be 'gradeObtained' // Object.is equality
  - Expected:
  "gradeObtained"
  + Received:
  undefined
  ```
- LEARNER-profile-misc-06 education examination validation > requires every field used by placement eligibility checks with exact legacy errors

  ```
  AssertionError: expected undefined to be 'Choose a valid education type' // Object.is equality
  - Expected:
  "Choose a valid education type"
  + Received:
  undefined
  ```
