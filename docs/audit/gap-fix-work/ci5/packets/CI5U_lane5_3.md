# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat4-final-sprint-tpo-recruiters-b.test.ts (2 failing)
- chat-4 final sprint TPO recruiter gaps B > TPO-recruiters-29 renders safe missing-record responses, recovery and loading surfaces

  ```
  AssertionError: expected '"use client";\n\nimport { useId, useR…' to contain 'modal.showModal()'
  - Expected
  + Received
  - modal.showModal()
  + "use client";
  +
  + import { useId, useRef, type ReactNode, type CSSProperties } from "react";
  + import { Button } from "@/components/ui/button";
  ```
- chat-4 final sprint TPO recruiter gaps B > TPO-recruiters-37 provides keyboard equivalents for inaccessible board dragging and focus-managed dialogs

  ```
  AssertionError: expected '"use client";\n\nimport { useId, useR…' to contain 'modal.showModal()'
  - Expected
  + Received
  - modal.showModal()
  + "use client";
  +
  + import { useId, useRef, type ReactNode, type CSSProperties } from "react";
  + import { Button } from "@/components/ui/button";
  ```

## tests/unit/chat4-tpo-home-team-asks-09.test.ts (1 failing)
- TPO-home-09 persisted team attention > TPO-home-09 computes only verified ask counts and never fabricates mentions from messages

  ```
  AssertionError: expected 'import { Badge } from "@/components/u…' to contain 'type:"TEAM_MESSAGES",priority:4'
  - Expected
  + Received
  - type:"TEAM_MESSAGES",priority:4
  + import { Badge } from "@/components/ui/badge";
  + import Link from "next/link";
  + import {TpoHomeReturnRefresh} from "@/components/tpo/tpo-home-return-refresh";
  + import {eq} from "drizzle-orm";
  ```

## tests/unit/chat6-auth-admin-scope-private-16.test.ts (3 failing)
- AUTH-handoff-16 account scope response cache safety > GET never caches selected college identity and role choices

  ```
  Error: [vitest] No "AdminScopeServiceError" export is defined on the "@/modules/admin-scope/service" mock. Did you forget to return it from "vi.mock"?
  If you need to partially mock a module, you can use "importOriginal" helper inside:
  vi.mock(import("@/modules/admin-scope/service"), async (importOriginal) => {
  const actual = await importOriginal()
  return {
  ...actual,
  // your mocked methods
  }
  ```
- AUTH-handoff-16 account scope response cache safety > POST returns a private response and only server-resolved scope as a secure cookie

  ```
  Error: [vitest] No "AdminScopeServiceError" export is defined on the "@/modules/admin-scope/service" mock. Did you forget to return it from "vi.mock"?
  If you need to partially mock a module, you can use "importOriginal" helper inside:
  vi.mock(import("@/modules/admin-scope/service"), async (importOriginal) => {
  const actual = await importOriginal()
  return {
  ...actual,
  // your mocked methods
  }
  ```
- AUTH-handoff-16 account scope response cache safety > DELETE clears the admin scope cookie without caching the prior scope

  ```
  Error: [vitest] No "AdminScopeServiceError" export is defined on the "@/modules/admin-scope/service" mock. Did you forget to return it from "vi.mock"?
  If you need to partially mock a module, you can use "importOriginal" helper inside:
  vi.mock(import("@/modules/admin-scope/service"), async (importOriginal) => {
  const actual = await importOriginal()
  return {
  ...actual,
  // your mocked methods
  }
  ```

## tests/unit/chat6-final-sprint-rec-home-drives-r05.test.ts (1 failing)
- Final sprint recruiter applicant review accessibility > REC-home-drives-R05 traps focus in the native Drawer and closes with Escape before restoring the opener

  ```
  AssertionError: expected '"use client";\n\nimport { useEffect, …' to contain '<dialog ref={ref} data-slot="drawer"'
  - Expected
  + Received
  - <dialog ref={ref} data-slot="drawer"
  + "use client";
  +
  + import { useEffect, useId, useRef, type ReactNode, type RefObject, type CSSProperties } from "react";
  + import { Button } from "@/components/ui/button";
  ```

## tests/unit/chat6-superadmin-middle-inbound-mail-26.test.tsx (3 failing)
- SA-middle-inbound-mail-26 private inbox role and partial states > does not query inbox data on duplicate selector keys or impossible pages

  ```
  Error: [vitest] No "INBOUND_ROUTING_METADATA_READY" export is defined on the "@/modules/inbound-mail/admin-service" mock. Did you forget to return it from "vi.mock"?
  If you need to partially mock a module, you can use "importOriginal" helper inside:
  vi.mock(import("@/modules/inbound-mail/admin-service"), async (importOriginal) => {
  const actual = await importOriginal()
  return {
  ...actual,
  // your mocked methods
  }
  ```
