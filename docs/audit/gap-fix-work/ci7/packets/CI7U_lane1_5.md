# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/tpo-inbox-team-round4-graceful.test.ts (1 failing)
- TPO Inbox and Team round-4 failure recovery > GR-70 isolates Everyone history failure to a retryable in-page section

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

## tests/unit/ux-chat14-hr-02.test.ts (1 failing)
- chat-14 HR UX rollout batch 02 > UX-hr-hr-placements-jobs-jobId-01 guards recruiter responsive page source

  ```
  AssertionError: expected '"use client";\n\nimport { TpoGrid } f…' to contain '<DataTable'
  - Expected
  + Received
  - <DataTable
  + "use client";
  +
  + import { TpoGrid } from "@/components/tpo/grid/tpo-grid";
  + import type { TpoGridColumn } from "@/modules/placements/tpo-grid-model";
  ```
