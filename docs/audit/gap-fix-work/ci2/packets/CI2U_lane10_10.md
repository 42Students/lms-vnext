# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat7-learner-course-file-route-boundaries.test.ts (3 failing)
- LEARNER-COURSE-FILE-ROUTE-02 signed learner download security and recovery > resolves one learner-scoped file reference before issuing any storage capability

  ```
  AssertionError: expected 500 to be 302 // Object.is equality
  - Expected
  + Received
  - 302
  + 500
  ```
- LEARNER-COURSE-FILE-ROUTE-02 signed learner download security and recovery > never signs an absent/zero-byte/quarantined-or-unavailable storage reference

  ```
  AssertionError: expected 500 to be 404 // Object.is equality
  - Expected
  + Received
  - 404
  + 500
  ```
- LEARNER-COURSE-FILE-ROUTE-02 signed learner download security and recovery > sanitizes attachment names when the authorized learner requests download=1

  ```
  AssertionError: expected 500 to be 302 // Object.is equality
  - Expected
  + Received
  - 302
  + 500
  ```

## tests/unit/chat7-mentor-meeting-facilitation.test.ts (2 failing)
- mentor meeting facilitated notes > MEN-projects-meetings-27 persists retrospective notes action items and follow-up

  ```
  AssertionError: expected 'import {\n  and,\n  asc,\n  eq,\n  in…' to contain 'input.facilitation??existing?.facilit…'
  - Expected
  + Received
  - input.facilitation??existing?.facilitation??{}
  + import {
  +   and,
  +   asc,
  +   eq,
  ```
- mentor meeting facilitated notes > MEN-projects-meetings-27 accepts each legacy follow-up status and retrospective label

  ```
  AssertionError: expected '"use client";\n\nimport { type FormEv…' to contain '? "Meeting updated."'
  - Expected
  + Received
  - ? "Meeting updated."
  + "use client";
  +
  + import { type FormEvent, useState } from "react";
  + import { useRouter } from "next/navigation";
  ```

## tests/unit/chat7-superadmin-course-bulk-page-isolation.test.ts (2 failing)
- SA-courses-visibility-01 admin acting-college, page and bulk selection isolation > never retains a mutable selection on acting-college or visible catalogue ID changes

  ```
  AssertionError: expected 'import { FilterBar } from "@/componen…' to contain 'map(course=>course.id).join'
  - Expected
  + Received
  - map(course=>course.id).join
  + import { FilterBar } from "@/components/ui/filter-bar";
  + import { StatTile } from "@/components/ui/stat-tile";
  + import { Alert } from "@/components/ui/alert";
  + import { Disclosure } from "@/components/ui/disclosure";
  ```
- SA-courses-visibility-01 admin acting-college, page and bulk selection isolation > filters selected items to current college/page on every submit, count and checkbox

  ```
  AssertionError: expected '"use client";\nimport {useEffect,useR…' to contain 'const currentIds=new Set(courses.map(…'
  - Expected
  + Received
  - const currentIds=new Set(courses.map(course=>course.id))
  + "use client";
  + import {useEffect,useRef,useState} from "react";
  + import {useRouter,useSearchParams} from "next/navigation";
  + import {Alert} from "@/components/ui/alert";
  ```

## tests/unit/chat9-college-exact-page-titles.test.ts (2 failing)
- College Admin exact legacy page title copy > videos/page.tsx has exact legacy title for normal and invalid states

  ```
  AssertionError: expected 'import {CollegeCourseMissingScope} fr…' to contain 'title="Video"'
  - Expected
  + Received
  - title="Video"
  + import {CollegeCourseMissingScope} from "@/components/courses/college-course-missing-scope";
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { CollegeContentAggregate } from "@/components/courses/college-content-aggregate";
  ```
- College Admin exact legacy page title copy > course-progress/page.tsx has exact legacy title for normal and invalid states

  ```
  AssertionError: expected 'import {CollegeProgressCapture} from …' to contain 'title="Progress"'
  - Expected
  + Received
  - title="Progress"
  + import {CollegeProgressCapture} from "@/components/courses/college-progress-last-good";
  + import { CollegeCourseMissingScope } from "@/components/courses/college-course-missing-scope";
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```

## tests/unit/chat9-phase2-college-group-tabs.test.ts (1 failing)
- college group tabs exact legacy navigation labels > COL-academic-setup-13 keeps the academic-period overview reachable without inventing a legacy tab

  ```
  AssertionError: expected 'import { AcademicSetupSteps } from "@…' to contain 'href="/admin/academics"'
  - Expected
  + Received
  - href="/admin/academics"
  + import { AcademicSetupSteps } from "@/components/admin/academic-setup-steps";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { DepartmentCreateForm } from "@/components/admin/department-create-form";
  + import { DepartmentDirectory } from "@/components/admin/department-directory";
  ```

## tests/unit/chat9-super-admin-organizations-copy.test.ts (2 failing)
- Super Admin Organizations exact dev-legacy copy > matches section headings and table headers in legacy Organizations.js

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'canCreate ? <section'
  - Expected
  + Received
  - canCreate ? <section
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { OrganizationActions } from "@/components/admin/organization-actions";
  + import {TenantRestoreAction} from "@/components/admin/tenant-restore-action";
  ```
- Super Admin Organizations exact dev-legacy copy > retains exact legacy create control and example

  ```
  AssertionError: expected '"use client";\n\nimport { useState } …' to contain 'disabled={pending || !name.trim()}'
  - Expected
  + Received
  - disabled={pending || !name.trim()}
  + "use client";
  +
  + import { useState } from "react";
  + import {useGuardedAction} from "@/hooks/use-guarded-action";
  ```
