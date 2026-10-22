# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/mentor-projects-chat7-final-r7.test.ts (2 failing)
- mentor gaps round-seven behavior > MEN-projects-meetings-14 preserves persisted truth and legacy controls

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain 'Course not linked'
  - Expected
  + Received
  - Course not linked
  + import { EmptyState } from "@/components/ui/empty-state";
  + import Link from "next/link";
  + import { Tabs } from "@/components/ui/tabs";
  + import { Disclosure } from "@/components/ui/disclosure";
  ```
- mentor gaps round-seven behavior > MEN-projects-meetings-R08 preserves persisted truth and legacy controls

  ```
  AssertionError: expected '"use client";\nimport { Input } from …' to contain 'onInput={mentor?liveRefresh:undefined}'
  - Expected
  + Received
  - onInput={mentor?liveRefresh:undefined}
  + "use client";
  + import { Input } from "@/components/ui/input";
  + import { Select } from "@/components/ui/select";
  + import { Button } from "@/components/ui/button";
  ```

## tests/unit/proj-break-chat9-services.test.ts (3 failing)
- IIT Dharwad Projects adversarial service and route contracts > PROJ-BREAK-archive-01 archived projects never enter active override counts or result exports

  ```
  AssertionError: expected 'import { and, desc, eq, inArray } fro…' to contain 'ne(projectInstances.status, "ARCHIVED…'
  - Expected
  + Received
  - ne(projectInstances.status, "ARCHIVED")
  + import { and, desc, eq, inArray } from "drizzle-orm";
  + import { getDb } from "@/db/client";
  + import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
  + import { activityEvents, projectInstances, users } from "@/db/schema";
  ```
- IIT Dharwad Projects adversarial service and route contracts > PROJ-BREAK-archive-02 archived project IDs cannot be selected for readiness releases

  ```
  AssertionError: expected 3 to be 2 // Object.is equality
  - Expected
  + Received
  - 2
  + 3
  ```
- IIT Dharwad Projects adversarial service and route contracts > PROJ-BREAK-ux-01 admin and college Project screens preserve explicit empty/denied UX, no raw crash

  ```
  AssertionError: expected 'import { FilterBar } from "@/componen…' to contain '<EmptyState'
  - Expected
  + Received
  - <EmptyState
  + import { FilterBar } from "@/components/ui/filter-bar";
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {
  ```

## tests/unit/recruiter-calendar-model.test.ts (1 failing)
- recruiter calendar projection > reuses Monday-first week and shared month and agenda windows

  ```
  AssertionError: expected '2026-10-11' to be '2026-10-12' // Object.is equality
  Expected: "2026-10-12"
  Received: "2026-10-11"
  ```

## tests/unit/sa-tenants-modules-24-branding-activity.test.ts (1 failing)
- SA-tenants-modules-24 puts the branding event in the same mutation transaction

  ```
  AssertionError: expected 'import { and, eq, sql } from "drizzle…' to match /metadata:\s*\{\s*version:\s*row\.vers…/
  - Expected:
  /metadata:\s*\{\s*version:\s*row\.version\s*\}/
  + Received:
  "import { and, eq, sql } from \"drizzle-orm\";
  import { getDb } from \"@/db/client\";
  import { collegeBranding, colleges } from \"@/db/schema\";
  import {isSuperAdmin,type RequestContext} from \"@/modules/identity/context\";
  ```

## tests/unit/superadmin-tenants-gap-closure.test.ts (1 failing)
- Super Admin Tenants/Modules legacy gap contracts > SA-tenants-modules-05 tenant scope list does not default to a foreign college

  ```
  AssertionError: expected 'import {PageBackLink} from "@/compone…' to contain 'Pick a college first. Select a colleg…'
  - Expected
  + Received
  - Pick a college first. Select a college in the Super Admin scope switcher
  + import {PageBackLink} from "@/components/ui/page-back-link";
  + import Link from "next/link";
  + import {notFound} from "next/navigation";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  ```

## tests/unit/tpo-confirmed-round-result.test.ts (1 failing)
- confirmed TPO round results > never equates a staged result to an applied result

  ```
  AssertionError: expected 'Pass' to contain 'Shortlisted'
  Expected: "Shortlisted"
  Received: "Pass"
  ```

## tests/unit/tpo-home-legacy-rows.test.ts (1 failing)
- TPO-home-03 legacy seven-row contract > uses authoritative inputs only, without pretending unknown counts are zero

  ```
  AssertionError: expected '2 requests · Messages unavailable' to be '2 requests' // Object.is equality
  Expected: "2 requests"
  Received: "2 requests · Messages unavailable"
  ```

## tests/unit/tpo-students-empty-grid-recovery.test.ts (1 failing)
- TPO Students empty roster spreadsheet recovery > shows the existing first-page action and keeps grid-column/filter controls present

  ```
  AssertionError: expected '"use client";\nimport {Checkbox} from…' to contain '<TpoGridFilterPanel fields={filters} …'
  - Expected
  + Received
  - <TpoGridFilterPanel fields={filters} mobileSheet/>
  + "use client";
  + import {Checkbox} from "@/components/ui/checkbox";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import {Select} from "@/components/ui/select";
  ```
