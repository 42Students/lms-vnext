# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/college-attendance-gap-closure.test.ts (5 failing)
- College Attendance legacy and graceful-state gaps > COL-attendance-04 monthly class health shows marked-only percent and no inferred future absences

  ```
  AssertionError: expected '"use client";\n\nimport { ADMIN_ATTEN…' to contain 'Active days'
  - Expected
  + Received
  - Active days
  + "use client";
  +
  + import { ADMIN_ATTENDANCE_COPY } from "@/modules/attendance/admin-attendance-copy";
  + import {AdminAttendanceParentContactEditor} from "./admin-attendance-parent-contact-editor";
  ```
- College Attendance legacy and graceful-state gaps > COL-attendance-05 successful correction is announced by role status, not silent refresh

  ```
  AssertionError: expected '"use client";\n\nimport { ADMIN_ATTEN…' to contain 'Attendance corrected for '
  - Expected
  + Received
  - Attendance corrected for
  + "use client";
  +
  + import { ADMIN_ATTENDANCE_COPY } from "@/modules/attendance/admin-attendance-copy";
  + import {AdminAttendanceParentContactEditor} from "./admin-attendance-parent-contact-editor";
  ```
- College Attendance legacy and graceful-state gaps > COL-attendance-06 record drawer performs one guarded save without native confirmation

  ```
  AssertionError: expected '"use client";\n\nimport { ADMIN_ATTEN…' to contain 'disabled={correcting}'
  - Expected
  + Received
  - disabled={correcting}
  + "use client";
  +
  + import { ADMIN_ATTENDANCE_COPY } from "@/modules/attendance/admin-attendance-copy";
  + import {AdminAttendanceParentContactEditor} from "./admin-attendance-parent-contact-editor";
  ```
