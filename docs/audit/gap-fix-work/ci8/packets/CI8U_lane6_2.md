# CI unit-test packet (round 8)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

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

## tests/unit/chat2-final-sprint-threads-profile-c.test.ts (1 failing)
- Final sprint recruiter threads and profile — group C > REC-calendar-messages-profile-30 keeps explicit confirmed college-specific self-revocation rather than silent access changes

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'method: "DELETE"'
  - Expected
  + Received
  - method: "DELETE"
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { InlineNotice } from "@/components/ui/inline-notice";
  + import { EmptyState } from "@/components/ui/empty-state";
  ```
