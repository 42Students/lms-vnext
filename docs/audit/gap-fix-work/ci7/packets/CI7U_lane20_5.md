# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/ux-admin-first-third.test.ts (3 failing)
- Super Admin UX first-third rollout > UX-admin-colleges-02 renders one responsive college directory with labelled actions and pagination

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' to contain 'empty={<EmptyState title={q ? "No col…'
  - Expected
  + Received
  - empty={<EmptyState title={q ? "No colleges match your search" : "No active colleges in this scope"}
  + import {Button} from "@/components/ui/button";
  + import {inArray,sql} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  + import {collegeMemberships} from "@/db/schema";
  ```
- Super Admin UX first-third rollout > UX-admin-batch-promotion-02 keeps Preview accessible on phone without a wide table

  ```
  AssertionError: expected 'import {Checkbox} from "@/components/…' to contain 'No batches match the selected program…'
  - Expected
  + Received
  - No batches match the selected program and status.
  + import {Checkbox} from "@/components/ui/checkbox";
  + import {Button} from "@/components/ui/button";
  + import {Select} from "@/components/ui/select";
  + import {Input} from "@/components/ui/input";
  ```
- Super Admin UX first-third rollout > UX-admin-features-collegeId-trace-02 exposes learner actions on phones and keeps resolution level visible

  ```
  AssertionError: expected 'import type { ReactNode } from "react…' to contain 'sm:first:sticky sm:first:left-0'
  - Expected
  + Received
  - sm:first:sticky sm:first:left-0
  + import type { ReactNode } from "react";
  + import Link from "next/link";
  + import { ScrollCue } from "@/components/ui/scroll-cue";
  + import { TableSelectAll } from "@/components/ui/table-select-all";
  ```
