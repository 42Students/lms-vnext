# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat6-friendly-fetch-adoption.test.ts (1 failing)
- Chat 6 friendly fetch adoption > GR-90 chat-6 inline fetch failures have alert semantics

  ```
  AssertionError: expected 'import type { HTMLAttributes, ReactNo…' to contain 'role={role ?? (tone === "error" ? "al…'
  - Expected
  + Received
  - role={role ?? (tone === "error" ? "alert" : "status")}
  + import type { HTMLAttributes, ReactNode } from "react";
  + import { cx } from "@/lib/class-names";
  +
  + export type AlertTone = "info" | "success" | "warning" | "error";
  ```

## tests/unit/chat7-learner-course-delivery-security.test.ts (1 failing)
- LEARNER-courses-roster-01 active course and elective ownership matrix > enforces exact offering cohort and period against persisted section and program rows

  ```
  AssertionError: expected 'import {\n  and,\n  asc,\n  desc,\n  …' to contain 'eq(sections.cohortId,courseOfferings.…'
  - Expected
  + Received
  - eq(sections.cohortId,courseOfferings.cohortId)
  + import {
  +   and,
  +   asc,
  +   desc,
  ```

## tests/unit/chat9-college-project-resource-audit.test.ts (1 failing)
- College workspace resource activity > COL-projects-18 recognizes resource added edited saved removed without treating task events as resource edits

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

## tests/unit/college-academic-setup-round5-gap-verification.test.ts (1 failing)
- chat-11 college academic page parity round five > COL-academic-setup-32 launches a selected class schedule from its list row

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'defaultSectionId={classId}'
  - Expected
  + Received
  - defaultSectionId={classId}
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { CollegeRecurringRouteModal } from "./route-modal";
  + import { PageHeader } from "@/components/ui/page-header";
  ```
