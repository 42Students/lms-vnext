# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat13-student-bulk-stale-roster.test.ts (1 failing)
- SA-STUDENT-BULK-18 selected-college bulk controls > freezes confirmed membership IDs, suppresses duplicate clicks and disables in-flight selectors

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'if(pendingRef.current||busy)return'
  - Expected
  + Received
  - if(pendingRef.current||busy)return
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { Select } from "@/components/ui/select";
  + import { Checkbox } from "@/components/ui/checkbox";
  ```

## tests/unit/chat13-superadmin-gap-register-reconcile-b.test.ts (5 failing)
- chat-13 Super Admin Projects reconciliation contracts > SA-placements-projects-55 preserves scoped Super Admin Projects source behavior

  ```
  AssertionError: expected '"use client";\nimport { useCallback, …' to contain 'name={legacyWorkspaces ? "search" : "…'
  - Expected
  + Received
  - name={legacyWorkspaces ? "search" : "q"}
  + "use client";
  + import { useCallback, useEffect, useState } from "react";
  + import { useRouter } from "next/navigation";
  + import Link from "next/link";
  ```
- chat-13 Super Admin Projects reconciliation contracts > SA-placements-projects-56 preserves scoped Super Admin Projects source behavior

  ```
  AssertionError: expected '"use client";\nimport { EmptyState } …' to contain 'One workspace per student'
  - Expected
  + Received
  - One workspace per student
  + "use client";
  + import { EmptyState } from "@/components/ui/empty-state";
  + import { useEffect, useRef, useState } from "react";
  + import { useRouter } from "next/navigation";
  ```
- chat-13 Super Admin Projects reconciliation contracts > SA-placements-projects-58 preserves scoped Super Admin Projects source behavior

  ```
  AssertionError: expected 'import { Button } from "@/components/…' to contain 'isProjectMentorOverloaded'
  - Expected
  + Received
  - isProjectMentorOverloaded
  + import { Button } from "@/components/ui/button";
  + import { Select } from "@/components/ui/select";
  + import { Input } from "@/components/ui/input";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```
- chat-13 Super Admin Projects reconciliation contracts > SA-placements-projects-68 preserves scoped Super Admin Projects source behavior

  ```
  AssertionError: expected 'import { MetricBar } from "@/componen…' to contain 'Releases shipped'
  - Expected
  + Received
  - Releases shipped
  + import { MetricBar } from "@/components/ui/metric-bar";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {requireProjectManageAccess} from "@/modules/projects/access";
  + import {getProjectReadiness} from "@/modules/projects/readiness-service";
  ```
- chat-13 Super Admin Projects reconciliation contracts > SA-placements-projects-93 preserves scoped Super Admin Projects source behavior

  ```
  AssertionError: expected '"use client";\n\nimport {useRef,useSt…' to contain 'learnerMembershipIds:selected'
  - Expected
  + Received
  - learnerMembershipIds:selected
  + "use client";
  +
  + import {useRef,useState} from "react";
  + import {useRouter} from "next/navigation";
  ```

## tests/unit/chat15-calendar-window-bounds.test.ts (1 failing)
- chat-15 bounded calendar retrieval > LEARNER-learning-misc-34 bounds academic schedule to IST visible month and week spillover

  ```
  Error: INVALID_CALENDAR_MONTH
  ❯ learnerCalendarVisibleWindow src/modules/academics/learner-calendar-window-model.ts:9:10
  7|  const monthNumber=month?Number(month.slice(5,7)):Number(parts.find(p=…
  8|  if(month && !/^\\d{4}-(0[1-9]|1[0-2])$/.test(month))
  9|    throw new Error("INVALID_CALENDAR_MONTH");
  |          ^
  10|  if(!Number.isInteger(year)||year<2000||year>2199||!Number.isInteger(m…
  11|    throw new Error("INVALID_CALENDAR_MONTH");
  ```

## tests/unit/chat16-SA-placements-projects-117-export-evidence.test.ts (1 failing)
- SA-placements-projects-117 export and Claude report > SA-placements-projects-117 only exports bounded pages and never claims unrestricted completeness

  ```
  AssertionError: expected '"use client";\nimport { EmptyState } …' to contain 'Downloaded the first '
  - Expected
  + Received
  - Downloaded the first
  + "use client";
  + import { EmptyState } from "@/components/ui/empty-state";
  + import { InlineNotice } from "@/components/ui/inline-notice";
  + import { Alert } from "@/components/ui/alert";
  ```

## tests/unit/chat16-inbound-mail-security-02.test.ts (1 failing)
- chat-16 inbound mail admin security and preview hardening > inbound-mail-filters-01 rejects oversized searches, rogue fields and unsafe pagination

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```

## tests/unit/chat16-public-auth-error-states-05.test.tsx (4 failing)
- chat-16 public/auth route-level error, recovery and responsive states > UX-chat16-login-loading-05 retains the mobile-first width and a visible loading state

  ```
  AssertionError: expected '<link rel="preload" as="image" href="…' to contain 'max-w-xl'
  Expected: "max-w-xl"
  Received: "<link rel="preload" as="image" href="/assets/images/legacy-42lms-logo.svg"/><main class="_page_3b67a1 min-w-0"><header class="_header_3b67a1 min-w-0"><a class="_brand_3b67a1" aria-label="42LMS home" href="/"><img src="/assets/images/legacy-42lms-logo.svg" alt="42LMS" class="_legacyLogo_3b
  ```
- chat-16 public/auth route-level error, recovery and responsive states > UX-chat16-login-error-06 directs login recovery to the public sign-in entry only

  ```
  AssertionError: expected '<div role="alert" data-home-href="/lo…' to contain 'max-w-xl'
  Expected: "max-w-xl"
  Received: "<div role="alert" data-home-href="/login">This page is temporarily unavailable</div>"
  ```
- chat-16 public/auth route-level error, recovery and responsive states > UX-chat16-public-route-errors-07 renders retry fallbacks rather than exposing server exceptions

  ```
  AssertionError: expected '<div class="min-h-screen bg-[#f5f7f9]…' to contain 'This page is temporarily unavailable'
  Expected: "This page is temporarily unavailable"
  Received: "<div class="min-h-screen bg-[#f5f7f9] px-4 py-8"><main class="mx-auto w-full max-w-[760px] rounded-[8px] border border-[#e5e9f0] bg-white p-6"><section role="alert" class="space-y-4"><header data-slot="page-header" class="mb-2 flex w-full min-w-0 flex-col items-stretch gap-2 border-b bord
  ```
- chat-16 public/auth route-level error, recovery and responsive states > UX-chat16-public-route-errors-08 passes a known shared error component for each route

  ```
  AssertionError: expected '<div class="min-h-screen bg-[#f5f7f9]…' to contain 'data-home-href="/dashboard"'
  Expected: "data-home-href="/dashboard""
  Received: "<div class="min-h-screen bg-[#f5f7f9] px-4 py-8"><main class="mx-auto w-full max-w-[760px] rounded-[8px] border border-[#e5e9f0] bg-white p-6"><section role="alert" class="space-y-4"><header data-slot="page-header" class="mb-2 flex w-full min-w-0 flex-col items-stretch gap-2 border-b bord
  ```
