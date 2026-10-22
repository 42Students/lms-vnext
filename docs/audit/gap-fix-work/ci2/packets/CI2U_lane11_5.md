# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat12-0134-target-bounds.test.ts (2 failing)
- General learner requests against registered 0134 > TPO-requests-verification-01 bounds external company names to the effective 150-character target column

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```
- General learner requests against registered 0134 > TPO-requests-verification-01 proposes additive correction without changing numbered 0134

  ```
  Error: ENOENT: no such file or directory, open '/home/runner/work/lms-vnext/lms-vnext/docs/proposed-migrations/chat-12-0134-general-requests-correction.sql'
  ❯ src tests/unit/chat12-0134-target-bounds.test.ts:4:26
  2| import {tpoGeneralRequestInputSchema,tpoGeneralRequestTarget} from "@/…
  3| import {readFileSync} from "node:fs";
  4| const src=(path:string)=>readFileSync(new URL("../../"+path,import.met…
  |                          ^
  5| describe("General learner requests against registered 0134",()=>{
  6|  it("TPO-requests-verification-01 bounds external company names to the…
  ```

## tests/unit/chat12-round16-empty-filter-copy.test.ts (1 failing)
- TPO-students-47 distinguishes filtered emptiness from no eligible students while keeping legacy recovery

  ```
  AssertionError: expected '"use client";\nimport {Select} from "…' to contain '>Filter students</h2>'
  - Expected
  + Received
  - >Filter students</h2>
  + "use client";
  + import {Select} from "@/components/ui/select";
  + import {Button} from "@/components/ui/button";
  + import {InlineNotice} from "@/components/ui/inline-notice";
  ```

## tests/unit/chat12-round9-students-resilience.test.ts (1 failing)
- chat-12 Students S2/S3 audited gap guardrails > TPO-students-14 requires confirmed and rechecked Add selected to drive, keeping partial results

  ```
  AssertionError: expected '"use client";\nimport {Checkbox} from…' to contain 'runGuarded(submit)'
  - Expected
  + Received
  - runGuarded(submit)
  + "use client";
  + import {Checkbox} from "@/components/ui/checkbox";
  + import {Textarea} from "@/components/ui/textarea";
  + import {Select} from "@/components/ui/select";
  ```

## tests/unit/chat12-tpo-requests-verification.test.ts (4 failing)
- Chat-12 TPO Requests gap closure > TPO-requests-verification-02 confirms high-impact approvals and sends routine kinds in one click

  ```
  AssertionError: expected '"use client";\nimport { Textarea } fr…' to contain 'role="alert"'
  - Expected
  + Received
  - role="alert"
  + "use client";
  + import { Textarea } from "@/components/ui/textarea";
  + import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
  + import {useState} from "react";
  ```
- Chat-12 TPO Requests gap closure > TPO-requests-verification-09 shows roll, branch, after-college choice and placed state

  ```
  AssertionError: expected 'import { Select } from "@/components/…' to contain 'Already placed'
  - Expected
  + Received
  - Already placed
  + import { Select } from "@/components/ui/select";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import {Checkbox} from "@/components/ui/checkbox";
  + import {FilterChipLink} from "@/components/ui/filter-chip";
  ```
- Chat-12 TPO Requests gap closure > TPO-requests-verification-10 shows the decision actor, time and reason

  ```
  AssertionError: expected 'import { Select } from "@/components/…' to contain 'Decided by:'
  - Expected
  + Received
  - Decided by:
  + import { Select } from "@/components/ui/select";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import {Checkbox} from "@/components/ui/checkbox";
  + import {FilterChipLink} from "@/components/ui/filter-chip";
  ```
- Chat-12 TPO Requests gap closure > TPO-requests-verification-17 restores legacy subtitle, waiting label and empty-state copy

  ```
  AssertionError: expected 'import { Select } from "@/components/…' to contain 'No requests in this period.'
  - Expected
  + Received
  - No requests in this period.
  + import { Select } from "@/components/ui/select";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import {Checkbox} from "@/components/ui/checkbox";
  + import {FilterChipLink} from "@/components/ui/filter-chip";
  ```

## tests/unit/chat13-application-rescreen.test.ts (1 failing)
- Application re-screen on real academic evidence > SA-placements-projects-21 protects mutation origin and shows scored policy checks without a fake match score

  ```
  AssertionError: expected '"use client";\nimport {Dialog} from "…' to contain 'The private document endpoint checks …'
  - Expected
  + Received
  - The private document endpoint checks access again.
  + "use client";
  + import {Dialog} from "@/components/ui/dialog";
  + import {ConfirmDialog} from "@/components/ui/confirm-dialog";
  + import {Button} from "@/components/ui/button";
  ```

## tests/unit/chat13-legacy-topbar-portal-contract.test.ts (2 failing)
- chat-13 legacy header portal navigation and measured shell values > TOPBAR-01 keeps distinct portal placeholder/search/quick-create paths

  ```
  AssertionError: expected '/admin/tenants/create' to be null
  - Expected:
  null
  + Received:
  "/admin/tenants/create"
  ```
- chat-13 legacy header portal navigation and measured shell values > TOPBAR-05 precisely specifies the old white, 68px and 36px actions

  ```
  AssertionError: expected '.bar {\n  /* Measured header-only val…' to contain 'background: #fff'
  - Expected
  + Received
  - background: #fff
  + .bar {
  +   /* Measured header-only values missing from the shared global skin. */
  +   --topbar-ink: var(--lms-topbar-ink);
  +   --topbar-search-bg: var(--lms-topbar-search);
  ```
