# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat2-tpo-settings-team-trusted-page-behavior.test.ts (2 failing)
- UX-tpo-LAST-THIRD-01 settings people page server states > UX-tpo-LAST-THIRD-01 team page does not invent coordinator counts from unavailable tables

  ```
  TypeError: Converting circular structure to JSON
  --> starting at object with constructor 'Object'
  --- property 'default' closes the circle
  ```
- UX-tpo-LAST-THIRD-01 settings people page server states > UX-tpo-LAST-THIRD-01 trusted page keeps company relationships separate from explicit trusted domain storage

  ```
  TypeError: Converting circular structure to JSON
  --> starting at object with constructor 'Object'
  --- property 'default' closes the circle
  ```

## tests/unit/chat3-final-sprint-companies-round14.test.ts (4 failing)
- chat-3 final sprint TPO Companies > TPO-companies-08 company drives include applied/offers, search and CSV

  ```
  AssertionError: expected '"use client";\nimport { PageBackLink …' to contain 'drive.applied'
  - Expected
  + Received
  - drive.applied
  + "use client";
  + import { PageBackLink } from "@/components/ui/page-back-link";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Badge } from "@/components/ui/badge";
  ```
- chat-3 final sprint TPO Companies > TPO-companies-14 company-aware New action offers lead, drive and followup

  ```
  AssertionError: expected '"use client";\nimport { PageBackLink …' to contain 'New recruiter lead for '
  - Expected
  + Received
  - New recruiter lead for
  + "use client";
  + import { PageBackLink } from "@/components/ui/page-back-link";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Badge } from "@/components/ui/badge";
  ```
- chat-3 final sprint TPO Companies > TPO-companies-18 Engage Companies tab includes filtered export and count

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
- chat-3 final sprint TPO Companies > TPO-companies-26 create-company confirmation provides dialog Escape and keyboard focus trap

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

## tests/unit/chat4-academics-groups-ledger.test.ts (2 failing)
- chat-4 college academics and group models: state, validation, concurrency > batchPromotionPlan distinguishes promote, graduate and unusable progression

  ```
  AssertionError: expected { action: 'PROMOTE', …(3) } to deeply equal { action: 'PROMOTE', …(3) }
  - Expected
  + Received
  {
  -   "academicYearStart": 2026,
  +   "academicYearStart": 2027,
  "action": "PROMOTE",
  "blockers": [],
  ```
- chat-4 college academics and group models: state, validation, concurrency > collegeSectionLifecycleSchema enforces exact version, action and destructive confirmation

  ```
  AssertionError: expected 'Archive class CSE-A? This hides the c…' to contain 'blocks archival'
  Expected: "blocks archival"
  Received: "Archive class CSE-A? This hides the class from active lists but retains its history for auditing. Move enrolled students and unlink teaching, schedules and course deliveries first."
  ```

## tests/unit/chat4-college-faculty-csv-import.test.ts (4 failing)
- COL-people-faculty-csv-01 registered faculty import validation and safe partial outcomes > never creates identities during a preview, even with valid faculty rows

  ```
  AssertionError: expected { preview: true, valid: +0, …(3) } to match object { preview: true, valid: 2, …(2) }
  (1 matching property omitted from actual)
  - Expected
  + Received
  {
  -   "invalid": 0,
  +   "invalid": 2,
  "preview": true,
  ```
- COL-people-faculty-csv-01 registered faculty import validation and safe partial outcomes > produces row-specific duplicate and invalid mobile/email/type errors without side effects

  ```
  AssertionError: expected { preview: true, valid: +0, …(3) } to match object { preview: true, valid: 1, invalid: 2 }
  (2 matching properties omitted from actual)
  - Expected
  + Received
  {
  -   "invalid": 2,
  +   "invalid": 3,
  "preview": true,
  ```
- COL-people-faculty-csv-01 registered faculty import validation and safe partial outcomes > imports normalized one-college faculty role and legacy employment type exactly once

  ```
  AssertionError: expected { preview: false, valid: +0, …(3) } to match object { preview: false, valid: 1, …(1) }
  (2 matching properties omitted from actual)
  - Expected
  + Received
  {
  -   "invalid": 0,
  +   "invalid": 1,
  "preview": false,
  ```
