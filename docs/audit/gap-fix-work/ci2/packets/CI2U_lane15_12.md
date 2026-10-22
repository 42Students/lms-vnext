# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/learner-placements-chat7-schedule-surface.test.ts (1 failing)
- Chat-7 schedule parity > LEARNER-placements-41 exposes online assessments without pretending schedule is attendance

  ```
  AssertionError: expected '"use client";\n\nimport { useState } …' not to contain 'target="_blank"'
  - Expected
  + Received
  - target="_blank"
  + "use client";
  +
  + import { useState } from "react";
  + import { Button } from "@/components/ui/button";
  ```

## tests/unit/mentor-projects-chat7-round6.test.ts (3 failing)
- chat-7 mentor projects round-six legacy parity > MEN-projects-meetings-15 shows archived workspace consequences without leaking mutating controls

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain 'tasks, resources, meetings and the su…'
  - Expected
  + Received
  - tasks, resources, meetings and the submission can no longer be changed
  + import { EmptyState } from "@/components/ui/empty-state";
  + import Link from "next/link";
  + import { Tabs } from "@/components/ui/tabs";
  + import { Disclosure } from "@/components/ui/disclosure";
  ```
- chat-7 mentor projects round-six legacy parity > MEN-projects-meetings-24 shows the project team heading and roster count for mentors

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain 'mode==="ADMIN"?"Project people":"Proj…'
  - Expected
  + Received
  - mode==="ADMIN"?"Project people":"Project team"
  + import { EmptyState } from "@/components/ui/empty-state";
  + import Link from "next/link";
  + import { Tabs } from "@/components/ui/tabs";
  + import { Disclosure } from "@/components/ui/disclosure";
  ```
- chat-7 mentor projects round-six legacy parity > MEN-projects-meetings-38 renames the mentor release section and hides admin engineering copy

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain 'mode==="ADMIN"?"Execution":"Releases …'
  - Expected
  + Received
  - mode==="ADMIN"?"Execution":"Releases and Sprints"
  + import { EmptyState } from "@/components/ui/empty-state";
  + import Link from "next/link";
  + import { Tabs } from "@/components/ui/tabs";
  + import { Disclosure } from "@/components/ui/disclosure";
  ```

## tests/unit/project-class-team-create-request.test.ts (1 failing)
- parses valid create request

  ```
  AssertionError: expected { …(10) } to deeply equal { …(9) }
  - Expected
  + Received
  @@ -3,10 +3,11 @@
  "baseTitle": "Demo",
  "classId": "00000000-0000-4000-8000-000000000001",
  "cohortMode": false,
  "collegeId": "00000000-0000-4000-8000-000000000001",
  ```

## tests/unit/r2-private-prefix.test.ts (2 failing)
- shared legacy bucket guard > is allowed in development with a trailing-slash prefix

  ```
  PrivateObjectStorageError: PRIVATE_STORAGE_BUCKET_UNSAFE
  ❯ getPrivateR2Config src/modules/storage/r2-config.ts:54:11
  52|       keyPrefix.includes("..") || keyPrefix.includes("\\") ||
  53|       keyPrefix.includes("//") || /[\\x00-\\x1f]/.test(keyPrefix))) {
  54|     throw new PrivateObjectStorageError("PRIVATE_STORAGE_BUCKET_UNSAFE…
  |           ^
  55|   }
  56|   // Check all known legacy public bucket names. There is no public-URL
  ```
- key prefix > is applied to upload grants while the logical key stays unprefixed

  ```
  PrivateObjectStorageError: PRIVATE_STORAGE_BUCKET_UNSAFE
  ❯ getPrivateR2Config src/modules/storage/r2-config.ts:54:11
  52|       keyPrefix.includes("..") || keyPrefix.includes("\\") ||
  53|       keyPrefix.includes("//") || /[\\x00-\\x1f]/.test(keyPrefix))) {
  54|     throw new PrivateObjectStorageError("PRIVATE_STORAGE_BUCKET_UNSAFE…
  |           ^
  55|   }
  56|   // Check all known legacy public bucket names. There is no public-URL
  ```

## tests/unit/sa-academics-people-26-27.test.ts (1 failing)
- SA-academics-people-27 lecture hall directory > handles strict filters, page sizes and search-preserving pagination

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain '<form action="/admin/lecture-halls" m…'
  - Expected
  + Received
  - <form action="/admin/lecture-halls" method="get">
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {requireSuperAdminSelectedCollege} from "@/modules/admin-ui/super-admin-selected-college";
  + import { LectureHallManager } from "@/components/admin/lecture-hall-manager";
  ```

## tests/unit/super-admin-student-overrides.test.ts (1 failing)
- student overrides and locks summary > labels stored disabled rule separately from effective access

  ```
  AssertionError: expected { module: 'placements', …(5) } to match object { stored: true, ignored: false, …(1) }
  (3 matching properties omitted from actual)
  - Expected
  + Received
  {
  -   "ignored": false,
  +   "ignored": true,
  "stored": true,
  ```
