# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat15-offer-letter-and-placement.test.ts (1 failing)
- chat-15 learner offers and internship truth > LEARNER-placements-45 only reveals persisted safe HTTPS employer letters

  ```
  AssertionError: expected '"use client";\n\nimport { useRef, use…' to contain '<a href={item.letterHref} target="_bl…'
  - Expected
  + Received
  - <a href={item.letterHref} target="_blank" rel="noopener noreferrer"
  + "use client";
  +
  + import { useRef, useState } from "react";
  + import { useRouter } from "next/navigation";
  ```

## tests/unit/chat16-public-company-share-page-16.test.ts (2 failing)
- chat-16 public company-share page private applicant and access states > UX-chat16-company-share-16 requires a separate six-digit access proof before rendering applicants

  ```
  Error: useToast must be used within ToastProvider
  ❯ useToast src/components/ui/toast.tsx:210:23
  208| export function useToast() {
  209|   const context = useContext(ToastContext);
  210|   if (!context) throw new Error("useToast must be used within ToastPro…
  |                       ^
  211|   return context;
  212| }
  ```
- chat-16 public company-share page private applicant and access states > UX-chat16-company-share-18 keeps temporary provider errors private and provides a retry

  ```
  AssertionError: expected '<main class="_page_f6fce7 mx-auto min…' to contain 'Try again'
  Expected: "Try again"
  Received: "<main class="_page_f6fce7 mx-auto min-h-dvh max-w-[1000px] px-4 py-12"><section aria-label="Shared applicants unavailable" class="mx-auto mt-12 max-w-[480px] rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-5"><section data-slot="error-state" role="
  ```

## tests/unit/chat17-tenant-dns-verifier.test.ts (8 failing)
- WEAK-tenant-domains: DNS proof never treats lookup failure as ownership > WEAK-tenant-domains-01 splits TXT chunks then requires entire exact verification value

  ```
  Error: [vitest] No "Resolver" export is defined on the "node:dns/promises" mock. Did you forget to return it from "vi.mock"?
  If you need to partially mock a module, you can use "importOriginal" helper inside:
  vi.mock(import("node:dns/promises"), async (importOriginal) => {
  const actual = await importOriginal()
  return {
  ...actual,
  // your mocked methods
  }
  ```
- WEAK-tenant-domains: DNS proof never treats lookup failure as ownership > WEAK-tenant-domains-02 matches complete TXT record, not lookalike suffix or prefix

  ```
  Error: [vitest] No "Resolver" export is defined on the "node:dns/promises" mock. Did you forget to return it from "vi.mock"?
  If you need to partially mock a module, you can use "importOriginal" helper inside:
  vi.mock(import("node:dns/promises"), async (importOriginal) => {
  const actual = await importOriginal()
  return {
  ...actual,
  // your mocked methods
  }
  ```
- WEAK-tenant-domains: DNS proof never treats lookup failure as ownership > WEAK-tenant-domains-03 ENODATA missing DNS returns unverified without leaking system errors

  ```
  
  ```
- WEAK-tenant-domains: DNS proof never treats lookup failure as ownership > WEAK-tenant-domains-03 ENOTFOUND missing DNS returns unverified without leaking system errors

  ```
  Error: [vitest] No "Resolver" export is defined on the "node:dns/promises" mock. Did you forget to return it from "vi.mock"?
  If you need to partially mock a module, you can use "importOriginal" helper inside:
  vi.mock(import("node:dns/promises"), async (importOriginal) => {
  const actual = await importOriginal()
  return {
  ...actual,
  // your mocked methods
  }
  ```
- WEAK-tenant-domains: DNS proof never treats lookup failure as ownership > WEAK-tenant-domains-04 ETIMEOUT resolver error fails closed

  ```
  
  ```
- WEAK-tenant-domains: DNS proof never treats lookup failure as ownership > WEAK-tenant-domains-04 EAI_AGAIN resolver error fails closed

  ```
  
  ```
