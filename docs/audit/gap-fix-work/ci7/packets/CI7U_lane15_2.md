# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat19-north-star-legacy-sidebar.test.ts (1 failing)
- NORTH-STAR-SIDEBAR-01: old LMS 96px rail, hover push and icons > matches all measured sidebar link, heading, badge and logo values from the old CSS

  ```
  AssertionError: expected '"use client";\n\nimport { useEffect, …' to contain 'bodyClassName="!px-3 !pt-2'
  - Expected
  + Received
  - bodyClassName="!px-3 !pt-2
  + "use client";
  +
  + import { useEffect, useState } from "react";
  + import { usePathname } from "next/navigation";
  ```

## tests/unit/chat2-unsubscribe-graceful.test.ts (1 failing)
- Public unsubscribe confirmations > TPO-campaigns-public-16 permits idempotent used signed tokens, but rejects unverified ones

  ```
  AssertionError: expected 'import {NextResponse} from "next/serv…' to contain 'scope=placement-cell'
  - Expected
  + Received
  - scope=placement-cell
  + import {NextResponse} from "next/server";
  + import {sql} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  + import {isSameOriginRequest} from "@/auth/origin";
  ```

## tests/unit/chat4-learner-home-courses-gap-closure.test.ts (1 failing)
- chat-4 learner Home and Courses gap closure > LEARNER-home-courses-13 learner header retains Course workspace and separate read-only status

  ```
  AssertionError: expected 'import { Banner } from "@/components/…' to contain 'title={workspace.course.name}'
  - Expected
  + Received
  - title={workspace.course.name}
  + import { Banner } from "@/components/ui/banner";
  + import { CoursesServiceError } from "@/modules/courses/errors";
  + import { AuthorizationError } from "@/modules/permissions/policy";
  + import { ZodError } from "zod";
  ```

## tests/unit/chat5-ux-cross-tpo-last.test.ts (2 failing)
- Chat-5 UX CROSS AUDIT: /tpo LAST THIRD (routes 85–126) > UX-tpo-settings-team-10 exposes all list data and actions via mobile DataTable with explicit empty copy

  ```
  AssertionError: expected [ 'mobilePriority:"secondary"', …(3) ] to have a length of 3 but got 4
  - Expected
  + Received
  - 3
  + 4
  ```
- Chat-5 UX CROSS AUDIT: /tpo LAST THIRD (routes 85–126) > UX-tpo-settings-recruiters-12 reviews grant, revoke and extension without native confirmations

  ```
  AssertionError: expected [] to have a length of 3 but got +0
  - Expected
  + Received
  - 3
  + 0
  ```
