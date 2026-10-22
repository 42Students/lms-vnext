# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat9-college-projects-contracts-round8.test.ts (1 failing)
- chat9 college projects scope and persistence contracts > COL-projects-07 enforces a mentor for ACTIVE creation and permits scoped class roster choices

  ```
  AssertionError: expected '"use client";\n\nimport { type FormEv…' to contain 'setLearnerMembershipIds(roster.map(x=…'
  - Expected
  + Received
  - setLearnerMembershipIds(roster.map(x=>x.membershipId))
  + "use client";
  +
  + import { type FormEvent, useEffect, useRef, useState } from "react";
  + import { useRouter } from "next/navigation";
  ```

## tests/unit/chat9-round6-project-risk-audit.test.ts (2 failing)
- College Projects risk and activity acceptance > COL-projects-18 enables admin resource change/search without overriding mentor Activity feed

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'All resource changes'
  - Expected
  + Received
  - All resource changes
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { EmptyState } from "@/components/ui/empty-state";
  + import { Input } from "@/components/ui/input";
  ```
- College Projects risk and activity acceptance > COL-projects-23 ensures ten-tab workspace navigation is keyboard-scrollable at narrow widths

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain 'aria-label="Project workspace section…'
  - Expected
  + Received
  - aria-label="Project workspace sections"
  + import { EmptyState } from "@/components/ui/empty-state";
  + import Link from "next/link";
  + import { Tabs } from "@/components/ui/tabs";
  + import { Disclosure } from "@/components/ui/disclosure";
  ```

## tests/unit/chat9-tpo-settings-friendly-saves.test.ts (1 failing)
- TPO settings gracious save behavior > TPO-settings-audit-21 preserves the edited job type after a failed network write

  ```
  AssertionError: expected '"use client";\n\nimport { TpoUnifiedJ…' to contain 'apiFetch(url'
  - Expected
  + Received
  - apiFetch(url
  + "use client";
  +
  + import { TpoUnifiedJobTypesEditor, type EditableJobType } from "./tpo-unified-job-types-editor";
  +
  ```

## tests/unit/college-drive-applications-model.test.ts (1 failing)
- College drive applicant filters and CSV protection > validates bounded status filters and forbids caller college

  ```
  AssertionError: expected { q: '', status: 'ALL', …(8) } to deeply equal { q: '', status: 'ALL', …(4) }
  - Expected
  + Received
  {
  +   "attention": "ALL",
  "page": 1,
  "q": "",
  "screening": "ALL",
  ```

## tests/unit/db01-tenant-domain-authorization.test.ts (2 failing)
- DB01 tenant-domain authorization and identity-state regression > allows an unscoped active superadmin to delete another college domain

  ```
  AssertionError: expected "vi.fn()" to be called with arguments: [ …(2) ]
  Received:
  1st vi.fn() call:
  [
  "44444444-4444-4444-8444-444444444444",
  undefined,
  +   {
  +     "adminScope": undefined,
  ```
- DB01 tenant-domain authorization and identity-state regression > allows an active authorized superadmin to select a verified primary in their own college

  ```
  AssertionError: expected "vi.fn()" to be called with arguments: [ Array(1) ]
  Received:
  1st vi.fn() call:
  [
  "33333333-3333-4333-8333-333333333333",
  +   {
  +     "adminScope": undefined,
  +     "membership": null,
  ```

## tests/unit/global-error-boundary.test.ts (1 failing)
- GR-11 custom root error boundary > GR-11 renders calm heading, retry and home recovery with no technical content

  ```
  AssertionError: expected '<html lang="en"><head></head><body><m…' to contain 'This page is temporarily unavailable'
  Expected: "This page is temporarily unavailable"
  Received: "<html lang="en"><head></head><body><main role="alert" class="flex min-h-dvh w-full min-w-0 flex-col items-center justify-center bg-[#fafbfc] p-8 text-center"><h1 class="m-0 text-[64px] font-extrabold leading-none text-[#1e9aa8]">500</h1><h2 class="mb-2 mt-4 text-[24px] font-semibold leadi
  ```

## tests/unit/learner-career-calendar-url-model.test.ts (1 failing)
- learner calendar URL date/view/event filters > rejects impossible dates, duplicates and untrusted scope selectors

  ```
  AssertionError: expected { date: '2026-10-14', …(2) } to deeply equal { date: '2026-10-14', …(2) }
  - Expected
  + Received
  {
  "date": "2026-10-14",
  "kind": "ALL",
  -   "view": "agenda",
  +   "view": "month",
  ```

## tests/unit/learner-placement-announcement-model.test.ts (1 failing)
- learner placement notice display > projects only approved presentation fields without identity or scope data

  ```
  AssertionError: expected [ { id: '1', title: 'Notice', …(9) } ] to deeply equal [ { id: '1', title: 'Notice', …(4) } ]
  - Expected
  + Received
  [
  {
  +     "authorName": null,
  +     "bodyLinks": [],
  "createdAt": "2026-10-15T00:00:00.000Z",
  ```