- WEAK-tenant-domains: DNS proof never treats lookup failure as ownership > WEAK-tenant-domains-04 SERVFAIL resolver error fails closed

  ```
  Error: [vitest] No "Resolver" export is defined on the "node:dns/promises" mock. Did you forget to return it from "vi.mock"?
  If you need to partially mock a module, you can use "importOriginal" helper inside:
  vi.mock(import("node:dns/promises"), async (importOriginal) => {
  const actual = await importOriginal()
  return {
  ...actual,
  // your mocked methods
  }
  ```
- WEAK-tenant-domains: DNS proof never treats lookup failure as ownership > WEAK-tenant-domains-05 malformed thrown resolver objects fail closed, never verified

  ```
  Error: [vitest] No "Resolver" export is defined on the "node:dns/promises" mock. Did you forget to return it from "vi.mock"?
  If you need to partially mock a module, you can use "importOriginal" helper inside:
  vi.mock(import("node:dns/promises"), async (importOriginal) => {
  const actual = await importOriginal()
  return {
  ...actual,
  // your mocked methods
  }
  ```

## tests/unit/chat2-final-sprint-conversations-b.test.ts (2 failing)
- Final sprint recruiter conversation parity — group B > REC-calendar-messages-profile-11 exposes in-place general conversation with history and reply

  ```
  AssertionError: expected 'import inboxStyles from "@/components…' to contain 'Message the placement cell · General'
  - Expected
  + Received
  - Message the placement cell · General
  + import inboxStyles from "@/components/hr/recruiter-conversations-legacy.module.css";
  + import { EmptyState } from "@/components/ui/empty-state";
  + import {NeedsDoingChips} from "@/components/ui/needs-doing-chips";
  + import { Tabs } from "@/components/ui/tabs";
  ```
- Final sprint recruiter conversation parity — group B > REC-calendar-messages-profile-13 refreshes recruiter inbox and detail every four seconds while visible

  ```
  AssertionError: expected '"use client";\nimport {useEffect,useR…' to contain 'window.setInterval(update,4000)'
  - Expected
  + Received
  - window.setInterval(update,4000)
  + "use client";
  + import {useEffect,useRef,useState} from "react";
  + import {useRouter} from "next/navigation";
  + import { Button } from "@/components/ui/button";
  ```

## tests/unit/chat2-tpo-last-third-runtime-settings-pages.test.tsx (2 failing)
- chat-2 TPO last-third runtime settings pages > TPO-settings-team-page-04 keeps roster PII unrendered and exposes phone labels in the table

  ```
  AssertionError: expected '<div class="min-w-0 space-y-6"><heade…' to contain 'sm:hidden'
  - Expected
  + Received
  - sm:hidden
  + <div class="min-w-0 space-y-6"><header data-slot="page-header" class="mb-2 flex w-full min-w-0 flex-col items-stretch gap-2 border-b border-[var(--lms-canvas-border)] pb-4 md:mb-4 md:flex-row md:items-start md:justify-between md:gap-6 [--lms-page-header-title-size:20px] md:[--lms-page-header-title
  ```
- chat-2 TPO last-third runtime settings pages > TPO-settings-public-link-page-03 retains a visible retry signal if link storage is unavailable

  ```
  AssertionError: expected '<div class="min-w-0 space-y-5"><heade…' to contain 'Couldn\'t load the public link'
  Expected: "Couldn't load the public link"
  Received: "<div class="min-w-0 space-y-5"><header data-slot="page-header" class="mb-2 flex w-full min-w-0 flex-col items-stretch gap-2 border-b border-[var(--lms-canvas-border)] pb-4 md:mb-4 md:flex-row md:items-start md:justify-between md:gap-6 [--lms-page-header-title-size:20px] md:[--lms-page-hea
  ```

## tests/unit/chat3-faculty-course-list-model-boundaries.test.ts (1 failing)
- FAC-COURSE-LIST-MODEL-01 persisted Faculty delivery projection > pages only the already-authorized set, preserves caller rows and keeps a stale page recoverable

  ```
  AssertionError: expected [ { …(8) }, { …(8) }, { …(8) }, …(97) ] to have a length of 4 but got 100
  - Expected
  + Received
  - 4
  + 100
  ```

