# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/UX-college-projects-templates-01.test.ts (3 failing)
- /college/projects/templates responsive UX > UX-college-projects-templates-01 preserves the audited responsive and empty-state contract

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'caption="Assigned project templates"'
  - Expected
  + Received
  - caption="Assigned project templates"
  + import Link from "next/link";
  + import {redirect} from "next/navigation";
  + import {AuthorizationError} from "@/modules/permissions/policy";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  ```
- /college/projects/templates responsive UX > UX-college-projects-templates-02 preserves the audited responsive and empty-state contract

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'mobilePriority:"action"'
  - Expected
  + Received
  - mobilePriority:"action"
  + import Link from "next/link";
  + import {redirect} from "next/navigation";
  + import {AuthorizationError} from "@/modules/permissions/policy";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  ```
- /college/projects/templates responsive UX > UX-college-projects-templates-03 preserves the audited responsive and empty-state contract

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'No project templates match this searc…'
  - Expected
  + Received
  - No project templates match this search.
  + import Link from "next/link";
  + import {redirect} from "next/navigation";
  + import {AuthorizationError} from "@/modules/permissions/policy";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  ```

## tests/unit/UX-courses-external-links-01.test.ts (1 failing)
- UX-courses-external-links-01 safe learner and offering external content > learner-youtube-player opens external media in the same tab and never grants opener access

  ```
  AssertionError: expected '"use client";\n\nimport {\n  useEffec…' not to contain 'target="_blank"'
  - Expected
  + Received
  - target="_blank"
  + "use client";
  +
  + import {
  +   useEffect,
  ```

## tests/unit/UX-learn-redirect-alias-coverage-01.test.ts (2 failing)
- UX-learn-redirect-alias-coverage-01 canonical learner entrypoints > UX-learn-alias learn uses canonical feature page instead of a blank duplicate UI

  ```
  Error: ENOENT: no such file or directory, open '/home/runner/work/lms-vnext/lms-vnext/src/app/(authenticated)/learn/page.tsx'
  ❯ read tests/unit/UX-learn-redirect-alias-coverage-01.test.ts:3:27
  1| import {describe,expect,it} from "vitest";
  2| import {readFileSync} from "node:fs";
  3| const read=(path:string)=>readFileSync(new URL("../../src/app/(authent…
  |                           ^
  4| describe("UX-learn-redirect-alias-coverage-01 canonical learner entryp…
  5|  const redirects=[
  ```
- UX-learn-redirect-alias-coverage-01 canonical learner entrypoints > UX-learn-course-alias /learn/courses/[deliveryId] percent-encodes the requested course and redirects to scoped /home

  ```
  AssertionError: expected 'import {notFound,redirect} from "next…' to contain 'params: Promise<{ deliveryId: string …'
  - Expected
  + Received
  - params: Promise<{ deliveryId: string }>
  + import {notFound,redirect} from "next/navigation";
  +
  + /** Legacy bookmarks use course slugs or numeric IDs, sometimes with cls.
  +  * The shared /home route resolves aliases only against the authenticated
  ```

## tests/unit/UX-projects-raw-table-chat17.test.ts (1 failing)
- UX-projects-raw-table-44 Project screens use the shared responsive table > class-team-workspace-creator never regresses to inaccessible raw table markup

  ```
  AssertionError: expected '"use client";\nimport { EmptyState } …' not to match /<\s*table\b/i
  - Expected:
  /<\s*table\b/i
  + Received:
  "\"use client\";
  import { EmptyState } from \"@/components/ui/empty-state\";
  import { useEffect, useRef, useState } from \"react\";
  import { useRouter } from \"next/navigation\";
  ```

## tests/unit/UX-teacher-contacts-contactstab-membershipid-coverage-01.test.ts (1 failing)
- Faculty UX route /teacher/contacts/[contactsTab]/[membershipId] > UX-teacher-contacts-contactstab-membershipid-01: retains routing, access and learner-facing states

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain '<EmptyState title="No active roles re…'
  - Expected
  + Received
  - <EmptyState title="No active roles recorded"
  + import Link from "next/link";
  + import {notFound} from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { PageHeader } from "@/components/ui/page-header";
  ```

## tests/unit/UX-teacher-profile-contacts-coverage-01.test.ts (1 failing)
- UX-teacher-profile-contacts-01 /teacher/profile/contacts keeps access and honest feedback

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain '<PageHeader eyebrow="Faculty · Profil…'
  - Expected
  + Received
  - <PageHeader eyebrow="Faculty · Profile" title="Contact details"
  + import Link from "next/link";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {PageHeader} from "@/components/ui/page-header";
  + import {getOwnFacultyContactAvailability} from "@/modules/people/faculty-contact-availability-service";
  ```
