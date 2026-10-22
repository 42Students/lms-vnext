# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat16-recruiter-inbound-bridge-boundaries-15.test.ts (2 failing)
- chat-16 recruiter inbound email gateway must reject hostile or stale messages > REC-INBOUND-03 rejects replay-looking malformed payloads and forged reply domains

  ```
  TypeError: Cannot read properties of undefined (reading 'execute')
  ❯ Module.acceptAuthenticatedRecruiterEmailReply src/modules/placements/recruiter-message-email-inbound-service.ts:127:25
  125|  // durable storage, including unknown mail, expired replies, and fail…
  126|  const db=getDb();
  127|  const [ready]=await db.execute<{ok:boolean}>(sql`
  |                         ^
  128|   select to_regclass('public.inbound_mail_messages') is not null as ok
  129|  `).then(result=>result.rows);
  ```
- chat-16 recruiter inbound email gateway must reject hostile or stale messages > REC-INBOUND-04 refuses provider ingestion while DB migrations are missing

  ```
  AssertionError: expected { accepted: false, …(2) } to deeply equal { accepted: false, replayed: false }
  - Expected
  + Received
  {
  "accepted": false,
  "replayed": false,
  +   "retryable": true,
  }
  ```

## tests/unit/chat17-tenant-domain-service-journeys.test.ts (2 failing)
- WEAK-tenant-domains service authorization, idempotency and hostile host journeys > WEAK-tenant-domains-13 unverified host cannot become primary

  ```
  AssertionError: expected "vi.fn()" to be called with arguments: [ Array(1) ]
  Received:
  1st vi.fn() call:
  [
  "44444444-4444-4444-8444-444444444444",
  +   {
  +     "adminScope": null,
  +     "membership": null,
  ```
- WEAK-tenant-domains service authorization, idempotency and hostile host journeys > WEAK-tenant-domains-14 primary-domain deletion requires exact confirmed name

  ```
  AssertionError: expected "vi.fn()" to be called with arguments: [ …(2) ]
  Received:
  1st vi.fn() call:
  [
  "44444444-4444-4444-8444-444444444444",
  "portal.example.edu",
  +   {
  +     "adminScope": null,
  ```

## tests/unit/chat2-LEARNER-placements-19-real-pagination.test.ts (1 failing)
- LEARNER-placements-19 — reviewer correction: no 20-item pagination gap > LEARNER-placements-19 binds the 20-item limit to the live filter and page controls

  ```
  AssertionError: expected '"use client";\n\nimport { useCallback…' to contain 'const visible = filterLearnerPlacemen…'
  - Expected
  + Received
  - const visible = filterLearnerPlacementJobs(matchingItems, filters, Date.parse(snapshotNowIso));
  + "use client";
  +
  + import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
  + import {Disclosure} from "@/components/ui/disclosure";
  ```

## tests/unit/chat2-engage-company-communication.test.ts (1 failing)
- Engage company communication legacy view > TPO-recruiters-R01 lets TPO filter, edit, export, and add contacts on Companies tab independent of leads

  ```
  AssertionError: expected '"use client";\nimport { PageHeader } …' to contain 'Export companies CSV'
  - Expected
  + Received
  - Export companies CSV
  + "use client";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Tabs } from "@/components/ui/tabs";
  + import { FilterChip } from "@/components/ui/filter-chip";
  ```

## tests/unit/chat2-recruiter-draft-discard.test.ts (1 failing)
- Recruiter Messages draft protection > REC-calendar-messages-profile-12 warns before closing a nonempty reply

  ```
  AssertionError: expected '"use client";\nimport {useEffect,useR…' to contain '<ConfirmActionDialog'
  - Expected
  + Received
  - <ConfirmActionDialog
  + "use client";
  + import {useEffect,useRef,useState,type FormEvent} from "react";
  + import {useRouter} from "next/navigation";
  + import {useGuardedAction} from "@/hooks/use-guarded-action";
  ```

## tests/unit/chat2-tpo-last-third-policy-break-01.test.ts (1 failing)
- TPO-BREAK-last-third-01 verification, published stats and export filters > interprets waiting windows in IST and never treats UTC midnight as an India day boundary

  ```
  AssertionError: expected '2026-10-13T18:30:00.000Z' to be '2026-10-14T18:30:00.000Z' // Object.is equality
  Expected: "2026-10-14T18:30:00.000Z"
  Received: "2026-10-13T18:30:00.000Z"
  ```
