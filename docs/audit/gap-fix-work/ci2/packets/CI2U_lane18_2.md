# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/PROJ-BREAK-chat9-admin-students-import-history.test.tsx (3 failing)
- Super Admin last-third student register: role and malformed-import history resilience > UX-admin-students-28 wrong role or disabled actor never initiates PII reads

  ```
  AssertionError: expected 'Students Student access denied Your a…' to contain 'Back to dashboard'
  Expected: "Back to dashboard"
  Received: "Students Student access denied Your account cannot access Super Admin student records. /dashboard"
  ```
- Super Admin last-third student register: role and malformed-import history resilience > UX-admin-students-30 invalid historical date cannot blank an otherwise authorized register

  ```
  AssertionError: expected undefined to deeply equal [ { when: 'Date unavailable', …(3) } ]
  - Expected:
  [
  {
  "created": 2,
  "failed": 1,
  "students": 3,
  "when": "Date unavailable",
  ```
- Super Admin last-third student register: role and malformed-import history resilience > UX-admin-students-31 critical registration options failing never expose a half-loaded import form

  ```
  AssertionError: expected 'Students Manage student identity, aca…' to contain 'Student register unavailable'
  Expected: "Student register unavailable"
  Received: "Students Manage student identity, academic placement and account access from one roster. Account access and support The legacy Impersonate action is retired. This membership-based workspace does not exchange Super Admin tokens for a learner session or replace active session credentials. U
  ```

## tests/unit/PROJ-BREAK-chat9-sa-tenant-create-page.test.tsx (4 failing)
- Super Admin last-third tenant creation role and selected-organization boundaries > SA-tenants-create-08 failed organization lookup never exposes the college creation form

  ```
  AssertionError: expected 'Create the customer, then make one co…' to contain 'Organization directory unavailable'
  Expected: "Organization directory unavailable"
  Received: "Create the customer, then make one college launch-ready /dashboard Tenant creation access denied Your account cannot create or configure platform tenants."
  ```
- Super Admin last-third tenant creation role and selected-organization boundaries > SA-tenants-create-09 disabled Super Admin cannot read organization list

  ```
  AssertionError: promise resolved "{ …(10) }" instead of rejecting
  - Expected
  + Received
  - Error {
  -   "message": "rejected promise",
  + <div
  +   className="min-w-0 space-y-5"
  + >
  ```
- Super Admin last-third tenant creation role and selected-organization boundaries > SA-tenants-create-10 poisoned preferred organization may not select a cross-tenant destination

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```
- Super Admin last-third tenant creation role and selected-organization boundaries > SA-tenants-create-11 authorized selection is retained while duplicate/invalid IDs are ignored

  ```
  TypeError: Cannot read properties of undefined (reading 'props')
  ❯ tests/unit/PROJ-BREAK-chat9-sa-tenant-create-page.test.tsx:79:64
  77|     const allowed=collect(await render({organizationId:allowedOrg}));
  78|     const form=allowed.find(n=>isValidElement(n)&&typeof n.type==="fun…
  79|     expect((form as {props:{preferredOrganizationId?:string}}).props.p…
  |                                                                ^
  80|     const multi=collect(await render({organizationId:[allowedOrg,block…
  81|     const form2=multi.find(n=>isValidElement(n)&&typeof n.type==="func…
  ```

## tests/unit/UX-activity-index-01.test.ts (1 failing)
- UX-activity-index-01 Activity Log > UX-activity-index-02 uses shared, accessible mobile-safe filter controls

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain '<Button type="submit">Apply filters</…'
  - Expected
  + Received
  - <Button type="submit">Apply filters</Button>
  + import Link from "next/link";
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {
  ```

## tests/unit/UX-college-academic-directory-scroll-chat17.test.ts (2 failing)
- UX-UNOWNED-GRID-11 responsive College Admin academic directories > college-academic-directory.tsx preserves editing and filter actions with scroll cues

  ```
  AssertionError: expected 'import type { ReactNode } from "react…' to contain 'import { ScrollCue } from "@/componen…'
  - Expected
  + Received
  - import { ScrollCue } from "@/components/ui/scroll-cue"
  + import type { ReactNode } from "react";
  + import { FilterBar } from "@/components/ui/filter-bar";
  + import { Button } from "@/components/ui/button";
  + import { StatusBadge } from "@/components/ui/status-badge";
  ```
- UX-UNOWNED-GRID-11 responsive College Admin academic directories > college-structure-directory.tsx preserves editing and filter actions with scroll cues

  ```
  AssertionError: expected 'import type { ReactNode } from "react…' to contain 'import { ScrollCue } from "@/componen…'
  - Expected
  + Received
  - import { ScrollCue } from "@/components/ui/scroll-cue"
  + import type { ReactNode } from "react";
  + import { FilterBar } from "@/components/ui/filter-bar";
  + import { Button } from "@/components/ui/button";
  + import { Disclosure } from "@/components/ui/disclosure";
  ```

## tests/unit/UX-college-college-departments-01.test.ts (1 failing)
- UX-college-college-departments-01 verifies scoped responsive details

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'overflow-x-clip'
  - Expected
  + Received
  - overflow-x-clip
  + import Link from "next/link";
  + import { Alert } from "@/components/ui/alert";
  + import { isSuperAdmin } from "@/modules/identity/context";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```

## tests/unit/UX-college-dash-attendance-tables-01.test.ts (2 failing)
- UX-college-dash-attendance-tables-01 > /college preserves low-attendance threshold evidence without nested scrolling

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'caption="Learners below attendance th…'
  - Expected
  + Received
  - caption="Learners below attendance threshold"
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { CollegeEditDialog } from "@/components/admin/college-edit-dialog";
  + import { CollegeSetupChecklist } from "@/components/admin/college-setup-checklist";
  ```
- UX-college-dash-attendance-tables-01 > shared DataTable owns actual responsive sticky headers, mobile cards and dynamic edge fades

  ```
  AssertionError: expected 'import type { ReactNode } from "react…' to contain 'sm:sticky sm:top-0'
  - Expected
  + Received
  - sm:sticky sm:top-0
  + import type { ReactNode } from "react";
  + import Link from "next/link";
  + import { ScrollCue } from "@/components/ui/scroll-cue";
  + import { TableSelectAll } from "@/components/ui/table-select-all";
  ```
