# CI unit-test packet (round 8)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/recruiter-chat14-unconfirmed-decisions.test.ts (1 failing)
- chat-14 UNCONFIRMED recruiter owner decisions > REC-calendar-messages-profile-46 reuses verified existing-account join and never silently auto-accepts

  ```
  AssertionError: expected 'import { recruiterAccessMonthsOrDefau…' to contain 'recruiterGrantEffectiveAt(grant, now,…'
  - Expected
  + Received
  - recruiterGrantEffectiveAt(grant, now, "DRIVES")
  + import { recruiterAccessMonthsOrDefault } from "@/modules/placements/recruiter-access-defaults";
  + import "server-only";
  +
  + import { createHash } from "node:crypto";
  ```

## tests/unit/ux-admin-chat6-middle-third.test.ts (1 failing)
- UX /admin middle third route and shared archetype contracts > UX-admin-placements-shared-02 keeps mobile directory states and no duplicate Source field

  ```
  AssertionError: expected 'import { Select } from "@/components/…' to contain 'sm:grid-cols-2 lg:grid-cols-4'
  - Expected
  + Received
  - sm:grid-cols-2 lg:grid-cols-4
  + import { Select } from "@/components/ui/select";
  + import { Input } from "@/components/ui/input";
  + import { Button } from "@/components/ui/button";
  + import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
  ```