- SA-middle-inbound-mail-26 private inbox role and partial states > distinguishes a missing deployment from a genuinely empty inbox

  ```
  Error: [vitest] No "INBOUND_ROUTING_METADATA_READY" export is defined on the "@/modules/inbound-mail/admin-service" mock. Did you forget to return it from "vi.mock"?
  If you need to partially mock a module, you can use "importOriginal" helper inside:
  vi.mock(import("@/modules/inbound-mail/admin-service"), async (importOriginal) => {
  const actual = await importOriginal()
  return {
  ...actual,
  // your mocked methods
  }
  ```
- SA-middle-inbound-mail-26 private inbox role and partial states > passes only schema-validated tenant actor and normalized inbox pagination

  ```
  Error: [vitest] No "INBOUND_ROUTING_METADATA_READY" export is defined on the "@/modules/inbound-mail/admin-service" mock. Did you forget to return it from "vi.mock"?
  If you need to partially mock a module, you can use "importOriginal" helper inside:
  vi.mock(import("@/modules/inbound-mail/admin-service"), async (importOriginal) => {
  const actual = await importOriginal()
  return {
  ...actual,
  // your mocked methods
  }
  ```

## tests/unit/chat7-courses-weak-export-boundaries.test.ts (1 failing)
- chat-7 weak export boundaries: calendar exactness, rollout flags, scoped CSV and formula safety > COURSES-WEAK-EXPORT-04 keeps export URL inside college assessment endpoint without untrusted page/extra keys

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```

## tests/unit/chat7-legacy-faculty-quiz-report-copy.test.ts (2 failing)
- Faculty QuizReportContent.jsx dev legacy headings and empty states > preserves dynamic report title and exact legacy section names

  ```
  AssertionError: expected 'import { MetricBar } from "@/componen…' to contain '<PageHeader title={quiz.title} />'
  - Expected
  + Received
  - <PageHeader title={quiz.title} />
  + import { MetricBar } from "@/components/ui/metric-bar";
  + import styles from "@/components/courses/faculty-report-legacy-charts.module.css";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import {FacultyReportBackButton} from "@/components/courses/faculty-report-back-button";
  ```
- Faculty QuizReportContent.jsx dev legacy headings and empty states > uses exact empty text without claiming unreleased question results are visible

  ```
  AssertionError: expected 'import { MetricBar } from "@/componen…' to contain 'latest attempt only'
  - Expected
  + Received
  - latest attempt only
  + import { MetricBar } from "@/components/ui/metric-bar";
  + import styles from "@/components/courses/faculty-report-legacy-charts.module.css";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import {FacultyReportBackButton} from "@/components/courses/faculty-report-back-button";
  ```

## tests/unit/chat7-superadmin-course-assessment-ux-boundaries.test.ts (3 failing)
- SA-academics-people-64/65 Super Admin assessment privacy and phone states > SA-academics-people-64 rejects quiz-only result publication filters rather than throwing after fetching

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'query.data.results !== "ALL"'
  - Expected
  + Received
  - query.data.results !== "ALL"
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {isSuperAdmin} from "@/modules/identity/context";
  + import { EmptyState } from "@/components/ui/empty-state";
  ```
- SA-academics-people-64/65 Super Admin assessment privacy and phone states > SA-academics-people-64 offers 44px Section, Publish grades and retry actions

  ```
  AssertionError: expected '"use client";\nimport {Select} from "…' to contain 'Publish grades for every graded submi…'
  - Expected
  + Received
  - Publish grades for every graded submission in this Section?
  + "use client";
  + import {Select} from "@/components/ui/select";
  + import {Button} from "@/components/ui/button";
  + import {Alert} from "@/components/ui/alert";
  ```
- SA-academics-people-64/65 Super Admin assessment privacy and phone states > SA-academics-people-65 keeps private quiz attempts within keyboard-readable 44px controls and contained list

  ```
  AssertionError: expected '"use client";\n\nimport {useEffect,us…' to contain 'aria-label="Quiz submissions, scroll …'
  - Expected
  + Received
  - aria-label="Quiz submissions, scroll for more attempts"
  + "use client";
  +
  + import {useEffect,useRef,useState} from "react";
  + import {Input} from "@/components/ui/input";
  ```
