# CI unit-test packet (round 8)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/PROJ-BREAK-chat9-admin-verification-entry.test.tsx (1 failing)
- Super Admin last-third: verification entry security and scope > UX-admin-verification-20 a global operator must select a college rather than inheriting a guessed default

  ```
  AssertionError: expected 'Profile verification Students\' educa…' to contain 'Choose a college first'
  Expected: "Choose a college first"
  Received: "Profile verification Students' education and identity, checked against their documents. Choose a college at the top to see its students waiting for verification."
  ```

## tests/unit/UX-tracker-cross-audit-controls.test.ts (1 failing)
- Cross-audit Tracker directory and actions > UX-tracker-audit-findings-02 fields, long-list pagination and filters keep mobile hit targets

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain 'className="inline-flex min-h-11 items…'
  - Expected
  + Received
  - className="inline-flex min-h-11 items-center font-semibold text-link md:min-h-9"
  + import { EmptyState } from "@/components/ui/empty-state";
  + import { Banner } from "@/components/ui/banner";
  + import Link from "next/link";
  + import {Button} from "@/components/ui/button";
  ```
