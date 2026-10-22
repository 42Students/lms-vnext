# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/PROJ-BREAK-chat9-admin-scope-pages.test.tsx (2 failing)
- IIT Dharwad Super Admin last-third Project route authorization > PROJ-BREAK-admin-idor-30 all four admin queues reject college-only and disabled actors before scope or data lookup

  ```
  AssertionError: At-risk projects: expected 'At Risk Project access denied Your ac…' to contain 'At-risk projects'
  Expected: "At-risk projects"
  Received: "At Risk Project access denied Your account cannot access Super Admin project workspaces. /dashboard"
  ```
- IIT Dharwad Super Admin last-third Project route authorization > PROJ-BREAK-admin-idor-32 missing college stays on a recoverable selection state, not another tenant

  ```
  AssertionError: expected 'Submissions A selected college scope …' to contain 'Select a college'
  Expected: "Select a college"
  Received: "Submissions A selected college scope is required. No college selected Pick a college in the header to view its submissions."
  ```

## tests/unit/PROJ-BREAK-chat9-sa-quiz-last-third.test.ts (1 failing)
- Super Admin last-third quiz directory, forged URL and outage contract > UX-admin-quizzes-04 independent loading failures never show false empty directories

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'title="Quizzes unavailable"'
  - Expected
  + Received
  - title="Quizzes unavailable"
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {isSuperAdmin} from "@/modules/identity/context";
  + import {requireSuperAdminSelectedCollege} from "@/modules/admin-ui/super-admin-selected-college";
  ```

## tests/unit/SA-ACADEMICS-PEOPLE-BREAK-chat3.test.ts (1 failing)
- SA-ACADEMICS-PEOPLE-BREAK-chat3 scoped Super Admin academic detail and identity guard > SA-academics-people scope: learner, mentor, and deactivated admin fail before DB reads

  ```
  AssertionError: expected [Function] to throw error including 'DENIED' but got 'academics.read'
  Expected: "DENIED"
  Received: "academics.read"
  ```

## tests/unit/UX-chat15-scroll-motion-01.test.ts (2 failing)
- UX-chat15-scroll-motion-01 > UX-tracker-scroll-motion-01 shared Drawer handles viewport and keyboard scrolling

  ```
  AssertionError: expected '"use client";\n\nimport { useEffect, …' to contain 'modal.showModal()'
  - Expected
  + Received
  - modal.showModal()
  + "use client";
  +
  + import { useEffect, useId, useRef, type ReactNode, type RefObject, type CSSProperties } from "react";
  + import { Button } from "@/components/ui/button";
  ```
- UX-chat15-scroll-motion-01 > UX-hr-scroll-motion-01 notifications and verification have discoverable overflow

  ```
  AssertionError: expected '"use client";\nimport {apiFetch,Frien…' to contain 'overscroll-contain'
  - Expected
  + Received
  - overscroll-contain
  + "use client";
  + import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
  + import {useEffect,useState} from "react";
  + import {useGuardedAction} from "@/hooks/use-guarded-action";
  ```

## tests/unit/UX-college-college-companies-01.test.ts (1 failing)
- UX-college-college-companies-01 retains responsive forms, states and legacy copy

  ```
  AssertionError: expected 'import { Input } from "@/components/u…' to contain 'overflow-x-clip'
  - Expected
  + Received
  - overflow-x-clip
  + import { Input } from "@/components/ui/input";
  + import { Button } from "@/components/ui/button";
  + import { Select } from "@/components/ui/select";
  + import { FilterBar } from "@/components/ui/filter-bar";
  ```

## tests/unit/UX-college-college-lessons-01.test.ts (1 failing)
- UX-college-college-lessons-01 ensures route-safe responsive navigation

  ```
  AssertionError: expected 'import { Alert } from "@/components/u…' to contain 'overflow-x-clip'
  - Expected
  + Received
  - overflow-x-clip
  + import { Alert } from "@/components/ui/alert";
  + import { Tabs } from "@/components/ui/tabs";
  + import { loadCourseScope } from "@/modules/courses/scope";
  + import {LessonPageSizePreference} from "@/components/courses/lesson-page-size-preference";
  ```
