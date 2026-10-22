# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat13-super-admin-academic-copy.test.ts (2 failing)
- Super Admin Academic Setup legacy copy and defaults > SA-academics-people-28 creates a 50-seat lecture hall with legacy labels and field defaults

  ```
  AssertionError: expected '"use client";\n\nimport { useRouter }…' to contain 'roomType: "LECTURE_HALL"'
  - Expected
  + Received
  - roomType: "LECTURE_HALL"
  + "use client";
  +
  + import { useRouter } from "next/navigation";
  + import Link from "next/link";
  ```
- Super Admin Academic Setup legacy copy and defaults > SA-academics-people-37 restores legacy department and lecture-hall empty list copy

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

## tests/unit/chat16-auth-guard-tenant-behavior-21.test.ts (1 failing)
- chat-16 shared OTP admission guard HTTP and tenant isolation > AUTH-GUARD-04 disabled or unknown college host never falls back to platform login

  ```
  AssertionError: expected 'private, no-store' to be 'no-store' // Object.is equality
  Expected: "no-store"
  Received: "private, no-store"
  ```

## tests/unit/chat16-public-placement-page-states-03.test.tsx (5 failing)
- chat-16 public placement page privacy and partial availability > UX-chat16-public-placements-unpublished-02 never renders an unpublished college page

  ```
  AssertionError: expected [Function] to throw error including 'NOT_FOUND' but got 'Invalid server environment configurat…'
  - Expected
  + Received
  - NOT_FOUND
  + Invalid server environment configuration: ✖ Database configuration requires DATABASE_URL or DB_USER, DB_PASSWORD, DB_NAME and INSTANCE_UNIX_SOCKET
  +   → at DATABASE_URL
  ```
- chat-16 public placement page privacy and partial availability > UX-chat16-public-placements-snapshot-03 renders public aggregate only and an explicit date

  ```
  Error: Invalid server environment configuration: ✖ Database configuration requires DATABASE_URL or DB_USER, DB_PASSWORD, DB_NAME and INSTANCE_UNIX_SOCKET
  → at DATABASE_URL
  ❯ parseServerEnv src/lib/env.ts:88:11
  86|
  87|   if (!parsed.success) {
  88|     throw new Error(
  |           ^
  89|       "Invalid server environment configuration: " +
  ```
- chat-16 public placement page privacy and partial availability > UX-chat16-public-placements-outage-04 distinguishes service outage from explicit unpublishing

  ```
  Error: Invalid server environment configuration: ✖ Database configuration requires DATABASE_URL or DB_USER, DB_PASSWORD, DB_NAME and INSTANCE_UNIX_SOCKET
  → at DATABASE_URL
  ❯ parseServerEnv src/lib/env.ts:88:11
  86|
  87|   if (!parsed.success) {
  88|     throw new Error(
  |           ^
  89|       "Invalid server environment configuration: " +
  ```
- chat-16 public placement page privacy and partial availability > UX-chat16-public-placements-partial-05 protects the public page when content service fails

  ```
  Error: Invalid server environment configuration: ✖ Database configuration requires DATABASE_URL or DB_USER, DB_PASSWORD, DB_NAME and INSTANCE_UNIX_SOCKET
  → at DATABASE_URL
  ❯ parseServerEnv src/lib/env.ts:88:11
  86|
  87|   if (!parsed.success) {
  88|     throw new Error(
  |           ^
  89|       "Invalid server environment configuration: " +
  ```
- chat-16 public placement page privacy and partial availability > UX-chat16-public-placements-brand-06 does not misclassify temporary branding outage as 404

  ```
  Error: Invalid server environment configuration: ✖ Database configuration requires DATABASE_URL or DB_USER, DB_PASSWORD, DB_NAME and INSTANCE_UNIX_SOCKET
  → at DATABASE_URL
  ❯ parseServerEnv src/lib/env.ts:88:11
  86|
  87|   if (!parsed.success) {
  88|     throw new Error(
  |           ^
  89|       "Invalid server environment configuration: " +
  ```

## tests/unit/chat19-hr-surface-parity.test.ts (6 failing)
- NORTH-STAR chat-19: legacy recruiter page canvas > separates Today sections using dividers rather than nested full-size cards

  ```
  AssertionError: expected 'import {NeedsDoingChips} from "@/comp…' to contain 'aria-label="Recruiter tasks" classNam…'
  - Expected
  + Received
  - aria-label="Recruiter tasks" className="grid overflow-hidden rounded-[var(--lms-radius-card)] border border-border sm:grid-cols-2 xl:grid-cols-5"
  + import {NeedsDoingChips} from "@/components/ui/needs-doing-chips";
  + import { Badge } from "@/components/ui/badge";
  + import { Alert } from "@/components/ui/alert";
  + import Link from "next/link";
  ```
