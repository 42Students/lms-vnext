# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat2-tpo-round-route-journeys-break-04.test.ts (2 failing)
- TPO-BREAK-round-route-04 actual handlers: hostile origins, spoofed identities and stale tabs > denies forged cross-origin interview reschedule before looking up a TPO session

  ```
  AssertionError: expected { Object (message) } to deeply equal { error: 'INVALID_ORIGIN' }
  - Expected
  + Received
  {
  -   "error": "INVALID_ORIGIN",
  +   "message": "Your session could not be verified. Refresh the page and try again.",
  }
  ```
- TPO-BREAK-round-route-04 actual handlers: hostile origins, spoofed identities and stale tabs > uses persisted session identity and scoped round params for bulk round decision

  ```
  AssertionError: expected 409 to be 200 // Object.is equality
  - Expected
  + Received
  - 200
  + 409
  ```

## tests/unit/chat3-faculty-gradebook-http-route.test.ts (1 failing)
- FAC-GRADE-HTTP-01 Faculty published gradebook CSV endpoint > returns a BOM, safe formula values and published Section grades, never learner email/PII

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```

## tests/unit/chat3-tpo-round12-parity-contracts.test.ts (1 failing)
- chat-3 TPO Drives source parity audit, 18 distinct gap IDs > TPO-drives-06 keeps applied count is displayed per drive

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain '{job.appliedCount}'
  - Expected
  + Received
  - {job.appliedCount}
  + import Link from "next/link";
  + import { Dropdown } from "@/components/ui/dropdown";
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```

## tests/unit/chat4-college-faculty-bulk-service.test.ts (3 failing)
- COL-people-faculty-bulk-01 confirmed, tenant-scoped batch imports > forbids a forged request college before parsing or persisting foreign membership rows

  ```
  AssertionError: expected [Function] to throw error including 'COLLEGE_SCOPE_MISMATCH' but got '[\n  {\n    "expected": "string",\n  …'
  - Expected
  + Received
  - COLLEGE_SCOPE_MISMATCH
  + [
  +   {
  +     "expected": "string",
  +     "code": "invalid_type",
  ```
- COL-people-faculty-bulk-01 confirmed, tenant-scoped batch imports > normalizes Indian phone numbers, creates only faculty roles and skips duplicate mobiles

  ```
  ZodError: [
  {
  "expected": "string",
  "code": "invalid_type",
  "path": [
  "departmentId"
  ],
  "message": "Invalid input: expected string, received undefined"
  ```
- COL-people-faculty-bulk-01 confirmed, tenant-scoped batch imports > reports per-row identity collisions safely and continues later rows without leaking SQL

  ```
  ZodError: [
  {
  "expected": "string",
  "code": "invalid_type",
  "path": [
  "departmentId"
  ],
  "message": "Invalid input: expected string, received undefined"
  ```

## tests/unit/chat4-college-ux-round4.test.ts (3 failing)
- Chat-4 College UX round 4 > UX-college-contacts-01 protects action size or responsive width

  ```
  AssertionError: expected 'import { DateInput } from "@/componen…' to contain 'min-w-0 overflow-x-clip space-y'
  - Expected
  + Received
  - min-w-0 overflow-x-clip space-y
  + import { DateInput } from "@/components/ui/date-input";
  + import { Input } from "@/components/ui/input";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { Button } from "@/components/ui/button";
  ```
- Chat-4 College UX round 4 > UX-college-course-progress-01 protects action size or responsive width

  ```
  AssertionError: expected 'import {CollegeProgressCapture} from …' to contain 'min-w-0 overflow-x-clip space-y'
  - Expected
  + Received
  - min-w-0 overflow-x-clip space-y
  + import {CollegeProgressCapture} from "@/components/courses/college-progress-last-good";
  + import { CollegeCourseMissingScope } from "@/components/courses/college-course-missing-scope";
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```
- Chat-4 College UX round 4 > UX-college-courses-01 protects action size or responsive width

  ```
  AssertionError: expected 'import { CollegeCourseMissingScope } …' to contain 'min-w-0 overflow-x-clip space-y'
  - Expected
  + Received
  - min-w-0 overflow-x-clip space-y
  + import { CollegeCourseMissingScope } from "@/components/courses/college-course-missing-scope";
  + import { CollegeCourseVisibilityRefresh } from "@/components/college/college-course-visibility-refresh";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {CollegeCoursesLastGood} from "@/components/college/college-courses-last-good";
  ```

