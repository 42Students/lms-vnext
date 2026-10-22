# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat2-tpo-reports-server-page-states.test.ts (1 failing)
- UX-tpo-LAST-THIRD-01 branch and CTC reports server-page guard and state > UX-tpo-LAST-THIRD-01 passes trusted college and filters to branch report, and retains honest no-season empty

  ```
  TypeError: Converting circular structure to JSON
  --> starting at object with constructor 'Object'
  --- property 'default' closes the circle
  ```

## tests/unit/chat3-faculty-course-list-model-boundaries.test.ts (1 failing)
- FAC-COURSE-LIST-MODEL-01 persisted Faculty delivery projection > pages only the already-authorized set, preserves caller rows and keeps a stale page recoverable

  ```
  AssertionError: expected [ { …(8) }, { …(8) }, { …(8) }, …(97) ] to have a length of 4 but got 100
  - Expected
  + Received
  - 4
  + 100
  ```

## tests/unit/chat3-superadmin-people-audit-r1.test.ts (1 failing)
- CHAT3-SA-PEOPLE pagination and form audit > SA3-PEOPLE-02 route uses normalized numeric page size before DB fetch and URL pagination

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'limit: pageSize'
  - Expected
  + Received
  - limit: pageSize
  + import Link from "next/link";
  + import { SuperAdminPeopleCsvControl } from "@/components/admin/super-admin-people-csv-control";
  + import { superAdminPeopleExportHref } from "@/modules/people/admin-users-export-model";
  + import { redirect } from "next/navigation";
  ```

## tests/unit/chat4-college-e2e-identity-directory.test.ts (1 failing)
- COL-people-e2e-identity-01 deterministic fixture identity isolation > normalizes the email SQL parameter and projects only directory attributes

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```

## tests/unit/chat4-college-ux-round2.test.ts (3 failing)
- Chat-4 college UX round 2 source contracts > UX-college-attendance-01 prevents width overflow and preserves accessible controls

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'min-w-0 overflow-x-clip space-y'
  - Expected
  + Received
  - min-w-0 overflow-x-clip space-y
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { isSuperAdmin } from "@/modules/identity/context";
  + import { z } from "zod";
  ```
- Chat-4 college UX round 2 source contracts > UX-college-attendance-settings-01 prevents width overflow and preserves accessible controls

  ```
  AssertionError: expected 'import { PageBackLink } from "@/compo…' to contain 'min-w-0 overflow-x-clip space-y'
  - Expected
  + Received
  - min-w-0 overflow-x-clip space-y
  + import { PageBackLink } from "@/components/ui/page-back-link";
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { isSuperAdmin } from "@/modules/identity/context";
  ```
- Chat-4 college UX round 2 source contracts > UX-college-batch-promotion-01 prevents width overflow and preserves accessible controls

  ```
  AssertionError: expected 'import { FilterBar } from "@/componen…' to contain 'min-w-0 overflow-x-clip space-y'
  - Expected
  + Received
  - min-w-0 overflow-x-clip space-y
  + import { FilterBar } from "@/components/ui/filter-bar";
  + import { Checkbox } from "@/components/ui/checkbox";
  + import Link from "next/link";
  + import { CollegePromotionConfirmation } from "@/components/academics/college-promotion-confirmation";
  ```

## tests/unit/chat4-remaining-queue-revalidation-round.test.ts (2 failing)
- chat-4 remaining source contracts after final-sprint split > SA-placements-projects-75 shows persisted audit summary, export, and event details

  ```
  AssertionError: expected 'import { getCurrentRequestContext } f…' to contain '<ActivityCenter'
  - Expected
  + Received
  - <ActivityCenter
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {type ReactNode} from "react";
  + import {ProjectAuditRefreshButton} from "@/components/projects/project-audit-filters";
  + import {StatusBadge} from "@/components/ui/status-badge";
  ```
- chat-4 remaining source contracts after final-sprint split > SA-placements-projects-71 keeps pending-age, reviewer evidence, scoped export, and mentor reassignment

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain 'Reassign mentor'
  - Expected
  + Received
  - Reassign mentor
  + import { EmptyState } from "@/components/ui/empty-state";
  + import Link from "next/link";
  + import { safeProjectExternalHref } from "@/modules/projects/mentor-workspace-evidence-model";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```
