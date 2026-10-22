# CI unit-test packet (round 8)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/graceful-root-screens.test.ts (1 failing)
- graceful route screens > GR-13 includes not-found paths for each role and public links

  ```
  AssertionError: expected 'import type { Metadata } from "next";…' to contain 'homeHref="/"'
  - Expected
  + Received
  - homeHref="/"
  + import type { Metadata } from "next";
  + import { GracefulScreen } from "@/components/public/graceful-screen";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { getShellNavigation } from "@/components/shell/shell-model";
  ```

## tests/unit/projects-phase2-workspace-copy-audit.test.ts (1 failing)
- Phase 2 exact old-LMS Projects headings and empty states > uses legacy Team and Resources copy, not implementation language

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain 'Project people'
  - Expected
  + Received
  - Project people
  + import { EmptyState } from "@/components/ui/empty-state";
  + import Link from "next/link";
  + import { Tabs } from "@/components/ui/tabs";
  + import { Disclosure } from "@/components/ui/disclosure";
  ```