- College Attendance legacy and graceful-state gaps > COL-attendance-11 invalid filters and absent selected college show in-page error and reset, not thrown error

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'Choose a college to view attendance'
  - Expected
  + Received
  - Choose a college to view attendance
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { isSuperAdmin } from "@/modules/identity/context";
  + import { z } from "zod";
  ```
- College Attendance legacy and graceful-state gaps > COL-attendance-12 monthly CSV exports one calendar-day column with P A or N codes, never formula injection

  ```
  AssertionError: expected '"use client";\n\nimport { ADMIN_ATTEN…' to contain 'sessionDays.map(row=>row.day)'
  - Expected
  + Received
  - sessionDays.map(row=>row.day)
  + "use client";
  +
  + import { ADMIN_ATTENDANCE_COPY } from "@/modules/attendance/admin-attendance-copy";
  + import {AdminAttendanceParentContactEditor} from "./admin-attendance-parent-contact-editor";
  ```

## tests/unit/college-people-gap-closure.test.ts (12 failing)
- College People legacy audited page contracts > COL-people-08 Faculty and Students have Suspend and Reactivate in their own directories

  ```
  AssertionError: expected '"use client";\nimport { Input } from …' to contain '"Suspend"'
  - Expected
  + Received
  - "Suspend"
  + "use client";
  + import { Input } from "@/components/ui/input";
  + import { Button } from "@/components/ui/button";
  + import { Alert } from "@/components/ui/alert";
  ```
- College People legacy audited page contracts > COL-people-13 directory can render membership context and pending status without guessing

  ```
  AssertionError: expected 'import { Select } from "@/components/…' to contain 'Teaching assignments'
  - Expected
  + Received
  - Teaching assignments
  + import { Select } from "@/components/ui/select";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { Input } from "@/components/ui/input";
  + import { Button } from "@/components/ui/button";
  ```
- College People legacy audited page contracts > COL-people-15 learner/class and faculty/type filter URLs cannot be mixed

  ```
  AssertionError: expected 21092 to be less than 12347
  ❯ tests/unit/college-people-gap-closure.test.ts:113:50
  111|   expect(page).toContain("Advanced filters");
  112|   expect(page).toContain("collegeRoleDirectoryHasActiveFilters(kind,re…
  113|   expect(page.indexOf("Active class / section")).toBeLessThan(page.ind…
  |                                                  ^
  114|   expect(page.indexOf("Department")).toBeLessThan(page.indexOf("<summa…
  115|   expect(page).toContain('name="accountStatus"');
  ```
- College People legacy audited page contracts > COL-people-17 Contacts separate from member management with role tabs and page-size

  ```
  AssertionError: expected 'import { DateInput } from "@/componen…' to contain 'Faculty contacts'
  - Expected
  + Received
  - Faculty contacts
  + import { DateInput } from "@/components/ui/date-input";
  + import { Input } from "@/components/ui/input";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { Button } from "@/components/ui/button";
  ```
- College People legacy audited page contracts > COL-people-18 college contacts keep learner phone and email masked without a need-to-know grant

  ```
  AssertionError: expected 'export function maskedPhone(value:str…' to contain 'input.isLearner?maskedEmail(input.ema…'
  - Expected
  + Received
  - input.isLearner?maskedEmail(input.email)
  + export function maskedPhone(value:string|null):string {
  +  if(!value)return "Not provided";
  +  const digits=value.replace(/\D/g,"");
  +  return digits.length>=4?"•••• "+digits.slice(-4):"Not available";
  ```
- College People legacy audited page contracts > COL-people-19 contact directory presents legacy search and tabs before advanced filters

  ```
  AssertionError: expected 'import { DateInput } from "@/componen…' to contain 'Faculty contacts'
  - Expected
  + Received
  - Faculty contacts
  + import { DateInput } from "@/components/ui/date-input";
  + import { Input } from "@/components/ui/input";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { Button } from "@/components/ui/button";
  ```
- College People legacy audited page contracts > COL-people-26 faculty suspension is a 2-stage in-page confirmation and feedback

  ```
  AssertionError: expected '"use client";\n\nimport { Input } fro…' to contain 'Faculty suspended.'
  - Expected
  + Received
  - Faculty suspended.
  + "use client";
  +
  + import { Input } from "@/components/ui/input";
  + import { Button } from "@/components/ui/button";
  ```
- College People legacy audited page contracts > COL-people-27 Faculty and Learner use responsive cards and bounded desktop table

  ```
  AssertionError: expected 'import { Select } from "@/components/…' to contain 'md:table'
  - Expected
  + Received
  - md:table
  + import { Select } from "@/components/ui/select";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { Input } from "@/components/ui/input";
  + import { Button } from "@/components/ui/button";
  ```
- College People legacy audited page contracts > COL-people-24 mentor reassignment preserves selection and uses explicit confirmed legacy copy

  ```
  AssertionError: expected 'import { Button } from "@/components/…' to contain 'Move selected non-archived project wo…'
  - Expected
  + Received
  - Move selected non-archived project workspaces to a new primary mentor.
  + import { Button } from "@/components/ui/button";
  + import { Select } from "@/components/ui/select";
  + import { Input } from "@/components/ui/input";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```
- College People legacy audited page contracts > COL-people-09 is an approved non-destructive membership lifecycle instead of permanent delete

  ```
  AssertionError: expected '"use client";\nimport { Input } from …' to contain '"Suspend"'
  - Expected
  + Received
  - "Suspend"
  + "use client";
  + import { Input } from "@/components/ui/input";
  + import { Button } from "@/components/ui/button";
  + import { Alert } from "@/components/ui/alert";
  ```
- … 2 more in this file

## tests/unit/faculty-languages-profile-edit.test.ts (1 failing)
- Faculty languages section > rejects malformed entries and duplicate IDs

  ```
  AssertionError: expected [Function] to throw an error
  ❯ tests/unit/faculty-languages-profile-edit.test.ts:21:7
  19|   expect(()=>updateFacultyProfileSection(emptyFacultyProfileDocument,{
  20|    section:"languages",value:[{id,language:"",proficiency:"Fluent"}],e…
  21|   })).toThrow();
  |       ^
  22|   const row=[{id,language:"Telugu",proficiency:"Fluent"}][0];
  23|   expect(()=>updateFacultyProfileSection(emptyFacultyProfileDocument,{
  ```

## tests/unit/graceful-login-guards.test.ts (1 failing)
- resilient one-time-code sign in > GR-53 keeps legacy plain OTP errors and guarded transport

  ```
  AssertionError: expected '"use client";\n\nimport { useEffect, …' to contain 'Get the code by email'
  - Expected
  + Received
  - Get the code by email
  + "use client";
  +
  + import { useEffect, useRef, useState } from "react";
  + import { Button } from "@/components/ui/button";
  ```

## tests/unit/learner-assessment-parity.test.ts (1 failing)
- learner assessment parity pages > materializes the standalone quiz attempt instead of leaving an empty shell

  ```
  AssertionError: expected '"use client";\nimport { PageHeader } …' to contain 'router.replace("/learn/allQuizzes")'
  - Expected
  + Received
  - router.replace("/learn/allQuizzes")
  + "use client";
  + import { PageHeader } from "@/components/ui/page-header";
  + import {Drawer} from "@/components/ui/drawer";
  + import {isSafeInternalHref} from "@/lib/safe-internal-href";
  ```

## tests/unit/learner-legacy-route-contract.test.ts (1 failing)
- legacy learner route contract > keeps every canonical learner page route materialized in vNext

  ```
  AssertionError: src/app/(authenticated)/learn/page.tsx: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```