## tests/unit/chat4-super-admin-projects-gap-closure.test.ts (23 failing)
- chat-4 Super Admin Projects verified gap coverage > SA-placements-projects-51 accepted archive-and-restore design

  ```
  AssertionError: expected '"use client";\nimport {useEffect,useR…' to contain 'Archive project?'
  - Expected
  + Received
  - Archive project?
  + "use client";
  + import {useEffect,useRef,useState} from "react";
  + import {useRouter} from "next/navigation";
  + import {Button} from "@/components/ui/button";
  ```
- chat-4 Super Admin Projects verified gap coverage > SA-placements-projects-52 retains the verified Projects behavior

  ```
  AssertionError: expected 'import { FilterBar } from "@/componen…' to contain 'Live projects, each run by a mentor w…'
  - Expected
  + Received
  - Live projects, each run by a mentor with a team of students.
  + import { FilterBar } from "@/components/ui/filter-bar";
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {
  ```
- chat-4 Super Admin Projects verified gap coverage > SA-placements-projects-64 retains the verified Projects behavior

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain 'Export overrides CSV'
  - Expected
  + Received
  - Export overrides CSV
  + import { EmptyState } from "@/components/ui/empty-state";
  + import { Badge } from "@/components/ui/badge";
  + import {getProjectReadiness} from "@/modules/projects/readiness-service";
  + import {ProjectReadinessOverrideForm} from "./project-readiness-override-form";
  ```
- chat-4 Super Admin Projects verified gap coverage > SA-placements-projects-74 retains the verified Projects behavior

  ```
  AssertionError: expected 'import { getCurrentRequestContext } f…' to contain 'label:"Today"'
  - Expected
  + Received
  - label:"Today"
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {type ReactNode} from "react";
  + import {ProjectAuditRefreshButton} from "@/components/projects/project-audit-filters";
  + import {StatusBadge} from "@/components/ui/status-badge";
  ```
- chat-4 Super Admin Projects verified gap coverage > SA-placements-projects-78 retains the verified Projects behavior

  ```
  AssertionError: expected 'import { FilterBar } from "@/componen…' to contain 'No college selected'
  - Expected
  + Received
  - No college selected
  + import { FilterBar } from "@/components/ui/filter-bar";
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {
  ```
- chat-4 Super Admin Projects verified gap coverage > SA-placements-projects-80 retains the verified Projects behavior

  ```
  AssertionError: expected 'import { Badge } from "@/components/u…' to contain 'Template title or slug'
  - Expected
  + Received
  - Template title or slug
  + import { Badge } from "@/components/ui/badge";
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { PageHeader } from "@/components/ui/page-header";
  ```
- chat-4 Super Admin Projects verified gap coverage > SA-placements-projects-58 preserves actual at-risk mentor reassignment and overload semantics

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'encodeURIComponent(project.mentorMemb…'
  - Expected
  + Received
  - encodeURIComponent(project.mentorMembershipId ?? "UNASSIGNED")
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {
  +   ProjectAdminFilters,
  ```
- chat-4 Super Admin Projects verified gap coverage > SA-placements-projects-65 preserves its implemented foundation while legacy parity remains open

  ```
  AssertionError: expected 'import { MetricBar } from "@/componen…' to contain 'Submission status'
  - Expected
  + Received
  - Submission status
  + import { MetricBar } from "@/components/ui/metric-bar";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {requireProjectManageAccess} from "@/modules/projects/access";
  + import {getProjectReadiness} from "@/modules/projects/readiness-service";
  ```
- chat-4 Super Admin Projects verified gap coverage > SA-placements-projects-55 uses the legacy workspaces search URL key, size 20 and page sizes

  ```
  AssertionError: expected 'import { z } from "zod";\n\n// URL nu…' to contain 'pageSize: positiveDecimal(10, 100, 20)'
  - Expected
  + Received
  - pageSize: positiveDecimal(10, 100, 20)
  + import { z } from "zod";
  +
  + // URL numbers are decimal-only: coercion would also admit 0x10, 1e2 and whitespace.
  + const positiveDecimal = (min: number, max: number, fallback: number) =>
  ```
- chat-4 Super Admin Projects verified gap coverage > SA-placements-projects-58 shows average-based mentor overload, not a fixed cap

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```
- … 13 more in this file
