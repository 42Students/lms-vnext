# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/PROJ-BREAK-chat9-college-project-outage.test.tsx (1 failing)
- IIT Dharwad College Admin Projects: independent outage and view contracts > PROJ-BREAK-college-ux-26 strict backend query excludes cards/table view but keeps valid filters

  ```
  AssertionError: expected { q: 'alpha', status: 'ACTIVE', …(2) } to deeply equal { q: 'alpha', status: 'ACTIVE', …(2) }
  - Expected
  + Received
  {
  "page": 2,
  -   "pageSize": 25,
  +   "pageSize": 20,
  "q": "alpha",
  ```

## tests/unit/UX-tpo-first-cross-audit-chat6.test.ts (1 failing)
- Chat-6 independent TPO first-third cross-audit > UX-tpo-calendar-21 follow-up creation preserves native back and IST

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'sm:text-sm'
  - Expected
  + Received
  - sm:text-sm
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { InlineNotice } from "@/components/ui/inline-notice";
  + import { Input } from "@/components/ui/input";
  ```

## tests/unit/chat12-verification-reasons-round3.test.ts (1 failing)
- chat-12 Verification legacy send-back reason selector > TPO-requests-verification-27 permits a custom-only reason but prevents an empty send-back

  ```
  AssertionError: expected '"use client";\nimport {apiFetch,Frien…' to contain 'The student sees your reason and fixe…'
  - Expected
  + Received
  - The student sees your reason and fixes it on their profile.
  + "use client";
  + import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
  + import {useEffect,useState} from "react";
  + import {useGuardedAction} from "@/hooks/use-guarded-action";
  ```

## tests/unit/chat16-campaign-unsubscribe-auth-28.test.ts (1 failing)
- chat-16 purpose-bound unsubscribe gate before storage access > T-S2-04-UNSUB-05 forged cross-college recipient ID fails without updating or revealing identity

  ```
  AssertionError: promise resolved "{ unsubscribed: true }" instead of rejecting
  - Expected
  + Received
  - Error {
  -   "message": "rejected promise",
  + {
  +   "unsubscribed": true,
  }
  ```
