# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat16-recruiter-invite-otp-http-16.test.ts (2 failing)
- chat-16 public recruiter invitation code request and acceptance routes > REC-INVITE-HTTP-19 sends codes only through a dedicated delivery adapter and confirms delivery acceptance

  ```
  AssertionError: expected 422 to be 200 // Object.is equality
  - Expected
  + Received
  - 200
  + 422
  ```
- chat-16 public recruiter invitation code request and acceptance routes > REC-INVITE-HTTP-20 treats used, expired, throttled and failed code requests indistinguishably

  ```
  AssertionError: expected 422 to be 404 // Object.is equality
  - Expected
  + Received
  - 404
  + 422
  ```

## tests/unit/chat19-clone-sidebar-checkpoint.test.ts (4 failing)
- chat-19 B3/B4 legacy shell source-value checks > keeps the legacy white panel and light border

  ```
  AssertionError: expected '/*\n * Legacy sidebar shell (docs/des…' to contain 'background:#fff;'
  - Expected
  + Received
  - background:#fff;
  + /*
  +  * Legacy sidebar shell (docs/design/old-lms-shell.css).
  +  * Desktop: 96px rail -> 256px on hover/focus, content PUSHES right.
  +  * Mobile uses the existing focus-trapped drawer and always shows labels.
  ```
- chat-19 B3/B4 legacy shell source-value checks > matches the teal active fill and inset bar

  ```
  AssertionError: expected '/*\n * Legacy sidebar shell (docs/des…' to contain 'background:#eff8fa;'
  - Expected
  + Received
  - background:#eff8fa;
  + /*
  +  * Legacy sidebar shell (docs/design/old-lms-shell.css).
  +  * Desktop: 96px rail -> 256px on hover/focus, content PUSHES right.
  +  * Mobile uses the existing focus-trapped drawer and always shows labels.
  ```
- chat-19 B3/B4 legacy shell source-value checks > keeps 7-percent teal hover wash and teal labels

  ```
  AssertionError: expected '/*\n * Legacy sidebar shell (docs/des…' to contain 'color:#1a95a1;'
  - Expected
  + Received
  - color:#1a95a1;
  + /*
  +  * Legacy sidebar shell (docs/design/old-lms-shell.css).
  +  * Desktop: 96px rail -> 256px on hover/focus, content PUSHES right.
  +  * Mobile uses the existing focus-trapped drawer and always shows labels.
  ```
- chat-19 B3/B4 legacy shell source-value checks > preserves AntD phone drawer width, safe-area body padding and native focus

  ```
  AssertionError: expected '"use client";\n\nimport { useEffect, …' to contain '!px-3 !pt-2 !pb-[calc(24px+env(safe-a…'
  - Expected
  + Received
  - !px-3 !pt-2 !pb-[calc(24px+env(safe-area-inset-bottom,0px))]
  + "use client";
  +
  + import { useEffect, useState } from "react";
  + import { usePathname } from "next/navigation";
  ```

## tests/unit/chat2-UX-tpo-last-third-coverage-closure.test.ts (1 failing)
- TPO last third page-level UX coverage closure > UX-tpo-verification-01 preserves invalid, denied, disabled, unavailable, empty and paginated states

  ```
  AssertionError: expected 'import { PageHeader } from "@/compone…' to contain 'Verification records are not availabl…'
  - Expected
  + Received
  - Verification records are not available right now
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Alert } from "@/components/ui/alert";
  + import Link from "next/link";
  + import {TpoSafeCsvDownload} from "@/components/tpo/tpo-safe-csv-download";
  ```

## tests/unit/chat2-engage-open-gap-decisions.test.ts (2 failing)
- Engage remaining safe and reachable controls > TPO-recruiters-07 provides the actual counted Needs doing chips and zero state

  ```
  AssertionError: expected '"use client";\nimport { PageHeader } …' to contain 'Nothing right now.'
  - Expected
  + Received
  - Nothing right now.
  + "use client";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Tabs } from "@/components/ui/tabs";
  + import { FilterChip } from "@/components/ui/filter-chip";
  ```
- Engage remaining safe and reachable controls > TPO-recruiters-36 has horizontally reachable stages and keyboard-trapped edit dialogs while retaining mobile actions

  ```
  AssertionError: expected '"use client";\nimport { PageHeader } …' to contain '<Dialog open={editing}'
  - Expected
  + Received
  - <Dialog open={editing}
  + "use client";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
  + import { Banner } from "@/components/ui/banner";
  ```

## tests/unit/chat2-recruiter-legacy-entrypoints.test.ts (2 failing)
- Legacy recruiter entrypoints > REC-calendar-messages-profile-47 redirects /recruiter to the canonical Today landing

  ```
  AssertionError: expected 'import {redirect} from "next/navigati…' to contain 'redirect("/hr/home")'
  - Expected
  + Received
  - redirect("/hr/home")
  + import {redirect} from "next/navigation";
  + /** Preserve the legacy recruiter entrypoint while using the canonical Today workspace. */
  + export default function RecruiterIndex(){redirect("/recruiter/home");}
  +
  ```
- Legacy recruiter entrypoints > REC-calendar-messages-profile-47 resolves the retired colleges page to Today rather than an unresolved route

  ```
  AssertionError: expected 'import {redirect} from "next/navigati…' to contain 'redirect("/hr/home")'
  - Expected
  + Received
  - redirect("/hr/home")
  + import {redirect} from "next/navigation";
  + /** Legacy college selector returns to recruiter Today; access selection stays scoped there. */
  + export default function RecruiterColleges(){redirect("/recruiter/home");}
  +
  ```

## tests/unit/chat2-tpo-last-third-report-branch-ctc-runtime.test.tsx (2 failing)
- chat-2 last-third report runtime SSR contract: by-branch and CTC > TPO-by-branch-03 shows truthful no-season empty state without inferring zero placement

  ```
  AssertionError: expected '<div data-tpo-presentation-report="tr…' to contain 'sm:px-6'
  Expected: "sm:px-6"
  Received: "<div data-tpo-presentation-report="true" class="min-w-0 space-y-4"><header data-slot="page-header" class="mb-2 flex w-full min-w-0 flex-col items-stretch gap-2 border-b border-[var(--lms-canvas-border)] pb-4 md:mb-4 md:flex-row md:items-start md:justify-between md:gap-6 [--lms-page-header
  ```
- chat-2 last-third report runtime SSR contract: by-branch and CTC > TPO-packages-05 keeps student-best-offer metrics distinct from offer histogram, including unknown CTC

  ```
  AssertionError: expected '<div data-tpo-presentation-report="tr…' to contain 'sm:grid-cols-2'
  Expected: "sm:grid-cols-2"
  Received: "<div data-tpo-presentation-report="true" class="min-w-0 space-y-4"><header data-slot="page-header" class="mb-2 flex w-full min-w-0 flex-col items-stretch gap-2 border-b border-[var(--lms-canvas-border)] pb-4 md:mb-4 md:flex-row md:items-start md:justify-between md:gap-6 [--lms-page-header
  ```
