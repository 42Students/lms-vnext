# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat16-public-placements-route-16.test.tsx (1 failing)
- chat-16 public placements page role and safe-unavailability journeys > UX-chat16-public-placement-17 does not render an explicitly unpublished college page

  ```
  AssertionError: expected [Function] to throw error including 'NOT_FOUND' but got 'PUBLIC_PLACEMENTS_TEMPORARILY_UNAVAIL…'
  Expected: "NOT_FOUND"
  Received: "PUBLIC_PLACEMENTS_TEMPORARILY_UNAVAILABLE"
  ```

## tests/unit/chat2-team-handover-36.test.ts (1 failing)
- Scoped Team ownership handover > TPO-inbox-team-36 exposes guarded handover from People, not an unguarded role-revocation button

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain '<TpoTeamHandover'
  - Expected
  + Received
  - <TpoTeamHandover
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { hasPlacementTeamMembership } from "@/modules/placements/placement-team-access-model";
  + import { hasMembershipRole } from "@/modules/identity/context";
  ```

## tests/unit/chat4-college-groups-directory-query-and-ux.test.ts (1 failing)
- College Admin Student groups directory query and role journey > UX-COL-GROUPS-ONE-CANVAS-01 uses an unboxed filter area and existing responsive table actions

  ```
  AssertionError: expected 'import { Pagination } from "@/compone…' to contain 'Previous'
  - Expected
  + Received
  - Previous
  + import { Pagination } from "@/components/ui/pagination";
  + import Link from "next/link";
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```

## tests/unit/chat5-final-faculty-courses-a.test.ts (1 failing)
- chat-5 final sprint faculty course list and core lesson contracts > FAC-courses-07 debounces course search and immediately submits assigned-period, section and role filters via scoped GET

  ```
  AssertionError: expected '"use client";\nimport {useEffect,useR…' to contain 'target.name==="q"?350:0'
  - Expected
  + Received
  - target.name==="q"?350:0
  + "use client";
  + import {useEffect,useRef} from "react";
  + import {useRouter} from "next/navigation";
  +
  ```
