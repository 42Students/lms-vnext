# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/UX-teacher-quiz-builder-shared-controls.test.ts (1 failing)
- Shared Quiz authoring controls > UX-teacher-courses-deliveryId-quizzes-manage-09 keeps correct single/multiple-choice inputs and limits

  ```
  AssertionError: expected '"use client";\nimport { Radio } from …' to contain 'type={question.type==="SINGLE_CHOICE"…'
  - Expected
  + Received
  - type={question.type==="SINGLE_CHOICE"?"radio":"checkbox"}
  + "use client";
  + import { Radio } from "@/components/ui/radio";
  + import { Checkbox as NativeCheckbox } from "@/components/ui/checkbox";
  + import {useRef,useState} from "react";
  ```

## tests/unit/UX-tpo-batches-batchid-registrations-01.test.ts (1 failing)
- UX-tpo-batches-batchid-registrations-01 /tpo/batches/[batchId]/registrations > preserves legacy UI and signed-off phone and contrast contracts

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' not to match /min-h-(?:9|10)\b/
  - Expected:
  /min-h-(?:9|10)\b/
  + Received:
  "import {Button} from \"@/components/ui/button\";
  import {Badge} from \"@/components/ui/badge\";
  import {DataTable} from \"@/components/ui/data-table\";
  import {Select} from \"@/components/ui/select\";
  ```

## tests/unit/UX-tpo-drive-day-roundid-no-shows-02.test.ts (1 failing)
- UX-tpo-drive-day-roundid-no-shows-02 > renders a shared responsive DataTable with explicit legacy empty copy and authorized rows

  ```
  AssertionError: expected 'import {DataTable} from "@/components…' to contain 'empty={<p'
  - Expected
  + Received
  - empty={<p
  + import {DataTable} from "@/components/ui/data-table";
  + import Link from "next/link";
  + import { notFound, redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```

## tests/unit/UX-tracker-logs-01.test.ts (1 failing)
- UX-tracker-logs-01 > preserves original wording, permissions and supported accessible UX

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'aria-label="Log environment"'
  - Expected
  + Received
  - aria-label="Log environment"
  + import Link from "next/link";
  + import type { Metadata } from "next";
  + import { Tabs } from "@/components/ui/tabs";
  +
  ```

## tests/unit/chat11-college-academic-responsive-round9.test.ts (1 failing)
- College Admin narrow-screen academic setup > COL-academic-setup-41 stacks create and filter forms at 375px and preserves scrollable tables

  ```
  AssertionError: expected 'import type { ReactNode } from "react…' to contain 'grid grid-cols-1 gap-3 sm:grid-cols-2…'
  - Expected
  + Received
  - grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4
  + import type { ReactNode } from "react";
  + import { FilterBar } from "@/components/ui/filter-bar";
  + import { Button } from "@/components/ui/button";
  + import { StatusBadge } from "@/components/ui/status-badge";
  ```

## tests/unit/chat11-super-admin-bulk-module-safety.test.ts (4 failing)
- SA-tenants-modules-MOD-BULK-07 student bulk module outcomes > does not report an unapplied or unavailable student rule as saved

  ```
  AssertionError: expected [ { …(2) } ] to deeply equal [ { …(2) } ]
  - Expected
  + Received
  [
  {
  -     "error": "Learner unavailable in this college.",
  +     "error": "Could not update the selected learners. No changes were saved.",
  "id": "33333333-3333-4333-8333-333333333333",
  ```
- SA-tenants-modules-MOD-BULK-07 student bulk module outcomes > does not leak SQL, provider or token errors in per-student failures

  ```
  AssertionError: expected [ { …(2) } ] to deeply equal [ { …(2) } ]
  - Expected
  + Received
  [
  {
  -     "error": "Could not update this learner.",
  +     "error": "Could not update the selected learners. No changes were saved.",
  "id": "33333333-3333-4333-8333-333333333333",
  ```
- SA-tenants-modules-MOD-BULK-07 student bulk module outcomes > keeps stale and ancestor-lock failures actionable but does not claim success

  ```
  AssertionError: expected 'Could not update the selected learner…' to be 'The rule changed. Refresh and try aga…' // Object.is equality
  Expected: "The rule changed. Refresh and try again."
  Received: "Could not update the selected learners. No changes were saved."
  ```
- SA-tenants-modules-MOD-BULK-07 student bulk module outcomes > audits only real saved learners; a summary failure cannot erase completed edits

  ```
  AssertionError: expected { requested: 1, applied: +0, …(3) } to match object { requested: 1, applied: 1, …(2) }
  (1 matching property omitted from actual)
  - Expected
  + Received
  {
  -   "applied": 1,
  -   "auditRecorded": true,
  -   "failures": [],
  ```
