# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat6-auth-admin-scope-private-16.test.ts (3 failing)
- AUTH-handoff-16 account scope response cache safety > GET never caches selected college identity and role choices

  ```
  AssertionError: expected 500 to be 200 // Object.is equality
  - Expected
  + Received
  - 200
  + 500
  ```
- AUTH-handoff-16 account scope response cache safety > POST returns a private response and only server-resolved scope as a secure cookie

  ```
  AssertionError: expected 500 to be 200 // Object.is equality
  - Expected
  + Received
  - 200
  + 500
  ```
- AUTH-handoff-16 account scope response cache safety > DELETE clears the admin scope cookie without caching the prior scope

  ```
  AssertionError: expected 500 to be 200 // Object.is equality
  - Expected
  + Received
  - 200
  + 500
  ```

## tests/unit/chat6-superadmin-people-parity-verified.test.ts (2 failing)
- Super Admin legacy people roster verified gaps > SA-academics-people-104 People Directory exposes legacy All contacts Faculty and Students tabs

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'aria-label="People directory tabs"'
  - Expected
  + Received
  - aria-label="People directory tabs"
  + import Link from "next/link";
  + import { SuperAdminPeopleCsvControl } from "@/components/admin/super-admin-people-csv-control";
  + import { superAdminPeopleExportHref } from "@/modules/people/admin-users-export-model";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```
- Super Admin legacy people roster verified gaps > SA-academics-people-113 recruiter list shows status counts actions and terminate sessions drawer

  ```
  AssertionError: expected '"use client";\n\nimport {\n  useRef,\…' to contain 'statusSummary.archived'
  - Expected
  + Received
  - statusSummary.archived
  + "use client";
  +
  + import {
  +   useRef,
  ```

## tests/unit/chat7-superadmin-content-live-datetime-parity.test.ts (1 failing)
- SA-academics-people-58 live meeting IST/UTC calendar integrity > rejects invalid date before calling the content PATCH endpoint and keeps the user's edit open

  ```
  AssertionError: expected '"use client";\nimport { Alert } from …' to contain 'className="min-h-11'
  - Expected
  + Received
  - className="min-h-11
  + "use client";
  + import { Alert } from "@/components/ui/alert";
  + import { Dialog } from "@/components/ui/dialog";
  + import { LessonResourceMaterialsControl } from "@/components/courses/lesson-resource-materials-control";
  ```

## tests/unit/chat9-round6-college-projects-parity.test.ts (1 failing)
- College Admin Projects round 6 > COL-projects-16 provides template search section counts details and a scoped CSV export

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'visible.map'
  - Expected
  + Received
  - visible.map
  + import Link from "next/link";
  + import {redirect} from "next/navigation";
  + import {AuthorizationError} from "@/modules/permissions/policy";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  ```