- COL-people-faculty-csv-01 registered faculty import validation and safe partial outcomes > does not echo private storage errors after partial faculty profile or identity failure

  ```
  AssertionError: expected 'INVALID' to be 'FAILED' // Object.is equality
  Expected: "FAILED"
  Received: "INVALID"
  ```

## tests/unit/chat4-college-ux-round6.test.ts (6 failing)
- Chat-4 College UX round six > UX-college-faculty-membershipId-01 keeps narrow-screen routes usable

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'min-w-0 overflow-x-clip space-y'
  - Expected
  + Received
  - min-w-0 overflow-x-clip space-y
  + import Link from "next/link";
  + import { notFound, redirect } from "next/navigation";
  + import {and,eq} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  ```
- Chat-4 College UX round six > UX-college-faculty-import-01 keeps narrow-screen routes usable

  ```
  AssertionError: expected 'import {redirect} from "next/navigati…' to contain 'min-w-0 overflow-x-clip space-y'
  - Expected
  + Received
  - min-w-0 overflow-x-clip space-y
  + import {redirect} from "next/navigation";
  + import {PageBackLink} from "@/components/ui/page-back-link";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {requirePermission} from "@/modules/permissions/policy";
  ```
- Chat-4 College UX round six > UX-college-groups-01 keeps narrow-screen routes usable

  ```
  AssertionError: expected 'import { Pagination } from "@/compone…' to contain 'min-w-0 overflow-x-clip space-y'
  - Expected
  + Received
  - min-w-0 overflow-x-clip space-y
  + import { Pagination } from "@/components/ui/pagination";
  + import Link from "next/link";
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```
- Chat-4 College UX round six > UX-college-groups-groupId-01 keeps narrow-screen routes usable

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'min-w-0 overflow-x-clip space-y'
  - Expected
  + Received
  - min-w-0 overflow-x-clip space-y
  + import Link from "next/link";
  + import { notFound, redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { DataTable } from "@/components/ui/data-table";
  ```
- Chat-4 College UX round six > UX-college-groups-groupId-import-preview-01 keeps narrow-screen routes usable

  ```
  AssertionError: expected 'import {PageBackLink} from "@/compone…' to contain 'min-w-0 overflow-x-clip space-y'
  - Expected
  + Received
  - min-w-0 overflow-x-clip space-y
  + import {PageBackLink} from "@/components/ui/page-back-link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { CollegeGroupImportPreview } from "@/components/groups/college-group-import-preview";
  + import { PageHeader } from "@/components/ui/page-header";
  ```
- Chat-4 College UX round six > UX-college-groups-groupId-rule-preview-01 keeps narrow-screen routes usable

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'min-w-0 overflow-x-clip space-y'
  - Expected
  + Received
  - min-w-0 overflow-x-clip space-y
  + import Link from "next/link";
  + import { notFound } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { ErrorState } from "@/components/ui/error-state";
  ```

## tests/unit/chat4-super-admin-tenant-route-audit.test.ts (3 failing)
- chat-4 Super Admin tenant audit: every college admin route scopes reads and actions > subdomain/page.tsx checks caller scope before presenting college-specific operations

  ```
  AssertionError: expected 'import { Suspense } from "react";\nim…' to contain 'min-h-11'
  - Expected
  + Received
  - min-h-11
  + import { Suspense } from "react";
  + import { notFound } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { PageHeader } from "@/components/ui/page-header";
  ```
- chat-4 Super Admin tenant audit: every college admin route scopes reads and actions > verification queue refuses duplicated filters instead of interpreting a forged first value

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'role="alert"'
  - Expected
  + Received
  - role="alert"
  + import Link from "next/link";
  + import {eq} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  + import {profileVerificationSettings} from "@/db/schema/profile-verification";
  ```
- chat-4 Super Admin tenant audit: every college admin route scopes reads and actions > admin session list and revocation preserve capped results and explicit target

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'listCollegeAdminHistory(await getCurr…'
  - Expected
  + Received
  - listCollegeAdminHistory(await getCurrentRequestContext(),collegeId,userId,page)
  + import Link from "next/link";
  + import {DataTable} from "@/components/ui/data-table";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {requirePermission} from "@/modules/permissions/policy";
  ```
