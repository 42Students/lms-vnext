# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat2-company-memory-gap-parity.test.ts (1 failing)
- TPO Company Memory legacy parity > TPO-companies-09 maps stored placement status to readable legacy labels

  ```
  AssertionError: expected '"use client";\n\nimport dynamic from …' to contain 'statusLabel(drive.status)'
  - Expected
  + Received
  - statusLabel(drive.status)
  + "use client";
  +
  + import dynamic from "next/dynamic";
  + import {useRouter} from "next/navigation";
  ```

## tests/unit/chat3-final-sprint-company-engage.test.ts (1 failing)
- chat-3 final sprint Engage company navigation and communication > TPO-companies-14 verifies scoped legacy company workflows

  ```
  AssertionError: expected '"use client";\nimport { PageBackLink …' to contain 'New recruiter lead for '
  - Expected
  + Received
  - New recruiter lead for
  + "use client";
  + import { PageBackLink } from "@/components/ui/page-back-link";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Badge } from "@/components/ui/badge";
  ```

## tests/unit/chat4-super-admin-projects-gap-closure.test.ts (3 failing)
- chat-4 Super Admin Projects verified gap coverage > SA-placements-projects-58 preserves actual at-risk mentor reassignment and overload semantics

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```
- chat-4 Super Admin Projects verified gap coverage > SA-placements-projects-58 shows average-based mentor overload, not a fixed cap

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```
- chat-4 Super Admin Projects verified gap coverage > SA-placements-projects-57 restores creator mode wording and split-team help

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

## tests/unit/chat6-admin-second-third-lecture-hall-pages.test.ts (1 failing)
- Super Admin second third: actual Lecture Halls server-page states > CHAT6-ADMIN-LECTURES-PAGE-03 passes the authenticated college and validated pagination to both selectors

  ```
  AssertionError: expected '<div class="min-w-0 space-y-4 md:spac…' to contain 'IIT Dharwad'
  - Expected
  + Received
  - IIT Dharwad
  + <div class="min-w-0 space-y-4 md:space-y-6"><header data-slot="page-header" class="mb-2 flex w-full min-w-0 flex-col items-stretch gap-2 border-b border-[var(--lms-canvas-border)] pb-4 md:mb-4 md:flex-row md:items-start md:justify-between md:gap-6 [--lms-page-header-title-size:20px] md:[--lms-page
  ```
