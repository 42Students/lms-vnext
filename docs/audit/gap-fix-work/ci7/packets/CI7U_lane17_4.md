# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/learner-applications-browse-parity.test.ts (1 failing)
- Learner Applications list and detail route > supports shareable filters and an application-id detail drawer

  ```
  AssertionError: expected '"use client";\n\nimport Link from "ne…' to contain 'item.applicationId === url.applicatio…'
  - Expected
  + Received
  - item.applicationId === url.applicationId
  + "use client";
  +
  + import Link from "next/link";
  + import { useCallback, useEffect, useRef, useState } from "react";
  ```

## tests/unit/learner-withdrawal-source-contract.test.ts (2 failing)
- Learner withdrawal UX and backend write contracts > requires explicit reason-bearing confirmation in the existing Applications drawer

  ```
  AssertionError: expected '"use client";\n\nimport Link from "ne…' to contain 'Confirm application withdrawal'
  - Expected
  + Received
  - Confirm application withdrawal
  + "use client";
  +
  + import Link from "next/link";
  + import { useCallback, useEffect, useRef, useState } from "react";
  ```
- Learner withdrawal UX and backend write contracts > rechecks same origin, Zod and persisted active role/college within audited transaction

  ```
  AssertionError: expected 'import {\n  and,\n  asc,\n  desc,\n  …' to contain 'learnerWithdrawalReasonSchema.optiona…'
  - Expected
  + Received
  - learnerWithdrawalReasonSchema.optional().parse(reasonInput)
  + import {
  +   and,
  +   asc,
  +   desc,
  ```

## tests/unit/super-admin-dashboard-navigation.test.ts (1 failing)
- Super Admin dashboard global vs college navigation > has no disabled placeholders for existing global routes

  ```
  AssertionError: expected [ 'Tenant setup', …(3) ] to deeply equal [ 'Tenant Setup', …(3) ]
  - Expected
  + Received
  [
  -   "Tenant Setup",
  +   "Tenant setup",
  +   "Feature controls",
  +   "Activity log",
  ```

## tests/unit/tpo-home-31-new-followup.test.ts (1 failing)
- TPO-home-31 quick-create follow-up modal > uses the pre-existing scoped leads and calendar follow-up routes

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'Follow-up added. It shows on the cale…'
  - Expected
  + Received
  - Follow-up added. It shows on the calendar.
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { InlineNotice } from "@/components/ui/inline-notice";
  + import { Input } from "@/components/ui/input";
  ```
