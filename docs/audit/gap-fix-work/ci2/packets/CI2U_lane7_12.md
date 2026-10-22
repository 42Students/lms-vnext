# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/learner-placements-chat7-drive-facts.test.ts (2 failing)
- learner drive fact parity > LEARNER-placements-16 preserves published facts and application stage on role cards

  ```
  AssertionError: expected '"use client";\n\nimport { useRef, use…' to contain 'postedAtLabel(item.job.publishedAt)'
  - Expected
  + Received
  - postedAtLabel(item.job.publishedAt)
  + "use client";
  +
  + import { useRef, useState } from "react";
  + import { useRouter } from "next/navigation";
  ```
- learner drive fact parity > LEARNER-placements-25 restores persisted drive detail facts and sections

  ```
  AssertionError: expected 'import type {ReactNode} from "react";…' to contain 'Number.isFinite(Date.parse(item.job.p…'
  - Expected
  + Received
  - Number.isFinite(Date.parse(item.job.publishedAt))
  + import type {ReactNode} from "react";
  + import {learnerDriveDeadlineUrgency} from "@/modules/placements/learner-drive-deadline-urgency-model";
  + import { Breadcrumbs } from "@/components/ui/breadcrumbs";
  + import { PageHeader } from "@/components/ui/page-header";
  ```

## tests/unit/learner-withdrawal-model.test.ts (1 failing)
- Learner application withdrawal validation > requires an explicit confirmed action and a non-blank reason

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```

## tests/unit/outbound-messaging-providers.test.ts (1 failing)
- messaging provider adapter > uses the registered campaign template instead of OTP

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```

## tests/unit/pub-auth-public-42-rollback.test.ts (1 failing)
- PUB-auth-public-42 failed identity and grant steps must roll back > does not commit new user/profile after an invalid post-identity state

  ```
  AssertionError: expected 'import "server-only";\nimport {create…' to contain 'if(!profile||profile.companyId!==rela…'
  - Expected
  + Received
  - if(!profile||profile.companyId!==relationship.companyId||profile.status!=="ACTIVE")
  + import "server-only";
  + import {createHash} from "node:crypto";
  + import {and,desc,eq,inArray,isNull,sql} from "drizzle-orm";
  + import type {RequestContext} from "@/modules/identity/context";
  ```

## tests/unit/recruiter-drive-request-model.test.ts (1 failing)
- REC-home-drives-21 recruiter formal request contract > maps every request status without silently hiding declined or cancelled work

  ```
  AssertionError: expected 'Needs changes' to be 'Sent for review' // Object.is equality
  Expected: "Sent for review"
  Received: "Needs changes"
  ```

## tests/unit/super-admin-colleges-empty-state.test.ts (1 failing)
- Super Admin college empty state > uses the authorized collection rather than a global unscoped count

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' to contain 'q ? "No colleges match your search" :…'
  - Expected
  + Received
  - q ? "No colleges match your search" : "No active colleges in this scope"
  + import {Button} from "@/components/ui/button";
  + import {inArray,sql} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  + import {collegeMemberships} from "@/db/schema";
  ```
