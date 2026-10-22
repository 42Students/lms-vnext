# CI unit-test packet (round 8)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat4-superadmin-college-one-canvas-audit.test.ts (2 failing)
- Super Admin colleges/organizations canvas and page states > UX-COL-ONE-CANVAS-01 preserves scoped, accessible tenant directories and paging

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'No organizations in this scope'
  - Expected
  + Received
  - No organizations in this scope
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { OrganizationActions } from "@/components/admin/organization-actions";
  + import {TenantRestoreAction} from "@/components/admin/tenant-restore-action";
  ```
- Super Admin colleges/organizations canvas and page states > UX-COL-ONE-CANVAS-03 keeps administrator account and session controls in the directory

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'View history'
  - Expected
  + Received
  - View history
  + import Link from "next/link";
  + import {DataTable} from "@/components/ui/data-table";
  + import {Tabs} from "@/components/ui/tabs";
  + import {Alert} from "@/components/ui/alert";
  ```

## tests/unit/chat6-superadmin-course-entrypoints.test.ts (1 failing)
- Super Admin course in-tab entry points > SA-academics-people-57 lessons have course filter CSV and bulk visibility controls

  ```
  AssertionError: expected '"use client";\nimport { Alert } from …' to contain 'Show selected'
  - Expected
  + Received
  - Show selected
  + "use client";
  + import { Alert } from "@/components/ui/alert";
  + import { Checkbox } from "@/components/ui/checkbox";
  + import { ConfirmDialog } from "@/components/ui/confirm-dialog";
  ```
