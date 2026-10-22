# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat6-college-placements-read-parity.test.ts (1 failing)
- College Admin placement register and drive parity > COL-placements-07 College pipeline table exposes legacy email college source applied date age and match score

  ```
  AssertionError: expected '"use client";\nimport Link from "next…' to contain 'No persisted match score available'
  - Expected
  + Received
  - No persisted match score available
  + "use client";
  + import Link from "next/link";
  + import {Dialog} from "@/components/ui/dialog";
  + import {ConfirmDialog} from "@/components/ui/confirm-dialog";
  ```

## tests/unit/chat6-superadmin-scoped-directory-filters.test.ts (1 failing)
- Super Admin selected-college directory filters > SA-academics-people-66 filters selected college assessments by course, section scope and result publication

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'listCollegeAssessmentAggregate(contex…'
  - Expected
  + Received
  - listCollegeAssessmentAggregate(context, "QUIZ",query.data)
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {isSuperAdmin} from "@/modules/identity/context";
  + import {requireSuperAdminSelectedCollege} from "@/modules/admin-ui/super-admin-selected-college";
  ```

## tests/unit/chat7-superadmin-course-tenant-bulk.test.ts (1 failing)
- SA-academics-people-52/53 GR-COURSES-TENANT-01 safe scoped Super Admin visibility and progress > the initial lesson-content query filters both college-owned departments and periods to acting scope before counting matches

  ```
  AssertionError: expected 'import "server-only";\nimport {and,eq…' to contain 'updateCollegeContentStudentVisibility…'
  - Expected
  + Received
  - updateCollegeContentStudentVisibility(context
  + import "server-only";
  + import {and,eq,sql} from "drizzle-orm";
  + import {z} from "zod";
  + import {getDb} from "@/db/client";
  ```

## tests/unit/chat9-round6-settings-course-nav.test.ts (1 failing)
- TPO settings responsive navigation and course policy > TPO-settings-audit-07 offers vertical sticky grouped sections on desktop while retaining mobile wrapping and aria-current

  ```
  AssertionError: expected 'import Link from "next/link";\ntype S…' to contain 'md:float-left md:mr-6 md:w-56'
  - Expected
  + Received
  - md:float-left md:mr-6 md:w-56
  + import Link from "next/link";
  + type SettingsKey="season"|"rules"|"job-types"|"after-college"|"prep-readiness"|"blocked-dates"|"see"|"team"|"trusted"|"branding"|"notifications"|"recruiters"|"templates"|"notices"|"public-page"|"public-link";
  + /** Exactly five legacy-visible settings sections. Hidden panels and persisted
  +  * settings stay accessible by direct scoped URLs, never silently destroyed. */
  ```
