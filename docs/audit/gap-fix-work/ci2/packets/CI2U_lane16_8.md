# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat2-tpo-whole-round-apply-service.test.ts (3 failing)
- TPO-drive-workspace-42 whole-round preview/apply authorization and partial persistence > TPO-drive-workspace-42 produces honest next-round destinations, status totals and immutable preview hash

  ```
  TypeError: getDb(...).select(...).from(...).innerJoin(...).innerJoin(...).innerJoin(...).leftJoin is not a function
  ❯ Module.getTpoRoundApplyPreview src/modules/placements/tpo-round-apply-service.ts:36:4
  34|   .innerJoin(collegeMemberships,eq(collegeMemberships.id,placementAppl…
  35|   .innerJoin(users,eq(users.id,collegeMemberships.userId))
  36|   .leftJoin(learnerProfiles,eq(learnerProfiles.membershipId,collegeMem…
  |    ^
  37|   .where(and(eq(placementRoundResults.roundId,roundId),
  38|    eq(placementApplications.jobId,jobId),eq(collegeMemberships.college…
  ```
- TPO-drive-workspace-42 whole-round preview/apply authorization and partial persistence > TPO-drive-workspace-42 never applies a forged confirmation, stale token or a non-completed round

  ```
  AssertionError: expected TypeError: (0 , __vite_ssr_import_2__.get… to match object { code: 'PLACEMENT_JOB_PREVIEW_STALE' }
  - Expected
  + Received
  - {
  -   "code": "PLACEMENT_JOB_PREVIEW_STALE",
  + TypeError {
  +   "message": "(0 , __vite_ssr_import_2__.getDb)(...).select(...).from(...).innerJoin(...).innerJoin(...).innerJoin(...).leftJoin is not a function",
  }
  ```
- TPO-drive-workspace-42 whole-round preview/apply authorization and partial persistence > TPO-drive-workspace-42 applies only staged outcomes and reports each rejected result without leaking private errors

  ```
  TypeError: getDb(...).select(...).from(...).innerJoin(...).innerJoin(...).innerJoin(...).leftJoin is not a function
  ❯ Module.getTpoRoundApplyPreview src/modules/placements/tpo-round-apply-service.ts:36:4
  34|   .innerJoin(collegeMemberships,eq(collegeMemberships.id,placementAppl…
  35|   .innerJoin(users,eq(users.id,collegeMemberships.userId))
  36|   .leftJoin(learnerProfiles,eq(learnerProfiles.membershipId,collegeMem…
  |    ^
  37|   .where(and(eq(placementRoundResults.roundId,roundId),
  38|    eq(placementApplications.jobId,jobId),eq(collegeMemberships.college…
  ```

## tests/unit/chat3-final-sprint-company-team-and-review.test.ts (3 failing)
- Chat-3 final sprint team and review contracts > TPO-companies-05 models follow, @mentions, #references, decisions and asks with author protections

  ```
  AssertionError: expected '"use client";\nimport {Checkbox} from…' to contain 'Open in Team'
  - Expected
  + Received
  - Open in Team
  + "use client";
  + import {Checkbox} from "@/components/ui/checkbox";
  + import {Input} from "@/components/ui/input";
  + import {Select} from "@/components/ui/select";
  ```
- Chat-3 final sprint team and review contracts > TPO-companies-05 uses proposed schema, bounded messages and truthful unavailable migration state

  ```
  Error: ENOENT: no such file or directory, open '/home/runner/work/lms-vnext/lms-vnext/docs/proposed-migrations/chat3-tpo-company-team.sql'
  ❯ read tests/unit/chat3-final-sprint-company-team-and-review.test.ts:4:24
  2| import {readFileSync} from "node:fs";
  3| import {join} from "node:path";
  4| const read=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
  |                        ^
  5| describe("Chat-3 final sprint team and review contracts",()=>{
  6|  it("TPO-companies-05 company messages are bound to a real college rel…
  ```
- Chat-3 final sprint team and review contracts > TPO-companies-05 notifies only active same-college team followers, @team and explicit @members

  ```
  AssertionError: expected 'import "server-only";\nimport {and,as…' to contain 'notifyIds.delete(membership.id)'
  - Expected
  + Received
  - notifyIds.delete(membership.id)
  + import "server-only";
  + import {and,asc,desc,eq,inArray} from "drizzle-orm";
  + import {z} from "zod";
  + import {getDb} from "@/db/client";
  ```

## tests/unit/chat4-college-academic-directory-strict-filter.test.ts (1 failing)
- COL-academics-directory-FILTER-01 strict college semester/batch URL filters > retains exact legacy search and page-size choices with normalized decimal inputs

  ```
  AssertionError: expected { q: '', page: 1, pageSize: 25, …(1) } to match object { Object (page, pageSize, ...) }
  (1 matching property omitted from actual)
  - Expected
  + Received
  {
  "page": 1,
  -   "pageSize": 10,
  +   "pageSize": 25,
  ```

## tests/unit/chat4-college-local-identity-directory.test.ts (1 failing)
- COL-people-local-identity-01 safe directory read and create contracts > email lookup is case-insensitive and never invents an identity for an absent row

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```

## tests/unit/chat4-final-fac-courses-28.test.ts (1 failing)
- FAC-courses-28 roster parity with secure image fallback > FAC-courses-28 makes a keyboard-operable, namespaced avatar preview and always-visible result count

  ```
  AssertionError: expected '"use client";\n\nimport { useMemo, us…' to contain 'aria-label={"Preview avatar for "+nam…'
  - Expected
  + Received
  - aria-label={"Preview avatar for "+nameOf(learner)}
  + "use client";
  +
  + import { useMemo, useState } from "react";
  + import Link from "next/link";
  ```

## tests/unit/chat4-superadmin-college-detail-page-states.test.tsx (3 failing)
- SA-colleges-detail-01 tenant detail status and privacy > renders the selected active tenant with concrete setup links but no restore action

  ```
  AssertionError: expected '<div role="region" aria-label="Manage…' to contain 'Tenant directory'
  Expected: "Tenant directory"
  Received: "<div role="region" aria-label="Manage College · IIT Dharwad" class="min-w-0 w-full space-y-4 bg-surface p-4 md:ml-auto md:max-w-[980px] md:border md:border-border md:p-4"><div class="flex min-w-0 flex-wrap items-center gap-2"><span data-slot="badge" data-tone="info" data-variant="legacy-p
  ```
- SA-colleges-detail-01 tenant detail status and privacy > does not render foreign, missing or invalid selected college data

  ```
  AssertionError: promise resolved "{ …(10) }" instead of rejecting
  - Expected
  + Received
  - Error {
  -   "message": "rejected promise",
  + <div
  +   className="min-w-0 space-y-4 md:ml-auto md:max-w-[980px]"
  + >
  ```
- SA-colleges-detail-01 tenant detail status and privacy > propagates revoked Super Admin errors without emitting a partial tenant detail

  ```
  AssertionError: promise resolved "{ …(10) }" instead of rejecting
  - Expected
  + Received
  - Error {
  -   "message": "rejected promise",
  + <div
  +   className="min-w-0 space-y-4"
  + >
  ```
