# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat7-learner-course-progress-route-privacy.test.ts (1 failing)
- COURSES7-09 learner roster and progress HTTP privacy > COURSES7-09 course roster GET uses current authenticated actor, no writes, and is not cached

  ```
  AssertionError: expected 400 to be 200 // Object.is equality
  - Expected
  + Received
  - 200
  + 400
  ```

## tests/unit/chat7-quiz-draft-embargo-security.test.ts (1 failing)
- IIT Dharwad learner quiz draft, release and stale-tab safety > LEARNER-QUIZ-EMBARGO-01 requires closure, explicit release and elapsed due time before showing answer keys

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```

## tests/unit/chat7-superadmin-course-catalogue-touch-pagination.test.ts (1 failing)
- SA-COURSES-TOUCH-13 Super Admin course catalogue mobile filters and safe pagination > renders accessible 44px Super Admin filters and all touch/keyboard course actions

  ```
  AssertionError: expected 'import { FilterBar } from "@/componen…' to contain 'Previous'
  - Expected
  + Received
  - Previous
  + import { FilterBar } from "@/components/ui/filter-bar";
  + import { StatTile } from "@/components/ui/stat-tile";
  + import { Alert } from "@/components/ui/alert";
  + import { Disclosure } from "@/components/ui/disclosure";
  ```

## tests/unit/chat9-college-project-resource-audit.test.ts (1 failing)
- College workspace resource activity > COL-projects-18 recognizes resource added edited saved removed without treating task events as resource edits

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'All resource changes'
  - Expected
  + Received
  - All resource changes
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { EmptyState } from "@/components/ui/empty-state";
  + import { Input } from "@/components/ui/input";
  ```

## tests/unit/chat9-project-navigation-reachability.test.ts (1 failing)
- College Projects navigation has a real route and one tab strip > links Projects and Workspaces to the real list and preserves detail route

  ```
  AssertionError: expected 'import { Tabs } from "@/components/ui…' to contain 'if (basePath === "/college/projects" …'
  - Expected
  + Received
  - if (basePath === "/college/projects" || basePath === "/admin/projects") return null;
  + import { Tabs } from "@/components/ui/tabs";
  + import styles from "./legacy-project-tabs.module.css";
  + import { PROJECT_ADMIN_SECTIONS } from "@/modules/projects/project-admin-navigation-model";
  +
  ```

## tests/unit/chat9-super-admin-placement-source-reconciliation.test.ts (7 failing)
- Super Admin Placements documented parity and owner-accepted navigation > SA-placements-projects-04 restores the legacy Drives landing and no-college wording

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'Drives is college-scoped.'
  - Expected
  + Received
  - Drives is college-scoped.
  + import Link from "next/link";
  + import { listPlatformPlacementPolicy } from "@/modules/placements/platform-placement-policy-service";
  + import { SuperAdminPlatformPlacementPolicy } from "@/components/placements/super-admin-platform-placement-policy";
  + import { SuperAdminPlacementOversightNav } from "@/components/admin/super-admin-placement-oversight-nav";
  ```
- Super Admin Placements documented parity and owner-accepted navigation > SA-placements-projects-16 links a missing active season to the manager instead of crashing

  ```
  AssertionError: expected '"use client";\n\nimport {\n  useState…' to contain 'disabled={pending || !activeSeason ||…'
  - Expected
  + Received
  - disabled={pending || !activeSeason || uncertainCreate}
  + "use client";
  +
  + import {
  +   useState,
  ```
- Super Admin Placements documented parity and owner-accepted navigation > SA-placements-projects-24 implements global Verified by 42 with a not-verified filter

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' to contain '<SuperAdminCompanyVerification'
  - Expected
  + Received
  - <SuperAdminCompanyVerification
  + import {Button} from "@/components/ui/button";
  + import {DataTable,type DataTableColumn} from "@/components/ui/data-table";
  + import {Banner} from "@/components/ui/banner";
  + import type {AdminCompanyRow} from "@/modules/placements/admin-company-directory-model";
  ```
- Super Admin Placements documented parity and owner-accepted navigation > SA-placements-projects-26 implements globally scoped Edit company with a confirmed API write

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' to contain '<SuperAdminCompanyEdit'
  - Expected
  + Received
  - <SuperAdminCompanyEdit
  + import {Button} from "@/components/ui/button";
  + import {DataTable,type DataTableColumn} from "@/components/ui/data-table";
  + import {Banner} from "@/components/ui/banner";
  + import type {AdminCompanyRow} from "@/modules/placements/admin-company-directory-model";
  ```
- Super Admin Placements documented parity and owner-accepted navigation > SA-placements-projects-27 maintains company domains with removal guard and provider-side authorization

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' to contain '<SuperAdminCompanyIdentities'
  - Expected
  + Received
  - <SuperAdminCompanyIdentities
  + import {Button} from "@/components/ui/button";
  + import {DataTable,type DataTableColumn} from "@/components/ui/data-table";
  + import {Banner} from "@/components/ui/banner";
  + import type {AdminCompanyRow} from "@/modules/placements/admin-company-directory-model";
  ```
- Super Admin Placements documented parity and owner-accepted navigation > SA-placements-projects-36 uses recruiter accounts and readable Active or Suspended status labels

  ```
  AssertionError: expected '"use client";\n\nimport {\n  useRef,\…' to contain '"Active":"Disabled"'
  - Expected
  + Received
  - "Active":"Disabled"
  + "use client";
  +
  + import {
  +   useRef,
  ```
- Super Admin Placements documented parity and owner-accepted navigation > SA-placements-projects-50 provides one canonical Interviews link and collapses additional reports

  ```
  AssertionError: expected '"use client";\n\nimport { usePathname…' to contain '<details'
  - Expected
  + Received
  - <details
  + "use client";
  +
  + import { usePathname } from "next/navigation";
  + import Link from "next/link";
  ```
