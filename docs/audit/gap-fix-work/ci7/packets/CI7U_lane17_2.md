# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat2-campaign-batch-persistence.test.ts (2 failing)
- TPO campaign delivery receipts and audit > TPO-campaigns-public-04 commits a college-scoped batch before sending and actual opaque statuses after

  ```
  AssertionError: expected 'import "server-only";\nimport {random…' to contain 'finalizedAt:new Date()'
  - Expected
  + Received
  - finalizedAt:new Date()
  + import "server-only";
  + import {randomUUID} from "node:crypto";
  + import {and,eq} from "drizzle-orm";
  + import {z} from "zod";
  ```
- TPO campaign delivery receipts and audit > TPO-campaigns-public-04 never claims delivery from provider acceptance or violates EMAIL event constraints

  ```
  AssertionError: expected 'import { Alert } from "@/components/u…' to contain 'TpoCampaignSendControl'
  - Expected
  + Received
  - TpoCampaignSendControl
  + import { Alert } from "@/components/ui/alert";
  + import { StatusBadge } from "@/components/ui/status-badge";
  + import { Tabs } from "@/components/ui/tabs";
  + import { Dropdown } from "@/components/ui/dropdown";
  ```

## tests/unit/chat3-final-sprint-company-accessibility.test.ts (1 failing)
- chat-3 final sprint companies accessibility, exporting and safety > TPO-companies-18 preserves scoped company UI and privacy guarantees

  ```
  AssertionError: expected '"use client";\nimport { PageHeader } …' to contain 'Companies ('
  - Expected
  + Received
  - Companies (
  + "use client";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Tabs } from "@/components/ui/tabs";
  + import { FilterChip } from "@/components/ui/filter-chip";
  ```

## tests/unit/chat4-super-admin-colleges-bulk-csv-hardening.test.ts (1 failing)
- Super Admin colleges bulk CSV adversarial parser > SA-colleges-bulk-input-03 enforces 200 rows, no case-variant duplicate codes, required names and correct lengths

  ```
  AssertionError: expected [Function] to throw error including 'Duplicate college code' but got 'Row 3: duplicate college code abc (fi…'
  Expected: "Duplicate college code"
  Received: "Row 3: duplicate college code abc (first used on line 2)."
  ```

## tests/unit/chat6-admin-second-third-drives-page.test.ts (1 failing)
- Super Admin drives: page-level behavior, denial and friendly recovery > CHAT6-ADMIN-DRIVES-PAGE-04 passes only authenticated college and displays visible results/actions

  ```
  
  ```
