# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/PROJ-BREAK-chat9-admin-page-query-hostility.test.ts (3 failing)
- IIT Dharwad Projects: college and Super Admin page URL hostility > PROJ-BREAK-ux-19 accepts the intended risk controls without changing pagination or status

  ```
  AssertionError: expected { success: false, …(1) } to match object { success: true, data: { …(6) } }
  (3 matching properties omitted from actual)
  - Expected
  + Received
  {
  -   "data": {
  -     "page": 2,
  -     "pageSize": 50,
  ```
- IIT Dharwad Projects: college and Super Admin page URL hostility > PROJ-BREAK-ux-19 rejects duplicate, undisclosed and nondecimal risk filters before querying

  ```
  AssertionError: {"search":"cross-tenant"}: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```
- IIT Dharwad Projects: college and Super Admin page URL hostility > PROJ-BREAK-ux-20 accepts documented submissions views and the unchanged customer filters

  ```
  AssertionError: expected { success: false, …(1) } to match object { success: true, data: { …(6) } }
  (3 matching properties omitted from actual)
  - Expected
  + Received
  {
  -   "data": {
  -     "page": 3,
  -     "pageSize": 100,
  ```

## tests/unit/PROJ-BREAK-chat9-mentor-query-boundary.test.ts (2 failing)
- IIT Dharwad Projects: admin mentor reassignment deep link hostility > PROJ-BREAK-mentor-83 valid selected mentor and workspace survive strict parsing

  ```
  AssertionError: expected { success: true, data: { …(4) } } to match object { success: true, …(1) }
  (1 matching property omitted from actual)
  - Expected
  + Received
  {
  "data": {
  "mentorSearch": "",
  "page": 1,
  ```
- IIT Dharwad Projects: admin mentor reassignment deep link hostility > PROJ-BREAK-mentor-85 invalid links display a recovery before request context and private services

  ```
  AssertionError: expected -1 to be greater than -1
  ❯ tests/unit/PROJ-BREAK-chat9-mentor-query-boundary.test.ts:41:20
  39|     const context=page.indexOf("getCurrentRequestContext()");
  40|     const firstRead=page.indexOf("listCollegeReassignmentWorkspaces(");
  41|     expect(parser).toBeGreaterThan(-1);
  |                    ^
  42|     expect(guard).toBeGreaterThan(parser);
  43|     expect(context).toBeGreaterThan(guard);
  ```

## tests/unit/PROJ-BREAK-chat9-template-directory-page.test.tsx (3 failing)
- Super Admin Projects template directory graceful page states > PROJ-BREAK-ux-30 denied or disabled permission never reads template records

  ```
  AssertionError: expected 'Project templates Project templates a…' to contain 'Return to dashboard'
  Expected: "Return to dashboard"
  Received: "Project templates Project templates access denied This account cannot read the global project template catalogue. Check the active Super Admin session. /dashboard"
  ```
- Super Admin Projects template directory graceful page states > PROJ-BREAK-ux-31 DB outage displays a recoverable view, never internal error codes

  ```
  AssertionError: expected 'Project templates Templates could not…' to contain 'Project templates unavailable'
  Expected: "Project templates unavailable"
  Received: "Project templates Templates could not be loaded The template catalogue could not be loaded. Your search and status filters are unchanged; try again. /admin/projects/templates?q=IIT+Dharwad&status=PUBLISHED&page=2 Retry loading templates"
  ```
- Super Admin Projects template directory graceful page states > PROJ-BREAK-ux-33 valid empty catalogue uses the correct empty state

  ```
  AssertionError: expected 'Project templates A single catalog ev…' to contain 'No matching templates'
  Expected: "No matching templates"
  Received: "Project templates A single catalog every college draws from — college-admin can use these but not edit them. Search title or slug Lifecycle status All statuses Draft Published Archived Filter Export CSV downloads project-templates.csv (Title, Version, Lifecycle, Summary) for the current p
  ```

## tests/unit/UX-auth-handoff-01.test.ts (2 failing)
- UX-auth-handoff-01 retired legacy handoff > never displays or redeems deprecated cross-host tokens

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'redirect("/?auth=handoff-retired")'
  - Expected
  + Received
  - redirect("/?auth=handoff-retired")
  + import { redirect } from "next/navigation";
  + import { safeReturnTo } from "@/lib/return-to";
  +
  + /**
  ```
- UX-auth-handoff-01 retired legacy handoff > routes users back to safe first-party OTP guidance

  ```
  AssertionError: expected 'import { headers } from "next/headers…' to contain 'Sign in with a fresh one-time code'
  - Expected
  + Received
  - Sign in with a fresh one-time code
  + import { headers } from "next/headers";
  + import type { Metadata } from "next";
  + import { redirect } from "next/navigation";
  + import { safeReturnTo } from "@/lib/return-to";
  ```

## tests/unit/UX-college-college-batches-cohort-id-students-01.test.ts (1 failing)
- UX-college-college-batches-cohort-id-students-01 provides keyboard-scrolling wide roster with fixed identity

  ```
  AssertionError: expected 'import type { ReactNode } from "react…' to contain 'sm:first:sticky sm:first:left-0'
  - Expected
  + Received
  - sm:first:sticky sm:first:left-0
  + import type { ReactNode } from "react";
  + import Link from "next/link";
  + import { ScrollCue } from "@/components/ui/scroll-cue";
  + import { TableSelectAll } from "@/components/ui/table-select-all";
  ```

## tests/unit/UX-college-college-groups-group-id-import-preview-01.test.ts (1 failing)
- UX-college-college-groups-group-id-import-preview-01 keeps accessible shared screen state

  ```
  AssertionError: expected 'import {PageBackLink} from "@/compone…' to contain 'overflow-x-clip'
  - Expected
  + Received
  - overflow-x-clip
  + import {PageBackLink} from "@/components/ui/page-back-link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { CollegeGroupImportPreview } from "@/components/groups/college-group-import-preview";
  + import { PageHeader } from "@/components/ui/page-header";
  ```
