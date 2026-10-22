# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/PROJ-BREAK-chat9-mentor-reassignment-page-outages.test.tsx (1 failing)
- IIT Dharwad Projects: bulk mentor reassignment partial failure states > PROJ-BREAK-mentor-115 failure in any essential dependency blocks all mutation forms and retains filters

  ```
  AssertionError: expected 'Bulk mentor reassignment Move multipl…' to contain 'Failed to load project workspaces'
  Expected: "Failed to load project workspaces"
  Received: "Bulk mentor reassignment Move multiple active workspaces to a new mentor at once. Mentor options could not be loaded The workspace list and workload are available, but reassignment is disabled until current mentor permissions can be verified. Retry mentors /admin/projects/reassign-mentor?
  ```

## tests/unit/UX-tracker-cross-audit-controls.test.ts (2 failing)
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
- Cross-audit Tracker directory and actions > UX-tracker-shared-bulk-02 removes undersized actions and low-contrast link ink

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'focus-visible:'
  - Expected
  + Received
  - focus-visible:
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import {InlineNotice} from "@/components/ui/inline-notice";
  + import { Select } from "@/components/ui/select";
  ```

## tests/unit/chat12-verification-round2.test.ts (1 failing)
- chat-12 verified TPO verification workflows > TPO-requests-verification-29 provides history, roll, education table, private resume and masked-number explanation

  ```
  AssertionError: expected '"use client";\nimport {apiFetch,Frien…' to contain 'Private supporting documents'
  - Expected
  + Received
  - Private supporting documents
  + "use client";
  + import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
  + import {useEffect,useState} from "react";
  + import {useGuardedAction} from "@/hooks/use-guarded-action";
  ```

## tests/unit/chat16-campaign-unsubscribe-ssr-pages-16.test.ts (1 failing)
- chat-16 public campaign unsubscribe server pages > UX-campaign-unsubscribe-page-17 preserves purpose-scoped placement cell copy, not global suppression claims

  ```
  AssertionError: expected '<main class="flex min-h-dvh w-full mi…' to contain 'The placement cell that wrote to you …'
  Expected: "The placement cell that wrote to you will not email you again."
  Received: "<main class="flex min-h-dvh w-full min-w-0 items-center justify-center bg-[#f5f7f9] p-4"><div class="w-full max-w-[440px]"><section data-slot="card" class="min-w-0 rounded-[var(--lms-radius-card)] border border-[var(--lms-canvas-border)] bg-[var(--lms-surface)] p-[var(--lms-space-4)] text
  ```
