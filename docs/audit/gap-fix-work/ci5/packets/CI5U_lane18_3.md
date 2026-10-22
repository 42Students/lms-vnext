# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat4-superadmin-college-detail-page-states.test.tsx (3 failing)
- SA-colleges-detail-01 tenant detail status and privacy > renders the selected active tenant with concrete setup links but no restore action

  ```
  AssertionError: expected '<div role="region" aria-label="Manage…' to contain 'Tenant directory'
  Expected: "Tenant directory"
  Received: "<div role="region" aria-label="Manage College · IIT Dharwad" class="min-w-0 w-full space-y-4 bg-surface p-4 md:ml-auto md:max-w-[980px] md:border md:border-border md:p-4"><div class="flex min-w-0 flex-wrap items-center gap-2"><span data-slot="badge" data-tone="info" data-variant="legacy-p
  ```
- SA-colleges-detail-01 tenant detail status and privacy > does not render foreign, missing or invalid selected college data

  ```
  AssertionError: promise resolved "{ …(10) }" instead of rejecting
  - Expected
  + Received
  - Error {
  -   "message": "rejected promise",
  + <div
  +   className="min-w-0 space-y-4 md:ml-auto md:max-w-[980px]"
  + >
  ```
- SA-colleges-detail-01 tenant detail status and privacy > propagates revoked Super Admin errors without emitting a partial tenant detail

  ```
  AssertionError: promise resolved "{ …(10) }" instead of rejecting
  - Expected
  + Received
  - Error {
  -   "message": "rejected promise",
  + <div
  +   className="min-w-0 space-y-4"
  + >
  ```

## tests/unit/chat6-admin-middle-37-route-contracts.test.ts (2 failing)
- SA-admin-middle-route-01: exact second third entrypoint authorization audit > /admin/placements/hiring delegates rendering to a real authenticated context and scoped loader

  ```
  AssertionError: /admin/placements/hiring lacks authenticated context: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```
- SA-admin-middle-route-01: exact second third entrypoint authorization audit > SA-admin-middle-route-03 private inbound-mail never resolves to a send action

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'Private incoming messages.'
  - Expected
  + Received
  - Private incoming messages.
  + import Link from "next/link";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {PageHeader} from "@/components/ui/page-header";
  + import {Tabs} from "@/components/ui/tabs";
  ```

## tests/unit/chat6-faculty-assignment-batch-101.test.ts (1 failing)
- SA-academics-people-101 multi-course faculty assignment > shows legacy Course(s) multi-selection within one class and retains inputs after a failed save

  ```
  AssertionError: expected '"use client";\n\nimport {useState, ty…' to contain 'setNotice(deliveryIds.length===1?"Tea…'
  - Expected
  + Received
  - setNotice(deliveryIds.length===1?"Teaching assignment created."
  + "use client";
  +
  + import {useState, type FormEvent} from "react";
  + import {Select} from "@/components/ui/select";
  ```

## tests/unit/chat6-superadmin-course-entrypoints.test.ts (2 failing)
- Super Admin course in-tab entry points > SA-academics-people-77 links lessons assignments quizzes and progress to owning offering workspace

  ```
  AssertionError: expected 'import { FilterBar } from "@/componen…' to contain '/admin/courses/offerings/'
  - Expected
  + Received
  - /admin/courses/offerings/
  + import { FilterBar } from "@/components/ui/filter-bar";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import Link from "next/link";
  + import {Input} from "@/components/ui/input";
  ```
- Super Admin course in-tab entry points > SA-academics-people-57 lessons have course filter CSV and bulk visibility controls

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'SuperAdminLearningFilterFields'
  - Expected
  + Received
  - SuperAdminLearningFilterFields
  + import Link from "next/link";
  + import { Button } from "@/components/ui/button";
  + import { Input } from "@/components/ui/input";
  + import { Select } from "@/components/ui/select";
  ```

## tests/unit/chat6-tracker-theme-nav-verification.test.ts (1 failing)
- 42 Tracker manager navigation theme parity > SA-placements-projects-112 provides exact tracker navigation, skip link and a working keyboard-operable Light / Dark toggle

  ```
  AssertionError: expected '"use client";\n\nimport Link from "ne…' to contain 'href="/tracker/issues"'
  - Expected
  + Received
  - href="/tracker/issues"
  + "use client";
  +
  + import Link from "next/link";
  + import { Tabs } from "@/components/ui/tabs";
  ```

## tests/unit/chat7-learner-course-progress-route-privacy.test.ts (1 failing)
- COURSES7-09 learner roster and progress HTTP privacy > COURSES7-09 course roster GET uses current authenticated actor, no writes, and is not cached

  ```
  AssertionError: expected 400 to be 200 // Object.is equality
  - Expected
  + Received
  - 200
  + 400
  ```

## tests/unit/chat7-round3-faculty-contracts.test.ts (1 failing)
- chat-7 round 3 faculty course contracts > FAC-courses-34 keeps faculty tab navigation horizontally reachable by keyboard on small screens

  ```
  AssertionError: expected '"use client";\nimport { Select } from…' to contain 'overflow-x-auto'
  - Expected
  + Received
  - overflow-x-auto
  + "use client";
  + import { Select } from "@/components/ui/select";
  + import { Tabs } from "@/components/ui/tabs";
  + import Link from "next/link";
  ```

## tests/unit/chat9-attendance-department-entry.test.ts (1 failing)
- attendance department report entry > is reachable from the Attendance tab without inventing a new group tab

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'href="/college/attendance/departments"'
  - Expected
  + Received
  - href="/college/attendance/departments"
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { isSuperAdmin } from "@/modules/identity/context";
  + import { z } from "zod";
  ```
