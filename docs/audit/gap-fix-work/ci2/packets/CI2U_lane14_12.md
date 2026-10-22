# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/learner-placements-chat7-round5-contracts.test.ts (3 failing)
- Learner Placements chat-7 round-5 grouped source contracts > LEARNER-placements-13 retains the reviewed learner journey behavior

  ```
  AssertionError: expected '"use client";\nimport {useRef,useStat…' to contain 'learnerSavedDriveCopy(false).toast'
  - Expected
  + Received
  - learnerSavedDriveCopy(false).toast
  + "use client";
  + import {useRef,useState} from "react";
  + import {usePathname,useRouter} from "next/navigation";
  + import {apiFetch} from "@/lib/api-fetch";
  ```
- Learner Placements chat-7 round-5 grouped source contracts > LEARNER-placements-37 retains the reviewed learner journey behavior

  ```
  AssertionError: expected 'import { Tabs } from "@/components/ui…' to contain 'Join online round'
  - Expected
  + Received
  - Join online round
  + import { Tabs } from "@/components/ui/tabs";
  + import { StatusBadge } from "@/components/ui/status-badge";
  + import { ErrorState } from "@/components/ui/error-state";
  + import { AuthorizationError } from "@/modules/permissions/policy";
  ```
- Learner Placements chat-7 round-5 grouped source contracts > LEARNER-placements-55 retains the reviewed learner journey behavior

  ```
  AssertionError: expected 'import { PageHeader } from "@/compone…' to contain 'id="registration"'
  - Expected
  + Received
  - id="registration"
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Alert } from "@/components/ui/alert";
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```

## tests/unit/mentor-projects-chat7-round6-workflows.test.ts (1 failing)
- chat-7 mentor workflows round 6 > MEN-projects-meetings-R06 shows an honest zero-release state pending sprint creation improvements

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain 'No sprints yet. Add the sprints'
  - Expected
  + Received
  - No sprints yet. Add the sprints
  + import { EmptyState } from "@/components/ui/empty-state";
  + import Link from "next/link";
  + import { Tabs } from "@/components/ui/tabs";
  + import { Disclosure } from "@/components/ui/disclosure";
  ```

## tests/unit/project-admin-aggregate-derivation.test.ts (1 failing)
- College Admin latest-submission risk > excludes terminal projects from risk signals

  ```
  AssertionError: expected [ 'Pending review' ] to deeply equal []
  - Expected
  + Received
  - []
  + [
  +   "Pending review",
  + ]
  ```

## tests/unit/public-placement-disclosure.test.ts (1 failing)
- public placement statistics privacy threshold > does not mutate the source metrics

  ```
  AssertionError: expected '10' to be '8' // Object.is equality
  Expected: "8"
  Received: "10"
  ```

## tests/unit/route-dynamic-slug-names.test.ts (1 failing)
- app router dynamic segments > never uses two different slug names at the same path level (Next fails at runtime)

  ```
  AssertionError: expected [ …(3) ] to deeply equal []
  - Expected
  + Received
  - []
  + [
  +   "(authenticated)/admin/batches: [batchId] vs [cohortId]",
  +   "api/placements/recruiter/pending-invites: [collegeId] vs [grantId]",
  +   "api/v2/colleges: [...legacyMode] vs [[...path]]",
  ```

## tests/unit/super-admin-settings-invalid-early-return.test.ts (1 failing)
- Super Admin Settings filter read fence > authorizes before errors, validates before database reads

  ```
  AssertionError: expected -1 to be greater than 0
  ❯ tests/unit/super-admin-settings-invalid-early-return.test.ts:10:16
  8|   const parse=page.indexOf("parseAdminInventoryQuery(raw)");
  9|   const load=page.indexOf("getSuperAdminPlatformSettings(context)");
  10|   expect(auth).toBeGreaterThan(0);
  |                ^
  11|   expect(auth).toBeLessThan(parse);
  12|   expect(parse).toBeLessThan(load);
  ```
