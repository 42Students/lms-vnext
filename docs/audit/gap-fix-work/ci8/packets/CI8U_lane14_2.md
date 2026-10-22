# CI unit-test packet (round 8)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat16-queue-source-verification-r6.test.ts (1 failing)
- chat-16 reassigned mentor and tracker queue source contracts > SA-placements-projects-106 retains its audited source boundary

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'Failed IDs:'
  - Expected
  + Received
  - Failed IDs:
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import {InlineNotice} from "@/components/ui/inline-notice";
  + import { Select } from "@/components/ui/select";
  ```

## tests/unit/chat3-superadmin-academics-people-audit-r2.test.ts (1 failing)
- Chat-3 second-eye Super Admin academics and people audit > SA3-PEOPLE-04 directory has explicit no-scope state, read-only masking, URL filter and pagination

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'title="No matching users"'
  - Expected
  + Received
  - title="No matching users"
  + import Link from "next/link";
  + import { SuperAdminPeopleCsvControl } from "@/components/admin/super-admin-people-csv-control";
  + import { superAdminPeopleExportHref } from "@/modules/people/admin-users-export-model";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```
