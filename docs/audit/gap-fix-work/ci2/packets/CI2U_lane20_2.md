# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/PROJ-BREAK-chat9-admin-tenant-route-roles.test.tsx (1 failing)
- Super Admin last-third tenant paths: scope and dependency failure > UX-admin-tenants-40 denied and disabled actors never read tenant directory or organization choices

  ```
  AssertionError: expected 'Tenant Setup Tenant directory access …' to contain 'Back to dashboard'
  Expected: "Back to dashboard"
  Received: "Tenant Setup Tenant directory access denied Your account cannot view platform tenant records. /dashboardCreate the customer, then make one college launch-ready Tenant creation access denied Your account cannot create or configure platform tenants. /dashboard"
  ```

## tests/unit/PROJ-BREAK-chat9-sa-tenant-setup-page.test.tsx (5 failing)
- Super Admin Tenant Setup: unauthorized and incomplete readiness must fail closed > SA-tenants-setup-12 org read outage does not leave creation controls active

  ```
  AssertionError: expected '/admin/tenants Create the customer, t…' to contain 'Tenant setup unavailable'
  Expected: "Tenant setup unavailable"
  Received: "/admin/tenants Create the customer, then make one college launch-ready Tenant Setup · Create a customer, set up its colleges, and get the selected college ready for launch. Tenant lifecycle Platform view Current step 1. Tenant structure Creation Locked Clear scoped selection to manage ten
  ```
- Super Admin Tenant Setup: unauthorized and incomplete readiness must fail closed > SA-tenants-setup-13 failed college directory must not claim no colleges exist

  ```
  AssertionError: expected '/admin/tenants Create the customer, t…' to contain 'Tenant setup unavailable'
  Expected: "Tenant setup unavailable"
  Received: "/admin/tenants Create the customer, then make one college launch-ready Tenant Setup · Create a customer, set up its colleges, and get the selected college ready for launch. Tenant lifecycle Platform view Current step 1. Tenant structure Creation Available Create an organization or college
  ```
- Super Admin Tenant Setup: unauthorized and incomplete readiness must fail closed > SA-tenants-setup-14 incomplete selected-college readiness cannot show launch actions

  ```
  AssertionError: expected '/admin/tenants Create the customer, t…' to contain 'Tenant setup unavailable'
  Expected: "Tenant setup unavailable"
  Received: "/admin/tenants Create the customer, then make one college launch-ready Tenant Setup · Create a customer, set up its colleges, and get the selected college ready for launch. Tenant lifecycle College: IIT Dharwad Current step 2. Launch setup Creation Locked Clear scoped selection to manage 
  ```
- Super Admin Tenant Setup: unauthorized and incomplete readiness must fail closed > SA-tenants-setup-15 absent selected college never fetches readiness or guesses a tenant

  ```
  AssertionError: expected '/admin/tenants Create the customer, t…' to contain 'No college selected'
  Expected: "No college selected"
  Received: "/admin/tenants Create the customer, then make one college launch-ready Tenant Setup · Create a customer, set up its colleges, and get the selected college ready for launch. Tenant lifecycle Platform view Current step 2. Launch setup Creation Available Create an organization or college Col
  ```
- Super Admin Tenant Setup: unauthorized and incomplete readiness must fail closed > SA-tenants-setup-16 failed authority blocks both workflows before DB reads

  ```
  AssertionError: promise resolved "{ …(10) }" instead of rejecting
  - Expected
  + Received
  - Error {
  -   "message": "rejected promise",
  + <div
  +   className="min-w-0 space-y-4 md:space-y-6"
  + >
  ```

## tests/unit/UX-admin-courses-content-audit-01.test.ts (4 failing)
- UX-admin-courses-content-audit-01 Super Admin scoped courses and content > SA-academics-people-77 /admin/courses rejects invalid filters and requires selected college before data fetch

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'collegeCourseCatalogueQuerySchema.saf…'
  - Expected
  + Received
  - collegeCourseCatalogueQuerySchema.safeParse
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {listSuperAdminGlobalCourses} from "@/modules/courses/super-admin-global-course-directory";
  + import { AdminCourseOverview } from "@/components/courses/admin-course-overview";
  ```
- UX-admin-courses-content-audit-01 Super Admin scoped courses and content > UX-admin-courses-offering-touch-01 /admin/courses/offerings/[offeringId] denies cross-college invalid detail and uses 44px tabs

  ```
  AssertionError: expected 'import { PageBackLink } from "@/compo…' to contain 'aria-label="Course detail tabs"'
  - Expected
  + Received
  - aria-label="Course detail tabs"
  + import { PageBackLink } from "@/components/ui/page-back-link";
  + import {Alert} from "@/components/ui/alert";
  + import Link from "next/link";
  + import { notFound } from "next/navigation";
  ```
- UX-admin-courses-content-audit-01 Super Admin scoped courses and content > UX-admin-assignments-quizzes-01 requires scoped college and preserves builder/editor and failure states

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'adminAssessmentQuerySchema.safeParse'
  - Expected
  + Received
  - adminAssessmentQuerySchema.safeParse
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {isSuperAdmin} from "@/modules/identity/context";
  + import { EmptyState } from "@/components/ui/empty-state";
  ```
- UX-admin-courses-content-audit-01 Super Admin scoped courses and content > UX-admin-course-progress-01 distinguishes measured activity from fabricated completion

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' to contain 'adminLearningQuerySchema.safeParse'
  - Expected
  + Received
  - adminLearningQuerySchema.safeParse
  + import {Button} from "@/components/ui/button";
  + import {Select} from "@/components/ui/select";
  + import {Input} from "@/components/ui/input";
  + import Link from "next/link";
  ```

## tests/unit/UX-college-college-01.test.ts (1 failing)
- UX-college-college-01 preserves legacy copy and responsive UX contracts

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'overflow-x-clip'
  - Expected
  + Received
  - overflow-x-clip
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { CollegeEditDialog } from "@/components/admin/college-edit-dialog";
  + import { CollegeSetupChecklist } from "@/components/admin/college-setup-checklist";
  ```

## tests/unit/UX-college-college-electives-01.test.ts (1 failing)
- UX-college-college-electives-01 preserves mobile UX and route policy

  ```
  AssertionError: expected 'import { collegeDirectoryValidationMe…' to contain 'overflow-x-clip'
  - Expected
  + Received
  - overflow-x-clip
  + import { collegeDirectoryValidationMessage } from "@/modules/academics/college-directory-validation";
  + import Link from "next/link";
  + import {isSuperAdmin} from "@/modules/identity/context";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```

## tests/unit/UX-college-join-01.test.ts (1 failing)
- UX-college-join-01 college recruiter invitation > keeps a recovery action without claiming the invitation was used

  ```
  AssertionError: expected 'import { PageHeader } from "@/compone…' to contain '<Card as="section" role="alert"'
  - Expected
  + Received
  - <Card as="section" role="alert"
  + import { PageHeader } from "@/components/ui/page-header";
  + import authStyles from "@/components/public/public-auth-skin.module.css";
  + import Link from "next/link";
  + import {Card} from "@/components/ui/card";
  ```
