# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/PROJ-BREAK-SA-admin-pages-and-scope.test.ts (1 failing)
- Super Admin Projects and Placements page routes — independent security and UX audit > PROJ-BREAK-SA-15 audits every live /admin placement/project page for auth or scope-enforcing delegate

  ```
  AssertionError: src/app/(authenticated)/admin/placements/calendar/appointments/page.tsx: expected 'import Link from "next/link";\nimport…' not to match /<table(?:\s|>)/
  - Expected:
  /<table(?:\s|>)/
  + Received:
  "import Link from \"next/link\";
  import { getCurrentRequestContext } from \"@/auth/request-context\";
  import { listSuperAdminCalendarAppointments } from \"@/modules/placements/super-admin-calendar-appointment-directory\";
  import { PageHeader } from \"@/components/ui/page-header\";
  ```

## tests/unit/PROJ-BREAK-chat9-submissions-tabs-resilience.test.tsx (1 failing)
- IIT Dharwad Projects: adversarial tab outage and pagination journeys > PROJ-BREAK-submissions-41 unsubmitted-only navigation never calls final-delivery services

  ```
  AssertionError: expected null to deeply equal { page: 2, pageCount: 2 }
  - Expected:
  {
  "page": 2,
  "pageCount": 2,
  }
  + Received:
  null
  ```

## tests/unit/UX-college-college-classes-01.test.ts (1 failing)
- UX-college-college-classes-01 retains responsive forms, states and legacy copy

  ```
  AssertionError: expected 'import { collegeDirectoryValidationMe…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { collegeDirectoryValidationMessage } from "@/modules/academics/college-directory-validation";
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { CollegeStructureDirectory } from "@/components/academics/college-structure-directory";
  ```

## tests/unit/UX-kit-states-chat17.test.tsx (1 failing)
- UX-kit-STATES: semantic SSR states and accessible fallbacks > UX-kit-HARDEN-50 availability transition clears obsolete file validation state

  ```
  AssertionError: expected '"use client";\n\nimport { useEffect, …' to contain 'aria-invalid={error ? true : undefine…'
  - Expected
  + Received
  - aria-invalid={error ? true : undefined}
  + "use client";
  +
  + import { useEffect, useId, useRef, useState, type ChangeEvent, type ComponentPropsWithRef, type ReactNode } from "react";
  + import { cx } from "@/lib/class-names";
  ```

## tests/unit/UX-tpo-find-03.test.ts (1 failing)
- UX-tpo-find-03 > uses shared controls without changing legacy labels or authorized data

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' to contain 'role="alert"'
  - Expected
  + Received
  - role="alert"
  + import {Button} from "@/components/ui/button";
  + import {Input} from "@/components/ui/input";
  + import Link from "next/link";
  + import {redirect} from "next/navigation";
  ```

## tests/unit/chat11-super-admin-signin-editor-cas.test.ts (1 failing)
- SA-tenants-modules-LOGIN-CAS-03 successive college sign-in saves > reads committed version/method from successful response before declaring a save, not stale props

  ```
  AssertionError: expected '"use client";\nimport {Button} from "…' to contain 'Couldn\'t save sign-in settings: '
  - Expected
  + Received
  - Couldn't save sign-in settings:
  + "use client";
  + import {Button} from "@/components/ui/button";
  + import {ConfirmDialog} from "@/components/ui/confirm-dialog";
  + import {Alert} from "@/components/ui/alert";
  ```

## tests/unit/chat12-round4-request-contracts.test.ts (1 failing)
- chat-12 Requests and Verification contracts, source-only > TPO-requests-verification-25 preserves contract

  ```
  AssertionError: expected '"use client";\nimport { Select } from…' to contain 'Review one by one ('
  - Expected
  + Received
  - Review one by one (
  + "use client";
  + import { Select } from "@/components/ui/select";
  + import { Button } from "@/components/ui/button";
  + import {useRouter,useSearchParams} from "next/navigation";
  ```

## tests/unit/chat13-hiring-report-confirmed-hired.test.ts (2 failing)
- SA-HIRING-LEDGER-14 count real joined students in Super Admin hiring analytics > uses accepted offers and confirmed joining rather than mutable stage HIRED

  ```
  AssertionError: expected 'hired:sql<number>`count(distinct ${pl…' to contain 'exists ('
  - Expected
  + Received
  - exists (
  + hired:sql<number>`count(distinct ${placementApplications.id}) filter (
  +     where ${placementApplications.status} = 'SUBMITTED'
  +     and ${verifiedJoined}
  +   )::integer`.mapWith(Number),
  ```
- SA-HIRING-LEDGER-14 count real joined students in Super Admin hiring analytics > retains selected tenant and scoped application membership pairing including on date-filtered reports

  ```
  AssertionError: expected 'import "server-only";\nimport {and,as…' to contain 'requireSuperAdminSelectedCollege(cont…'
  - Expected
  + Received
  - requireSuperAdminSelectedCollege(context,"placements.read")
  + import "server-only";
  + import {and,asc,eq,exists,gte,ilike,lt,or,sql} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  + import {
  ```
