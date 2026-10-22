# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/UX-teacher-redirect-no-shared-route-journey.test.tsx (2 failing)
- UX-teacher-no-shared-01 secure redirect-only legacy routes > keeps legacy Contacts index as a zero-render same-origin redirect

  ```
  AssertionError: expected [Function] to throw an error
  - Expected:
  null
  + Received:
  undefined
  ```
- UX-teacher-no-shared-01 secure redirect-only legacy routes > rejects invalid Faculty course IDs before rendering or requesting private course data

  ```
  AssertionError: expected [Function] to throw error including 'NOT_FOUND' but got 'Cannot read properties of undefined (…'
  Expected: "NOT_FOUND"
  Received: "Cannot read properties of undefined (reading 'cls')"
  ```

## tests/unit/UX-tpo-batches-batchid-registrations-02.test.ts (1 failing)
- UX-tpo-batches-batchid-registrations-02 > uses the audited shared PageHeader and keeps existing actions

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' to contain '<Button type="submit">Filter</Button>'
  - Expected
  + Received
  - <Button type="submit">Filter</Button>
  + import {Button} from "@/components/ui/button";
  + import {Badge} from "@/components/ui/badge";
  + import {DataTable} from "@/components/ui/data-table";
  + import {Select} from "@/components/ui/select";
  ```

## tests/unit/UX-tpo-drive-day-roundid-no-shows-03.test.ts (1 failing)
- UX-tpo-drive-day-roundid-no-shows-03 > uses shared controls without changing legacy labels or authorized data

  ```
  AssertionError: expected 'import {DataTable} from "@/components…' to contain '<StatTile'
  - Expected
  + Received
  - <StatTile
  + import {DataTable} from "@/components/ui/data-table";
  + import Link from "next/link";
  + import { notFound, redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```

## tests/unit/UX-tracker-mine-chat15-01.test.ts (2 failing)
- UX-tracker-mine-chat15-01 > UX-tracker-mine-01 redirects disabled users and renders unavailable, error and empty states

  ```
  AssertionError: expected 'import { StatusBadge } from "@/compon…' to contain 'role="status"'
  - Expected
  + Received
  - role="status"
  + import { StatusBadge } from "@/components/ui/status-badge";
  + import Link from "next/link";
  + import {redirect} from "next/navigation";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  ```
- UX-tracker-mine-chat15-01 > UX-tracker-mine-publicId-01 validates the ID and scopes loading to signed-in reporter

  ```
  AssertionError: expected 'import {notFound,redirect} from "next…' to contain 'trackerPublicIdSchema.safeParse(publi…'
  - Expected
  + Received
  - trackerPublicIdSchema.safeParse(publicId).success
  + import {notFound,redirect} from "next/navigation";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {PageHeader} from "@/components/ui/page-header";
  + import {PageBackLink} from "@/components/ui/page-back-link";
  ```

## tests/unit/chat11-college-directory-filter-copy-round8.test.ts (1 failing)
- College Academic Setup filter labels > COL-academic-setup-15 keeps legacy primary filters and avoids exposing internal evidence jargon

  ```
  AssertionError: expected 'import type { ReactNode } from "react…' to contain '<summary'
  - Expected
  + Received
  - <summary
  + import type { ReactNode } from "react";
  + import { FilterBar } from "@/components/ui/filter-bar";
  + import { Button } from "@/components/ui/button";
  + import { StatusBadge } from "@/components/ui/status-badge";
  ```

## tests/unit/chat11-super-admin-course-progress-tenant-guard.test.ts (2 failing)
- SA-tenants-modules-COURSE-PROGRESS-07 authoritative scope and strict URL state > rejects duplicated, unknown and forged college/organization filters

  ```
  AssertionError: expected { q: '', status: 'ACTIVE', …(3) } to be null
  - Expected:
  null
  + Received:
  {
  "cohortCode": undefined,
  "courseCode": undefined,
  "page": 1,
  ```
- SA-tenants-modules-COURSE-PROGRESS-07 authoritative scope and strict URL state > authenticates Super Admin before offering query fallback and student data retrieval

  ```
  AssertionError: expected 1230 to be less than -1
  ❯ tests/unit/chat11-super-admin-course-progress-tenant-guard.test.ts:54:16
  52|   const read=source.indexOf("getSuperAdminStudentCourseProgress(contex…
  53|   expect(auth).toBeGreaterThan(-1);
  54|   expect(auth).toBeLessThan(parse);
  |                ^
  55|   expect(parse).toBeLessThan(read);
  56|   expect(source).toContain("Student Course Progress");
  ```
