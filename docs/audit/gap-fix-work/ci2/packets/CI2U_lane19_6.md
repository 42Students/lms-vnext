# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat13-superadmin-26-gap-parity-regression.test.ts (2 failing)
- Chat 13 reverified Super Admin placement parity > SA-placements-projects-27 keeps the verified implementation reachable

  ```
  AssertionError: expected 'import "server-only";\nimport {and,as…' to contain 'Keep at least one company domain.'
  - Expected
  + Received
  - Keep at least one company domain.
  + import "server-only";
  + import {and,asc,eq,ilike,inArray,ne} from "drizzle-orm";
  + import {z} from "zod";
  + import {getDb} from "@/db/client";
  ```
- Chat 13 reverified Super Admin placement parity > SA-placements-projects-33 keeps the verified implementation reachable

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' to contain 'This college&apos;s companies'
  - Expected
  + Received
  - This college&apos;s companies
  + import {Button} from "@/components/ui/button";
  + import {DataTable,type DataTableColumn} from "@/components/ui/data-table";
  + import {Banner} from "@/components/ui/banner";
  + import type {AdminCompanyRow} from "@/modules/placements/admin-company-directory-model";
  ```

## tests/unit/chat14-final-tpo-drives-13.test.ts (1 failing)
- chat-14 final sprint > TPO-drives-13 verifies the persisted selected-drive export and individual eligibility preflight

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'name="ids" type="checkbox"'
  - Expected
  + Received
  - name="ids" type="checkbox"
  + import Link from "next/link";
  + import { Dropdown } from "@/components/ui/dropdown";
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```

## tests/unit/chat15-offer-letter-and-placement.test.ts (2 failing)
- chat-15 learner offers and internship truth > LEARNER-placements-45 only reveals persisted safe HTTPS employer letters

  ```
  AssertionError: expected '"use client";\n\nimport { useRef, use…' to contain '<a href={item.letterHref} rel="noopen…'
  - Expected
  + Received
  - <a href={item.letterHref} rel="noopener noreferrer"
  + "use client";
  +
  + import { useRef, useState } from "react";
  + import { useRouter } from "next/navigation";
  ```
- chat-15 learner offers and internship truth > LEARNER-placements-45 reflects internship and LOI cascade exceptions

  ```
  AssertionError: expected '"use client";\n\nimport { useRef, use…' to contain 'Counts as placed: No'
  - Expected
  + Received
  - Counts as placed: No
  + "use client";
  +
  + import { useRef, useState } from "react";
  + import { useRouter } from "next/navigation";
  ```

## tests/unit/chat16-hr-notification-read-cas-16.test.ts (1 failing)
- chat-16 recruiter notifications versioned acknowledgement transaction > hr-notification-read-18 denies missing, already acknowledged and stale-version notifications before mutation

  ```
  AssertionError: promise resolved "{ …(2) }" instead of rejecting
  - Expected
  + Received
  - Error {
  -   "message": "rejected promise",
  + {
  +   "id": "11111111-1111-4111-8111-111111111111",
  +   "readAt": "2099-01-02T00:00:00.000Z",
  ```

## tests/unit/chat16-otp-notification-provider-contract-16.test.ts (4 failing)
- chat-16 OTP notification provider boundaries (isolated transport) > notification-zepto-canonical-recipient-16 sends the same normalized address in envelope and merge fields

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```
- chat-16 OTP notification provider boundaries (isolated transport) > notification-zepto-upstream-16 does not report HTTP 429 or ambiguous transport failure as accepted

  ```
  AssertionError: expected "vi.fn()" to be called 2 times, but got 0 times
  ❯ tests/unit/chat16-otp-notification-provider-contract-16.test.ts:100:23
  98|     await expect(provider.sendOtpEmail(otp)).resolves.toBe(false);
  99|     await expect(provider.sendOtpEmail(otp)).resolves.toBe(false);
  100|     expect(transport).toHaveBeenCalledTimes(2);
  |                       ^
  101|   });
  102|
  ```
- chat-16 OTP notification provider boundaries (isolated transport) > notification-exotel-denials-16 fails closed on invalid code, phone, missing DLT or unsafe account path

  ```
  AssertionError: expected "vi.fn()" to not be called at all, but actually been called 1 times
  Received:
  1st vi.fn() call:
  Array [
  "https://api.exotel.com/v1/Accounts/example-account/Sms/send.json",
  Object {
  "body": URLSearchParams {},
  "headers": Headers {},
  ```
- chat-16 OTP notification provider boundaries (isolated transport) > notification-exotel-request-16 emits registered DLT fields and reports acceptance only with a SID

  ```
  AssertionError: expected Headers { Authorization: 'Basic ZmFrZS1rZXk6ZmFrZS10b2tlbg==', 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' } to match object { Object (Content-Type) }
  - Expected
  + Received
  - {
  -   "Content-Type": "application/x-www-form-urlencoded",
  - }
  + Headers {}
  ```

## tests/unit/chat16-public-quiz-platform-states-04.test.tsx (3 failing)
- chat-16 public routes, quiz entry and resilient loading surfaces > UX-chat16-public-quiz-page-01 preserves the legacy all-quizzes return route on mobile

  ```
  AssertionError: expected '<link rel="preload" as="image" href="…' to contain 'sm:px-6'
  Expected: "sm:px-6"
  Received: "<link rel="preload" as="image" href="/assets/images/legacy-42lms-logo.svg"/><main class="min-h-dvh w-full bg-[var(--lms-neutral-100)] text-[var(--lms-neutral-900)]"><div class="mx-auto min-h-dvh w-full min-w-0"><a class="inline-flex min-h-11 items-center px-4 text-sm font-semibold text-[v
  ```
- chat-16 public routes, quiz entry and resilient loading surfaces > UX-chat16-public-platform-page-02 offers distinct learner, faculty, mentor, placement and recruiter descriptions

  ```
  AssertionError: expected '<link rel="preload" as="image" href="…' to contain 'Placement workspace'
  - Expected
  + Received
  - Placement workspace
  + <link rel="preload" as="image" href="/assets/images/legacy-42lms-logo.svg"/><div class="min-h-dvh bg-background text-foreground"><script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"Organization","@id":"https://42lms.com/#organization","name":"42 LMS","url":"http
  ```
- chat-16 public routes, quiz entry and resilient loading surfaces > UX-chat16-public-loading-04 exposes recoverable loading for all public route families

  ```
  AssertionError: expected '<div class="min-h-screen bg-[#f5f7f9]…' to contain 'Loading your page'
  Expected: "Loading your page"
  Received: "<div class="min-h-screen bg-[#f5f7f9] px-4 py-8" aria-busy="true"><main class="mx-auto w-full max-w-[760px] rounded-[8px] border border-[#e5e9f0] bg-white p-6"><p role="status" class="mb-4 text-sm text-body">Loading placements...</p><div role="status" aria-live="polite" data-slot="skeleto
  ```