## tests/unit/chat4-college-academic-responsive-data-table.test.tsx (3 failing)
- COL-UX-ACADEMIC-TABLE-01 responsive Semester and Batch directories > renders the actual semester with native accessible table headers and all legacy actions

  ```
  AssertionError: expected '<div class="min-w-0 space-y-[var(--lm…' to contain 'Mapped courses'
  - Expected
  + Received
  - Mapped courses
  + <div class="min-w-0 space-y-[var(--lms-space-4)]"><header data-slot="page-header" class="mb-2 flex w-full min-w-0 flex-col items-stretch gap-2 border-b border-[var(--lms-canvas-border)] pb-4 md:mb-4 md:flex-row md:items-start md:justify-between md:gap-6 [--lms-page-header-title-size:20px] md:[--lm
  ```
- COL-UX-ACADEMIC-TABLE-01 responsive Semester and Batch directories > retains academic year, class count, status and Manage/Students links on batch cards

  ```
  AssertionError: expected '<div class="min-w-0 space-y-[var(--lm…' to contain '3 classes / 120 learners'
  - Expected
  + Received
  - 3 classes / 120 learners
  + <div class="min-w-0 space-y-[var(--lms-space-4)]"><header data-slot="page-header" class="mb-2 flex w-full min-w-0 flex-col items-stretch gap-2 border-b border-[var(--lms-canvas-border)] pb-4 md:mb-4 md:flex-row md:items-start md:justify-between md:gap-6 [--lms-page-header-title-size:20px] md:[--lm
  ```
- COL-UX-ACADEMIC-TABLE-01 responsive Semester and Batch directories > keeps a truthful no-results recovery state rather than an inaccessible empty table

  ```
  AssertionError: expected '<div class="min-w-0 space-y-[var(--lm…' to contain 'Clear filters'
  - Expected
  + Received
  - Clear filters
  + <div class="min-w-0 space-y-[var(--lms-space-4)]"><header data-slot="page-header" class="mb-2 flex w-full min-w-0 flex-col items-stretch gap-2 border-b border-[var(--lms-canvas-border)] pb-4 md:mb-4 md:flex-row md:items-start md:justify-between md:gap-6 [--lms-page-header-title-size:20px] md:[--lm
  ```

## tests/unit/chat4-college-ux-round4.test.ts (3 failing)
- Chat-4 College UX round 4 > UX-college-contacts-01 protects action size or responsive width

  ```
  AssertionError: expected 'import { DateInput } from "@/componen…' to contain 'min-w-0 overflow-x-clip space-y'
  - Expected
  + Received
  - min-w-0 overflow-x-clip space-y
  + import { DateInput } from "@/components/ui/date-input";
  + import { Input } from "@/components/ui/input";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { Button } from "@/components/ui/button";
  ```
- Chat-4 College UX round 4 > UX-college-course-progress-01 protects action size or responsive width

  ```
  AssertionError: expected 'import {CollegeProgressCapture} from …' to contain 'min-w-0 overflow-x-clip space-y'
  - Expected
  + Received
  - min-w-0 overflow-x-clip space-y
  + import {CollegeProgressCapture} from "@/components/courses/college-progress-last-good";
  + import { CollegeCourseMissingScope } from "@/components/courses/college-course-missing-scope";
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```
- Chat-4 College UX round 4 > UX-college-courses-01 protects action size or responsive width

  ```
  AssertionError: expected 'import { CollegeCourseMissingScope } …' to contain 'min-w-0 overflow-x-clip space-y'
  - Expected
  + Received
  - min-w-0 overflow-x-clip space-y
  + import { CollegeCourseMissingScope } from "@/components/courses/college-course-missing-scope";
  + import { CollegeCourseVisibilityRefresh } from "@/components/college/college-course-visibility-refresh";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {CollegeCoursesLastGood} from "@/components/college/college-courses-last-good";
  ```
