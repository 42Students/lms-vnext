# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/PROJ-BREAK-chat9-admin-auth-settings-guard.test.tsx (1 failing)
- Super Admin last-third authentication policy guard > UX-admin-auth-settings-17 non-platform and disabled accounts get a safe return link, not policy keys

  ```
  AssertionError: expected 'Authentication settings Authenticatio…' to contain 'Back to dashboard'
  Expected: "Back to dashboard"
  Received: "Authentication settings Authentication settings access denied Your account cannot view privileged authentication policies. /dashboard"
  ```

## tests/unit/PROJ-BREAK-chat9-admin-unsubmitted-service.test.ts (2 failing)
- IIT Dharwad Projects Admin unsubmitted workspaces service permissions and pagination > PROJ-BREAK-idor-56 unrelated college, inactive and learner actors fail before any project query

  ```
  AssertionError: expected [Function] to throw error including 'Missing permission: projects.manage' but got 'PROJECT_ACCESS_DENIED'
  Expected: "Missing permission: projects.manage"
  Received: "PROJECT_ACCESS_DENIED"
  ```
- IIT Dharwad Projects Admin unsubmitted workspaces service permissions and pagination > PROJ-BREAK-submissions-42 filters both count and page by actual workspace status without resurrecting archives

  ```
  AssertionError: expected [ …(5) ] to include '%100\\%\\_cohort%'
  ❯ tests/unit/PROJ-BREAK-chat9-admin-unsubmitted-service.test.ts:146:32
  144|       expect(predicate.params).toContain("ARCHIVED");
  145|       expect(predicate.params).toContain("ACTIVE");
  146|       expect(predicate.params).toContain("%100\\\\%\\\\_cohort%");
  |                                ^
  147|       expect(predicate.sql.toLowerCase()).toContain("not exists");
  148|     }
  ```

## tests/unit/PROJ-BREAK-chat9-service-bounds.test.ts (1 failing)
- IIT Dharwad Projects: hostile pagination never triggers an unbounded database offset > PROJ-BREAK-scale-20 models reject nonfinite, huge and fraction pages for all admin lists

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```

## tests/unit/UX-admin-cross-chat-12-child-controls.test.ts (2 failing)
- UX-admin first-third delegated child controls > keeps announcement links in the same WebView tab and uses shared Select

  ```
  AssertionError: expected '"use client";\nimport {Select} from "…' not to contain 'target="_blank"'
  - Expected
  + Received
  - target="_blank"
  + "use client";
  + import {Select} from "@/components/ui/select";
  + import {EmptyState} from "@/components/ui/empty-state";
  + import { Fragment, useMemo, useRef, useState, useTransition } from "react";
  ```
- UX-admin first-third delegated child controls > preserves contrast and touch-safe sign-in preview

  ```
  AssertionError: expected '"use client";\n\nimport { useEffect, …' to contain 'mt-3 flex min-h-11'
  - Expected
  + Received
  - mt-3 flex min-h-11
  + "use client";
  +
  + import { useEffect, useRef, useState, useTransition } from "react";
  + import { Button } from "@/components/ui/button";
  ```

## tests/unit/UX-college-college-academics-sections-section-id-01.test.ts (1 failing)
- UX-college-college-academics-sections-section-id-01 preserves legacy copy and responsive UX contracts

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'overflow-x-clip'
  - Expected
  + Received
  - overflow-x-clip
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { AcademicsSectionPage } from "@/components/academics/academics-section-page";
  +
  ```

## tests/unit/UX-college-college-electives-slot-id-allocate-01.test.ts (1 failing)
- UX-college-college-electives-slot-id-allocate-01 provides keyboard-scrolling wide roster with fixed identity

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
