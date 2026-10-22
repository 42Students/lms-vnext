# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat16-public-placement-page-states-03.test.tsx (1 failing)
- chat-16 public placement page privacy and partial availability > UX-chat16-public-placements-snapshot-03 renders public aggregate only and an explicit date

  ```
  AssertionError: expected '<div class="min-h-screen bg-[#f5f7f9]…' to contain 'Recruiting employers'
  Expected: "Recruiting employers"
  Received: "<div class="min-h-screen bg-[#f5f7f9] px-4 py-8"><main data-testid="placements.public" class="mx-auto flex w-full max-w-[760px] flex-col gap-6"><section class="min-w-0 rounded-[8px] border border-[#e5e9f0] bg-white p-5 shadow-none sm:p-6" aria-labelledby="placements-public-heading"><h1 id
  ```

## tests/unit/chat2-public-placements-page.test.ts (1 failing)
- TPO public placements publication and copy > TPO-campaigns-public-36 uses the college-specific legacy heading and removes platform-only footer

  ```
  AssertionError: expected '"use client";\nimport { useRef,useSta…' to contain 'aria-label="Recruit from us"'
  - Expected
  + Received
  - aria-label="Recruit from us"
  + "use client";
  + import { useRef,useState } from "react";
  + import { Input } from "@/components/ui/input";
  + import { Textarea } from "@/components/ui/textarea";
  ```

## tests/unit/chat4-college-faculty-bulk-service.test.ts (1 failing)
- COL-people-faculty-bulk-01 confirmed, tenant-scoped batch imports > normalizes Indian phone numbers, creates only faculty roles and skips duplicate mobiles

  ```
  Error: Fix faculty CSV row issues before importing:
  Record 3: Duplicate mobile in file (record 2).
  Record 3: Duplicate email in file (record 2).
  ```

## tests/unit/chat4-tpo-home-team-asks-09.test.ts (1 failing)
- TPO-home-09 persisted team attention > TPO-home-09 computes only verified ask counts and never fabricates mentions from messages

  ```
  AssertionError: expected 'import { Badge } from "@/components/u…' to contain 'type:"TEAM_MESSAGES",priority:4'
  - Expected
  + Received
  - type:"TEAM_MESSAGES",priority:4
  + import { Badge } from "@/components/ui/badge";
  + import Link from "next/link";
  + import {TpoHomeReturnRefresh} from "@/components/tpo/tpo-home-return-refresh";
  + import {eq} from "drizzle-orm";
  ```
