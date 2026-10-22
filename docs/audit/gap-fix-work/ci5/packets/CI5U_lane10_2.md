# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat14-final-pub-auth-public-31.test.ts (1 failing)
- chat-14 final sprint > PUB-auth-public-31 broadcasts safe API failure globally and keeps the offline banner

  ```
  AssertionError: expected 'import {Suspense} from "react";\nimpo…' to contain '<ConnectionFailureNotice/>'
  - Expected
  + Received
  - <ConnectionFailureNotice/>
  + import {Suspense} from "react";
  + import {PortalAccessNotice} from "@/components/auth/portal-access-notice";
  + import {ConnectionFailureNotice} from "@/components/auth/connection-failure-notice";
  + import { redirect } from "next/navigation";
  ```

## tests/unit/chat16-inbound-mail-admin-page-16.test.tsx (1 failing)
- chat-16 inbound-mail Super Admin page-level failure and privacy journeys > UX-chat16-inbound-mail-02 renders a safe reset instead of querying an invalid recipient or page

  ```
  AssertionError: expected ' Every email sent to a 42lms.com addr…' to contain 'Invalid filters.'
  Expected: "Invalid filters."
  Received: " Every email sent to a 42lms.com address. Recruiters' replies to a conversation go straight into it; anything else waits here until someone reads it and marks it done. Private platform-wide inbox. Failed recruiter replies remain available for manual triage; this view never sends automatic
  ```

## tests/unit/chat16-recruiter-mail-http-boundaries-16.test.ts (4 failing)
- chat-16 authenticated recruiter email inbound/worker HTTP boundaries > REC-INBOUND-HTTP-02 bounds raw webhook bytes before any HMAC verification

  ```
  AssertionError: expected { error: 'INVALID_BODY', …(3) } to deeply equal { error: 'INVALID_BODY' }
  - Expected
  + Received
  {
  +   "action": "QUARANTINE_AND_NOTIFY_OPERATIONS",
  "error": "INVALID_BODY",
  +   "outcome": "STORED",
  +   "retryable": false,
  ```
- chat-16 authenticated recruiter email inbound/worker HTTP boundaries > REC-INBOUND-HTTP-04 reports successful replay truthfully and returns no-cache headers

  ```
  AssertionError: expected { Object (accepted, replayed, ...) } to deeply equal { accepted: true, replayed: true }
  - Expected
  + Received
  {
  "accepted": true,
  +   "outcome": "DUPLICATE",
  "replayed": true,
  }
  ```
- chat-16 authenticated recruiter email inbound/worker HTTP boundaries > REC-WORKER-HTTP-07 schedules only after a valid worker secret and denies false send receipts

  ```
  AssertionError: expected { skipped: true, …(2) } to deeply equal { Object (examined, sent, ...) }
  - Expected
  + Received
  {
  -   "enabled": true,
  -   "examined": 2,
  -   "sent": 0,
  +   "reason": "STARTUP_GRACE",
  ```
- chat-16 authenticated recruiter email inbound/worker HTTP boundaries > REC-WORKER-HTTP-08 avoids provider secret leakage if the authorized worker fails

  ```
  AssertionError: expected 200 to be 503 // Object.is equality
  - Expected
  + Received
  - 503
  + 200
  ```

## tests/unit/chat2-campaign-batch-persistence.test.ts (2 failing)
- TPO campaign delivery receipts and audit > TPO-campaigns-public-04 commits a college-scoped batch before sending and actual opaque statuses after

  ```
  AssertionError: expected 'import "server-only";\nimport {random…' to contain 'finalizedAt:new Date()'
  - Expected
  + Received
  - finalizedAt:new Date()
  + import "server-only";
  + import {randomUUID} from "node:crypto";
  + import {and,eq} from "drizzle-orm";
  + import {z} from "zod";
  ```
- TPO campaign delivery receipts and audit > TPO-campaigns-public-04 never claims delivery from provider acceptance or violates EMAIL event constraints

  ```
  AssertionError: expected 'import { Alert } from "@/components/u…' to contain 'TpoCampaignSendControl'
  - Expected
  + Received
  - TpoCampaignSendControl
  + import { Alert } from "@/components/ui/alert";
  + import { StatusBadge } from "@/components/ui/status-badge";
  + import { Tabs } from "@/components/ui/tabs";
  + import { Dropdown } from "@/components/ui/dropdown";
  ```

## tests/unit/chat2-team-handover-36.test.ts (1 failing)
- Scoped Team ownership handover > TPO-inbox-team-36 exposes guarded handover from People, not an unguarded role-revocation button

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'window.confirm'
  - Expected
  + Received
  - window.confirm
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { InlineNotice } from "@/components/ui/inline-notice";
  + import { useConfirmFlow } from "@/components/ui/use-confirm-flow";
  ```

## tests/unit/chat2-tpo-settings-team-trusted-page-behavior.test.ts (2 failing)
- UX-tpo-LAST-THIRD-01 settings people page server states > UX-tpo-LAST-THIRD-01 team page does not invent coordinator counts from unavailable tables

  ```
  TypeError: Converting circular structure to JSON
  --> starting at object with constructor 'Object'
  --- property 'default' closes the circle
  ```
- UX-tpo-LAST-THIRD-01 settings people page server states > UX-tpo-LAST-THIRD-01 trusted page keeps company relationships separate from explicit trusted domain storage

  ```
  TypeError: Converting circular structure to JSON
  --> starting at object with constructor 'Object'
  --- property 'default' closes the circle
  ```

## tests/unit/chat3-superadmin-people-audit-r1.test.ts (1 failing)
- CHAT3-SA-PEOPLE pagination and form audit > SA3-PEOPLE-02 route uses normalized numeric page size before DB fetch and URL pagination

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'limit: pageSize'
  - Expected
  + Received
  - limit: pageSize
  + import Link from "next/link";
  + import { SuperAdminPeopleCsvControl } from "@/components/admin/super-admin-people-csv-control";
  + import { superAdminPeopleExportHref } from "@/modules/people/admin-users-export-model";
  + import { redirect } from "next/navigation";
  ```

## tests/unit/chat4-college-people-responsive-directory.test.tsx (2 failing)
- COL-UX-PEOPLE-TABLE-03 mobile privacy and desktop People directory > keeps learner actions and active academic context accessible without a wide native table

  ```
  AssertionError: expected '<div class="min-w-0 space-y-6 md:spac…' to contain 'Students directory scrollable columns'
  - Expected
  + Received
  - Students directory scrollable columns
  + <div class="min-w-0 space-y-6 md:space-y-6"><header data-slot="page-header" class="mb-2 flex w-full min-w-0 flex-col items-stretch gap-2 border-b border-[var(--lms-canvas-border)] pb-4 md:mb-4 md:flex-row md:items-start md:justify-between md:gap-6 [--lms-page-header-title-size:20px] md:[--lms-page
  ```
- COL-UX-PEOPLE-TABLE-03 mobile privacy and desktop People directory > preserves faculty employment actions and never infers a nonexistent academic enrollment

  ```
  AssertionError: expected '<div class="min-w-0 space-y-6 md:spac…' to contain 'Faculty directory scrollable columns'
  - Expected
  + Received
  - Faculty directory scrollable columns
  + <div class="min-w-0 space-y-6 md:space-y-6"><header data-slot="page-header" class="mb-2 flex w-full min-w-0 flex-col items-stretch gap-2 border-b border-[var(--lms-canvas-border)] pb-4 md:mb-4 md:flex-row md:items-start md:justify-between md:gap-6 [--lms-page-header-title-size:20px] md:[--lms-page
  ```
