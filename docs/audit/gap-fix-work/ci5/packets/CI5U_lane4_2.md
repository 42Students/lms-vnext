# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat13-superadmin-gap-register-reconcile-a.test.ts (1 failing)
- SA-placements-projects-30 deliberate global/college boundary > SA-placements-projects-30 keeps global employer edits global but supports authorized college relationship creation and lifecycle

  ```
  AssertionError: expected '"use client";\nimport {useState,type …' to contain 'Create company'
  - Expected
  + Received
  - Create company
  + "use client";
  + import {useState,type FormEvent} from "react";
  + import {Dialog} from "@/components/ui/dialog";
  + import {Textarea} from "@/components/ui/textarea";
  ```

## tests/unit/chat16-campaign-unsubscribe-post-route-16.test.ts (1 failing)
- chat-16 explicit public campaign suppression API response and side effects > campaign-unsubscribe-route-20 distinguishes unregistered global suppression storage from successful opt-out

  ```
  AssertionError: expected { …(2) } to deeply equal { error: 'SUPPRESSIONS_NOT_READY' }
  - Expected
  + Received
  {
  "error": "SUPPRESSIONS_NOT_READY",
  +   "message": "That didn't work. Please try again.",
  }
  ```

## tests/unit/chat16-public-platform-error-loading-pages-16.test.tsx (1 failing)
- chat-16 real public platform and root recovery page rendering > UX-chat16-not-found-19 renders a first-party recovery route instead of a redirect loop

  ```
  AssertionError: expected '<main class="_legacyErrorPage_3b67a1"…' to contain 'Page not found'
  Expected: "Page not found"
  Received: "<main class="_legacyErrorPage_3b67a1"><div class="_center_3b67a1"><section class="_card_3b67a1" aria-labelledby="public-screen-title"><div class="_legacyHeading_3b67a1"><span class="_statusNumeral_3b67a1" aria-hidden="true">404</span><h1 id="public-screen-title" class="_legacyTitle_3b67a1
  ```

## tests/unit/chat19-sidebar-hr-value-parity.test.ts (1 failing)
- NORTH-STAR-CHAT19-POLISH: measured legacy sidebar and HR control tokens > matches the legacy collapsed badge position, icon opacity and body/footer spacing

  ```
  AssertionError: expected 'import { Suspense, type ReactNode } f…' to contain 'px-4 py-[25px]'
  - Expected
  + Received
  - px-4 py-[25px]
  + import { Suspense, type ReactNode } from "react";
  + import {
  +   hasMembershipRole,
  +   isSuperAdmin,
  ```

## tests/unit/chat2-public-placements-page.test.ts (1 failing)
- TPO public placements publication and copy > TPO-campaigns-public-36 uses the college-specific legacy heading and removes platform-only footer

  ```
  AssertionError: expected 'import { headers } from "next/headers…' to contain 'Placements at {college?.collegeName??…'
  - Expected
  + Received
  - Placements at {college?.collegeName??"your college"}
  + import { headers } from "next/headers";
  + import {notFound} from "next/navigation";
  + import { PublicRecruitFromUs } from "@/components/placements/public-recruit-from-us";
  + import { resolveRequestTenant } from "@/modules/auth/request-tenant";
  ```

## tests/unit/chat2-tpo-recruiter-leads-copy.test.ts (2 failing)
- TPO recruiter leads visible legacy parity > TPO-recruiters-43 retains designation in table and board and names unnamed contacts safely

  ```
  AssertionError: expected '"use client";\nimport { PageHeader } …' to contain 'lead.designation?<p'
  - Expected
  + Received
  - lead.designation?<p
  + "use client";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Tabs } from "@/components/ui/tabs";
  + import { FilterChip } from "@/components/ui/filter-chip";
  ```
- TPO recruiter leads visible legacy parity > TPO-recruiters-40 restores edit-action heading and legacy Save label

  ```
  AssertionError: expected '"use client";\nimport { PageHeader } …' to contain '>Save</button>'
  - Expected
  + Received
  - >Save</button>
  + "use client";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
  + import { Banner } from "@/components/ui/banner";
  ```

## tests/unit/chat3-final-sprint-company-memory.test.ts (1 failing)
- chat-3 final sprint TPO Companies company memory > TPO-companies-08 preserves the persisted legacy company memory contract

  ```
  AssertionError: expected '"use client";\nimport { PageBackLink …' to contain 'key:"year",header:"Year"'
  - Expected
  + Received
  - key:"year",header:"Year"
  + "use client";
  + import { PageBackLink } from "@/components/ui/page-back-link";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Badge } from "@/components/ui/badge";
  ```

## tests/unit/chat4-college-e2e-identity-directory.test.ts (1 failing)
- COL-people-e2e-identity-01 deterministic fixture identity isolation > normalizes the email SQL parameter and projects only directory attributes

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```
