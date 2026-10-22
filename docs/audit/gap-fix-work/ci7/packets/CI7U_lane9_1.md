# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/PROJ-BREAK-chat14-sprint-task-routes.test.ts (1 failing)
- Sprint and task mutating routes under Mentor account > PROJ-BREAK-MENTOR-344 malformed Sprint/task editor JSON cannot invoke a write

  ```
  AssertionError: expected 403 to be 400 // Object.is equality
  - Expected
  + Received
  - 400
  + 403
  ```

## tests/unit/UX-cross-audit-recruiter-tracker-chat3.test.ts (1 failing)
- Chat-3 source cross-audit - actual UX and safety contracts > UX-tracker-02

  ```
  AssertionError: expected '"use client";\n\nimport Link from "ne…' to contain 'if (pending) return;'
  - Expected
  + Received
  - if (pending) return;
  + "use client";
  +
  + import Link from "next/link";
  + import {Button} from "@/components/ui/button";
  ```

## tests/unit/chat11-tpo-trusted-domain-validation.test.ts (1 failing)
- TPO-settings-audit-TRUST-02 college-scoped company domain validation > rejects DNS labels with trailing hyphens, invalid separators, 64-byte labels and public mail providers

  ```
  AssertionError: example.com:443: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```

## tests/unit/chat13-superadmin-gap-register-reconcile-a.test.ts (1 failing)
- SA-placements-projects-30 deliberate global/college boundary > SA-placements-projects-30 keeps global employer edits global but supports authorized college relationship creation and lifecycle

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' to contain 'Sensitive CRM contacts and sharing de…'
  - Expected
  + Received
  - Sensitive CRM contacts and sharing defaults are not displayed.
  + import {Button} from "@/components/ui/button";
  + import {DataTable,type DataTableColumn} from "@/components/ui/data-table";
  + import {Banner} from "@/components/ui/banner";
  + import type {AdminCompanyRow} from "@/modules/placements/admin-company-directory-model";
  ```
