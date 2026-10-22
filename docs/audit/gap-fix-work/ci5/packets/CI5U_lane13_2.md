# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat15-company-shared-preview.test.ts (1 failing)
- chat-15 learner company disclosures > LEARNER-placements-28 matches active selected-applicant employer shares, not the company directory

  ```
  AssertionError: expected 'import "server-only";\n\nimport { and…' to contain 'limited.length===0||limited.includes(…'
  - Expected
  + Received
  - limited.length===0||limited.includes(application.applicationId)
  + import "server-only";
  +
  + import { and, asc, eq, gt, inArray, isNull } from "drizzle-orm";
  + import { getDb } from "@/db/client";
  ```

## tests/unit/chat16-mentor-calendar-status-r5.test.ts (2 failing)
- chat-16 mentor calendar persisted statuses > MEN-projects-meetings-69 shows DRAFT and RESCHEDULED without guessing missing states

  ```
  AssertionError: expected null to be 'https://meet.example.org/room' // Object.is equality
  - Expected:
  "https://meet.example.org/room"
  + Received:
  null
  ```
- chat-16 mentor calendar persisted statuses > MEN-projects-meetings-69 does not allow a past rescheduled or cancelled meeting join

  ```
  AssertionError: expected null to be 'https://meet.example.org/room' // Object.is equality
  - Expected:
  "https://meet.example.org/room"
  + Received:
  null
  ```

## tests/unit/chat16-recruiter-messaging-double-actions-16.test.ts (1 failing)
- chat-16 recruiter messaging double-action and draft recovery > UX-chat16-recruiter-message-read-03 serializes the initial acknowledgement with manual retries

  ```
  AssertionError: expected 'import type { HTMLAttributes, ReactNo…' to contain 'role={tone === "error" ? "alert"'
  - Expected
  + Received
  - role={tone === "error" ? "alert"
  + import type { HTMLAttributes, ReactNode } from "react";
  + import { cx } from "@/lib/class-names";
  +
  + export type AlertTone = "info" | "success" | "warning" | "error";
  ```

## tests/unit/chat2-college-recruiter-interview-service-denials.test.ts (1 failing)
- chat-2 college and recruiter interview service zero-read denials > COL-interviews-security-02 directory schema rejects tenant override, bad paging, unknown modes ahead of auth and DB

  ```
  AssertionError: expected { q: '', status: 'ALL', …(5) } to match object { status: 'ALL', mode: 'ALL', …(3) }
  (2 matching properties omitted from actual)
  - Expected
  + Received
  {
  "mode": "ALL",
  "page": 1,
  -   "sort": "UPCOMING",
  ```

## tests/unit/chat2-tpo-inbox-audience-44.test.ts (1 failing)
- TPO notice audience choice parity > TPO-inbox-team-44 supports multiple batch and branch choices without accepting arbitrary IDs as choices

  ```
  AssertionError: expected 'import "server-only";\nimport {and,as…' to contain 'eq(placementJobs.status,"PUBLISHED")'
  - Expected
  + Received
  - eq(placementJobs.status,"PUBLISHED")
  + import "server-only";
  + import {and,asc,eq,inArray,isNull} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  + import {cohorts,departments,placementJobs,programs} from "@/db/schema";
  ```

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

## tests/unit/chat3-tpo-supplemental-round14.test.ts (5 failing)
- TPO supplemental job metadata > TPO-drives-29/30/38 read and write supplemental details in the scoped job JSONB

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
- TPO supplemental job metadata > TPO-drives-41 blocks both native unload and in-app navigation while unsaved

  ```
  AssertionError: expected '"use client";\nimport {createElement,…' to contain 'window.confirm'
  - Expected
  + Received
  - window.confirm
  + "use client";
  + import {createElement,useCallback,useEffect,useRef,useState} from "react";
  + import {useRouter} from "next/navigation";
  + import {ConfirmDialog} from "@/components/ui/confirm-dialog";
  ```
- TPO supplemental job metadata > TPO-drives-41 exposes an honest IST local-save timestamp distinct from server persistence

  ```
  AssertionError: expected '"use client";\n\nimport {\n  useState…' to contain 'Local draft saved at '
  - Expected
  + Received
  - Local draft saved at
  + "use client";
  +
  + import {
  +   useState,
  ```
- TPO supplemental job metadata > TPO-drives-43 stores an uncertain create outcome after timeout instead of retrying blindly

  ```
  AssertionError: expected '"use client";\n\nimport {\n  useState…' to contain 'disabled={pending || !activeSeason ||…'
  - Expected
  + Received
  - disabled={pending || !activeSeason || uncertainCreate}
  + "use client";
  +
  + import {
  +   useState,
  ```
- TPO supplemental job metadata > TPO-drives-43/52 quick create requires a duplicate check after unknown POST outcome

  ```
  AssertionError: expected '"use client";\n\nimport { useEffect, …' to contain 'disabled={pending || unknownCreate ||…'
  - Expected
  + Received
  - disabled={pending || unknownCreate || !companyRelationshipId}
  + "use client";
  +
  + import { useEffect, useState, type FormEvent } from "react";
  + import { useRouter } from "next/navigation";
  ```

## tests/unit/chat4-college-structure-responsive-data-table.test.tsx (2 failing)
- COL-UX-STRUCTURE-TABLE-02 responsive Classes and Electives directories > keeps class academic period, capacity, current roster and accessible schedule/lifecycle actions

  ```
  
  ```
- COL-UX-STRUCTURE-TABLE-02 responsive Classes and Electives directories > retains academic choices, confirmed learners and elective actions on a phone-readable table

  ```
  Error: invariant expected app router to be mounted
  ❯ useRouter node_modules/next/src/client/components/navigation.ts:169:11
  ❯ CollegeDirectoryRefresh src/components/academics/college-directory-page-size.tsx:49:18
  47|
  48| export function CollegeDirectoryRefresh() {
  49|   const router = useRouter();
  |                  ^
  50|   const [pending, startTransition] = useTransition();
  ```
