# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat13-super-admin-placements-s3-copy-verification.test.ts (4 failing)
- Chat 13 Super Admin placement legacy copy and S3 contracts > SA-placements-projects-33 company tabs

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' to contain '42&apos;s company list'
  - Expected
  + Received
  - 42&apos;s company list
  + import {Button} from "@/components/ui/button";
  + import {DataTable,type DataTableColumn} from "@/components/ui/data-table";
  + import {Banner} from "@/components/ui/banner";
  + import type {AdminCompanyRow} from "@/modules/placements/admin-company-directory-model";
  ```
- Chat 13 Super Admin placement legacy copy and S3 contracts > SA-placements-projects-48 optional broadcast button

  ```
  AssertionError: expected 'import {z} from "zod";\nexport const …' to contain 'Enter a secure HTTPS link'
  - Expected
  + Received
  - Enter a secure HTTPS link
  + import {z} from "zod";
  + export const superAdminCollegeBroadcastSchema=z.strictObject({
  +  audienceMode:z.enum(["ALL_COLLEGES","SELECTED_COLLEGES"]),
  +  collegeIds:z.array(z.uuid()).max(500),
  ```
- Chat 13 Super Admin placement legacy copy and S3 contracts > SA-placements-projects-04 drive legacy copy

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'Drives is college-scoped.'
  - Expected
  + Received
  - Drives is college-scoped.
  + import Link from "next/link";
  + import { listPlatformPlacementPolicy } from "@/modules/placements/platform-placement-policy-service";
  + import { SuperAdminPlatformPlacementPolicy } from "@/components/placements/super-admin-platform-placement-policy";
  + import { SuperAdminPlacementOversightNav } from "@/components/admin/super-admin-placement-oversight-nav";
  ```
- Chat 13 Super Admin placement legacy copy and S3 contracts > SA-placements-projects-36 recruiter legacy copy

  ```
  AssertionError: expected '"use client";\n\nimport {\n  useRef,\…' to contain '<h2 className="text-base font-semibol…'
  - Expected
  + Received
  - <h2 className="text-base font-semibold">Recruiter account lifecycle</h2>
  + "use client";
  +
  + import {
  +   useRef,
  ```

## tests/unit/chat14-final-pub-auth-public-31.test.ts (1 failing)
- chat-14 final sprint > PUB-auth-public-31 broadcasts safe API failure globally and keeps the offline banner

  ```
  AssertionError: expected '"use client";\nimport {useEffect,useR…' to contain 'role="status"'
  - Expected
  + Received
  - role="status"
  + "use client";
  + import {useEffect,useRef,useState} from "react";
  + import {InlineNotice} from "@/components/ui/inline-notice";
  + import {Button} from "@/components/ui/button";
  ```

## tests/unit/chat15-multipart-no-file.test.ts (1 failing)
- chat-15 one-shot mixed learner submissions > LEARNER-learning-misc-04 keeps verified file, written and link parts in one transaction

  ```
  AssertionError: expected '"use client";\nimport { Select } from…' to contain 'multipartEnabled?"Combine work":"File…'
  - Expected
  + Received
  - multipartEnabled?"Combine work":"File Upload"
  + "use client";
  + import { Select } from "@/components/ui/select";
  +
  + import {
  ```

## tests/unit/chat16-hr-bell-http-19.test.ts (2 failing)
- chat-16 recruiter bell real route permissions, privacy and idempotent response > HR-BELL-HTTP-01 GET projects only authorized notifications in private cache

  ```
  AssertionError: expected 401 to be 200 // Object.is equality
  - Expected
  + Received
  - 200
  + 401
  ```
- chat-16 recruiter bell real route permissions, privacy and idempotent response > HR-BELL-HTTP-03 duplicate read submits may safely return zero updated rows

  ```
  AssertionError: expected { marked: +0, ok: true } to deeply equal { marked: +0 }
  - Expected
  + Received
  {
  "marked": 0,
  +   "ok": true,
  }
  ```

## tests/unit/chat16-messaging-receipt-history-service-16.test.ts (1 failing)
- chat-16 TPO aggregate outbound receipt authorization and privacy > messaging-receipt-history-17 validates bounded filters before querying receipt counts

  ```
  AssertionError: expected "vi.fn()" to not be called at all, but actually been called 4 times
  Received:
  1st vi.fn() call:
  Array []
  2nd vi.fn() call:
  Array []
  3rd vi.fn() call:
  Array []
  ```

## tests/unit/chat16-public-platform-error-loading-pages-16.test.tsx (5 failing)
- chat-16 real public platform and root recovery page rendering > UX-chat16-platform-16 describes existing learning, projects and placements rather than dropped AI agents

  ```
  AssertionError: expected '<link rel="preload" as="image" href="…' to contain 'Placement workspace'
  - Expected
  + Received
  - Placement workspace
  + <link rel="preload" as="image" href="/assets/images/legacy-42lms-logo.svg"/><div class="min-h-dvh bg-background text-foreground"><script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"Organization","@id":"https://42lms.com/#organization","name":"42 LMS","url":"http
  ```
- chat-16 real public platform and root recovery page rendering > UX-chat16-public-marketing-21 describes current university and employer workflows without invented AI delivery

  ```
  AssertionError: expected 'Develop employable graduates: evaluat…' to be 'Develop employable graduates through …' // Object.is equality
  Expected: "Develop employable graduates through learning and placements."
  Received: "Develop employable graduates: evaluate performance across exams, assignments, projects, and interviews, identify gaps early, and improve career readiness."
  ```
- chat-16 real public platform and root recovery page rendering > UX-chat16-errors-17 never renders provider exceptions, stack traces, or private digest values

  ```
  AssertionError: expected '<main role="alert" class="flex min-h-…' to contain 'This page is temporarily unavailable'
  Expected: "This page is temporarily unavailable"
  Received: "<main role="alert" class="flex min-h-dvh w-full min-w-0 flex-col items-center justify-center bg-[#fafbfc] p-8 text-center"><h1 class="m-0 text-[64px] font-extrabold leading-none text-[#1e9aa8]">500</h1><h2 class="mb-2 mt-4 text-[24px] font-semibold leading-[32px] text-[#1a1d21]">Server Er
  ```
- chat-16 real public platform and root recovery page rendering > UX-chat16-not-found-19 renders a first-party recovery route instead of a redirect loop

  ```
  Error: A component suspended while responding to synchronous input. This will cause the UI to be replaced with a loading indicator. To fix, updates that suspend should be wrapped with startTransition.
  ❯ renderToStringImpl node_modules/react-dom/cjs/react-dom-server-legacy.node.development.js:8947:15
  ❯ process.env.NODE_ENV.exports.renderToStaticMarkup node_modules/react-dom/cjs/react-dom-server-legacy.node.development.js:10426:14
  ```
- chat-16 real public platform and root recovery page rendering > UX-chat16-loading-20 displays visible, accessible loading affordances

  ```
  AssertionError: expected '<link rel="preload" as="image" href="…' to contain 'Loading your page'
  Expected: "Loading your page"
  Received: "<link rel="preload" as="image" href="/assets/images/legacy-42lms-logo.svg"/><main class="_page_3b67a1 min-w-0"><header class="_header_3b67a1 min-w-0"><a class="_brand_3b67a1" aria-label="42LMS home" href="/"><img src="/assets/images/legacy-42lms-logo.svg" alt="42LMS" class="_legacyLogo_3b
  ```
