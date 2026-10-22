# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/learner-coding-profile-privacy.test.ts (1 failing)
- never renders spoofed profile hosts or unsafe schemes

  ```
  AssertionError: expected 'https://github.com/real' to be null
  - Expected:
  null
  + Received:
  "https://github.com/real"
  ```

## tests/unit/mentor-resource-audit-create.test.ts (1 failing)
- keeps create resource audit inside the project transaction with safe metadata

  ```
  AssertionError: expected '{"projectId":"project-a","resourceId"…' not to contain 'Reference'
  Expected: "Reference"
  Received: "{"projectId":"project-a","resourceId":"resource-a","resourceKey":"resource-a","actionType":"CREATE","beforeJson":null,"afterJson":{"title":"Reference =unsafe","sequence":null,"required":null,"visibility":null,"resourceType":null,"status":null,"pinned":null,"legacyResourceKind":null,"url":
  ```

## tests/unit/super-admin-tracker-active-route-guards.test.ts (1 failing)
- DB10 tracker Super Admin active account route fences > checks an active actor before trackerAdminRuntimeEnabled() in src/app/(authenticated)/tracker/issues/…

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to match /platformStatus\s*!==\s*"ACTIVE"/
  - Expected:
  /platformStatus\s*!==\s*"ACTIVE"/
  + Received:
  "import Link from \"next/link\";
  import { redirect } from \"next/navigation\";
  import { getCurrentRequestContext } from \"@/auth/request-context\";
  import { TrackerAdminNav } from \"@/components/tracker/tracker-admin-nav\";
  ```

## tests/unit/tpo-inbox-team-round2.test.ts (2 failing)
- Chat-2 TPO Inbox + Team legacy verification round 2 > TPO-inbox-team-09 refreshes recruiter messages every four seconds and on focus without GET writes

  ```
  AssertionError: expected '"use client";\nimport {useEffect,useR…' to contain 'window.addEventListener("focus",refre…'
  - Expected
  + Received
  - window.addEventListener("focus",refresh)
  + "use client";
  + import {useEffect,useRef,useState} from "react";
  + import {useRouter} from "next/navigation";
  +
  ```
- Chat-2 TPO Inbox + Team legacy verification round 2 > TPO-inbox-team-58 rejects overlong announcement titles and bodies in create and edit forms

  ```
  AssertionError: expected 'import "server-only";\nimport {and,eq…' to contain 'max(200)'
  - Expected
  + Received
  - max(200)
  + import "server-only";
  + import {and,eq,isNull} from "drizzle-orm";
  + import {z} from "zod";
  + import {getDb} from "@/db/client";
  ```