- NORTH-STAR chat-19: legacy recruiter page canvas > uses a single old-LMS counter strip for calendar and company reports

  ```
  AssertionError: expected 'import { DateInput } from "@/componen…' to contain 'aria-label="Recruiter calendar summar…'
  - Expected
  + Received
  - aria-label="Recruiter calendar summary"
  + import { DateInput } from "@/components/ui/date-input";
  + import { EmptyState } from "@/components/ui/empty-state";
  + import { ErrorState } from "@/components/ui/error-state";
  + import { CalendarGrid } from "@/components/ui/calendar-grid";
  ```
- NORTH-STAR chat-19: legacy recruiter page canvas > keeps proposal rows on the table-like hairlines

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'className="divide-y divide-border bor…'
  - Expected
  + Received
  - className="divide-y divide-border border-y border-border"
  + import Link from "next/link";
  + import {notFound,redirect} from "next/navigation";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {PageHeader} from "@/components/ui/page-header";
  ```
- NORTH-STAR chat-19: legacy recruiter page canvas > uses shared Input Select Button chrome for proposal filters

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain '<Input name="q"'
  - Expected
  + Received
  - <Input name="q"
  + import Link from "next/link";
  + import {notFound,redirect} from "next/navigation";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {PageHeader} from "@/components/ui/page-header";
  ```
- NORTH-STAR chat-19: legacy recruiter page canvas > uses shared form controls for recruiter hiring round creation and editing

  ```
  AssertionError: expected 7 to be 3 // Object.is equality
  - Expected
  + Received
  - 3
  + 7
  ```
- NORTH-STAR chat-19: legacy recruiter page canvas > keeps the mobile drawer icon-only triggers with balanced SVG markup

  ```
  AssertionError: expected 1 to be 2 // Object.is equality
  - Expected
  + Received
  - 2
  + 1
  ```

## tests/unit/chat2-ledger-tpo-round-result.test.ts (2 failing)
- TPO-drive-workspace-37/40/42 placement round lifecycle ledger > locks reordering for finished drives and every round with execution artifacts

  ```
  AssertionError: expected 'The order is locked because this driv…' to contain 'two rounds'
  Expected: "two rounds"
  Received: "The order is locked because this drive has ended."
  ```
- TPO-drive-workspace-37/40/42 placement round lifecycle ledger > preserves legacy outcome semantics and blocks premature application

  ```
  AssertionError: expected 'Pass' to be 'Shortlisted for next round' // Object.is equality
  Expected: "Shortlisted for next round"
  Received: "Pass"
  ```

## tests/unit/chat2-tpo-public-link-bounded-json.test.ts (1 failing)
- TPO-settings-audit-55 bounded recruiter and public join-link write boundaries > all public link and recruiter grant POST handlers check origin before bounded body

  ```
  AssertionError: src/app/api/placements/tpo/settings/recruiter-grants/route.ts: expected 'import { NextResponse } from "next/se…' to match /status:\s*400/
  - Expected:
  /status:\s*400/
  + Received:
  "import { NextResponse } from \"next/server\";
  import { getCurrentRequestContext } from \"@/auth/request-context\";
  import { isSameOriginRequest } from \"@/auth/origin\";
  import { apiErrorResponse } from \"@/lib/api-error\";
  ```

## tests/unit/chat3-final-sprint-company-accessibility.test.ts (2 failing)
- chat-3 final sprint companies accessibility, exporting and safety > TPO-companies-18 preserves scoped company UI and privacy guarantees

  ```
  AssertionError: expected '"use client";\nimport { PageHeader } …' to contain 'Companies ('
  - Expected
  + Received
  - Companies (
  + "use client";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Tabs } from "@/components/ui/tabs";
  + import { FilterChip } from "@/components/ui/filter-chip";
  ```
- chat-3 final sprint companies accessibility, exporting and safety > TPO-companies-26 preserves scoped company UI and privacy guarantees

  ```
  AssertionError: expected '"use client";\n\nimport { useId, useR…' to contain 'modal.showModal()'
  - Expected
  + Received
  - modal.showModal()
  + "use client";
  +
  + import { useId, useRef, type ReactNode, type CSSProperties } from "react";
  + import { Button } from "@/components/ui/button";
  ```

## tests/unit/chat4-college-admin-projects-role-journey.test.ts (3 failing)
- Existing chat-4 CI failure regression contracts > SA-placements-projects-58 overload is strictly above 150% of the current average, not a fixed cap

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```
- PROJ-BREAK-COLLEGE-04 College Admin project list URL and navigation hardening > PROJ-BREAK-COLLEGE-04-09 preserves numeric pagination and valid college project status filters

  ```
  AssertionError: expected { Object (view, page, ...) } to match object { Object (view, page, ...) }
  - Expected
  + Received
  {
  "page": 1,
  -   "pageSize": 25,
  -   "view": "cards",
  +   "pageSize": 20,
  ```
- PROJ-BREAK-COLLEGE-04 College Admin project list URL and navigation hardening > PROJ-BREAK-COLLEGE-04-10 refuses duplicated, foreign, malformed or exponential query filters

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```
