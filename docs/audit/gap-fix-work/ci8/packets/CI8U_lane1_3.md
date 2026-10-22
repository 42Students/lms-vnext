# CI unit-test packet (round 8)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat4-remaining-queue-revalidation-round.test.ts (1 failing)
- chat-4 remaining source contracts after final-sprint split > SA-placements-projects-71 keeps pending-age, reviewer evidence, scoped export, and mentor reassignment

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'Revisions'
  - Expected
  + Received
  - Revisions
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { projectAdminCsv } from "@/modules/projects/project-admin-csv-model";
  +
  ```

## tests/unit/chat6-friendly-fetch-adoption.test.ts (1 failing)
- Chat 6 friendly fetch adoption > GR-90 chat-6 inline fetch failures have alert semantics

  ```
  AssertionError: expected 'import type { HTMLAttributes, ReactNo…' to contain 'role={role ?? (tone === "error" ? "al…'
  - Expected
  + Received
  - role={role ?? (tone === "error" ? "alert" : "status")}
  + import type { HTMLAttributes, ReactNode } from "react";
  + import { cx } from "@/lib/class-names";
  +
  + export type AlertTone = "info" | "success" | "warning" | "error";
  ```
