# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat16-public-recruit-enquiry-route-guards-16.test.ts (1 failing)
- chat-16 anonymous recruiter enquiry HTTP outage and scope safety > PUBLIC-ENQUIRY-FAIL-21 keeps public rate-limit and readiness distinctions

  ```
  AssertionError: expected { …(2) } to deeply equal { Object (error) }
  - Expected
  + Received
  {
  "error": "RECRUITER_ENQUIRIES_UNAVAILABLE",
  +   "message": "Recruitment enquiries are temporarily unavailable.",
  }
  ```

## tests/unit/chat2-team-member-and-alert-parity.test.ts (1 failing)
- chat-2 Team membership, context and event notifications > TPO-inbox-team-38 lets authorized college admins and TPO admins participate, with persisted college scope

  ```
  AssertionError: expected 'import {hasPlacementTeamMembership} f…' to contain 'new Set(active.map(member=>member.id)…'
  - Expected
  + Received
  - new Set(active.map(member=>member.id)).size!==2
  + import {hasPlacementTeamMembership} from "./placement-team-access-model";
  + import "server-only";
  + import {createHash} from "node:crypto";
  + import {and,eq,inArray,isNull,sql} from "drizzle-orm";
  ```

## tests/unit/chat4-college-projects-canonical-page.test.ts (1 failing)
- PROJ-BREAK-COLLEGE-04-PAGE-06 stale College Admin project bookmarks > keeps malformed and cross-tenant URL filters out before building any canonical redirect

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```

## tests/unit/chat5-final-faculty-courses-b.test.ts (1 failing)
- chat-5 final sprint: teaching surface and discussion parity > FAC-courses-33 redirects legacy cls deep links only to an assigned matching course and section

  ```
  AssertionError: expected 'import { Suspense } from "react";\nim…' to contain 'if(!target)redirect('
  - Expected
  + Received
  - if(!target)redirect(
  + import { Suspense } from "react";
  + import { Select } from "@/components/ui/select";
  + import { Button } from "@/components/ui/button";
  + import Link from "next/link";
  ```
