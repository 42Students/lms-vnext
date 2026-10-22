# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat2-tpo-unowned-confirm-33.test.ts (1 failing)
- TPO Team unowned handover confirmation > TPO-inbox-team-33 shows an explicit confirm modal before assigning unowned work

  ```
  AssertionError: expected '"use client";\n\nimport { useRef, use…' to contain 'onClick={()=>setConfirmOpen(true)}'
  - Expected
  + Received
  - onClick={()=>setConfirmOpen(true)}
  + "use client";
  +
  + import { useRef, useState } from "react";
  + import { useRouter } from "next/navigation";
  ```

## tests/unit/chat3-final-sprint-company-engage.test.ts (1 failing)
- chat-3 final sprint Engage company navigation and communication > TPO-companies-14 verifies scoped legacy company workflows

  ```
  AssertionError: expected '"use client";\nimport { PageBackLink …' to contain 'New recruiter lead for '
  - Expected
  + Received
  - New recruiter lead for
  + "use client";
  + import { PageBackLink } from "@/components/ui/page-back-link";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Badge } from "@/components/ui/badge";
  ```

## tests/unit/chat4-admin-college-session-history-journey.test.ts (1 failing)
- SA-colleges-admins-R01 administrator history tenancy and paging > checks persisted role on administrator session revocation and does not fabricate duplicate audits on retry

  ```
  AssertionError: expected 'export async function revokeCollegeAd…' to contain 'if(rows.rows.length===0)return {revok…'
  - Expected
  + Received
  - if(rows.rows.length===0)return {revoked:0}
  + export async function revokeCollegeAdminSessions(ctx:RequestContext,collegeId:unknown,userId:unknown){
  +  const target=await authorizedTarget(ctx,collegeId,userId);
  +  return getDb().transaction(async tx=>{
  +   await assertPersistedPlatformPermission(tx,ctx,"college.manage",{
  ```

## tests/unit/chat4-college-import-history-authorization.test.ts (1 failing)
- College Admin student import history tenant and expiry controls > COL-people-history-ACTOR-01 reads only 20 per page in a transaction locked to persisted admin rights

  ```
  AssertionError: expected 'import "server-only";\nimport {and,de…' to contain 'z.coerce.number().int().min(1).max(50…'
  - Expected
  + Received
  - z.coerce.number().int().min(1).max(500).parse(raw??1)
  + import "server-only";
  + import {and,desc,eq} from "drizzle-orm";
  + import {z} from "zod";
  + import {getDb} from "@/db/client";
  ```

## tests/unit/chat4-college-verification-misc-gap-closure.test.ts (6 failing)
- chat-4 College Verification and Misc verification > COL-verification-misc-02 retains source-backed legacy behavior

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'Failed to load profile.'
  - Expected
  + Received
  - Failed to load profile.
  + import Link from "next/link";
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { CollegeProfileRetained } from "@/components/college/college-profile-retained";
  ```
- chat-4 College Verification and Misc verification > COL-verification-misc-14 records the approved product decision

  ```
  AssertionError: expected 'import { DateInput } from "@/componen…' to contain 'Export filtered CSV (max 1,000)'
  - Expected
  + Received
  - Export filtered CSV (max 1,000)
  + import { DateInput } from "@/components/ui/date-input";
  + import { Select } from "@/components/ui/select";
  + import { Input } from "@/components/ui/input";
  + import Link from "next/link";
  ```
- chat-4 College Verification and Misc verification > COL-verification-misc-15 retains source-backed legacy behavior

  ```
  AssertionError: expected 'import { DateInput } from "@/componen…' to contain 'Admin not assigned to a college'
  - Expected
  + Received
  - Admin not assigned to a college
  + import { DateInput } from "@/components/ui/date-input";
  + import { Select } from "@/components/ui/select";
  + import { Input } from "@/components/ui/input";
  + import Link from "next/link";
  ```
- chat-4 College Verification and Misc verification > COL-verification-misc-06 offers precise Education and Identity send-back reasons

  ```
  AssertionError: expected '"use client";\nimport {apiFetch,Frien…' to contain 'The student sees your reason and fixe…'
  - Expected
  + Received
  - The student sees your reason and fixes it on their profile.
  + "use client";
  + import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
  + import {useEffect,useState} from "react";
  + import {useGuardedAction} from "@/hooks/use-guarded-action";
  ```
- chat-4 College Verification and Misc verification > COL-verification-misc-10 reviews the first 1000 rather than failing an oversized queue

  ```
  AssertionError: expected 'import "server-only";\nimport {and,as…' to contain '.limit(1001)'
  - Expected
  + Received
  - .limit(1001)
  + import "server-only";
  + import {and,asc,desc,eq,exists,gte,lt,gt,lte,ilike,inArray,or,sql} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  + import {collegeMemberships,membershipRoles,users,learnerProfiles,learnerProgramEnrollments,cohorts,programs,departments} from "@/db/schema";
  ```
- chat-4 College Verification and Misc verification > COL-verification-misc-09 covers current College admin verification and activity behavior

  ```
  AssertionError: expected '"use client";\nimport { Switch } from…' to contain 'Verification setting saved.'
  - Expected
  + Received
  - Verification setting saved.
  + "use client";
  + import { Switch } from "@/components/ui/selection-controls";
  + import { Button } from "@/components/ui/button";
  + import {StatusBadge} from "@/components/ui/status-badge";
  ```

## tests/unit/chat4-superadmin-branding-page-journey.test.tsx (4 failing)
- SA-colleges-branding-page-01 tenant branding permissions and honest editor state > rejects malformed and foreign IDs without reading a different college's files

  ```
  AssertionError: promise resolved "{ …(10) }" instead of rejecting
  - Expected
  + Received
  - Error {
  -   "message": "rejected promise",
  - }
  + <section
  +   className="min-w-0 rounded-[var(--lms-radius-card)] border border-border bg-surface p-4"
  ```
- SA-colleges-branding-page-01 tenant branding permissions and honest editor state > rejects a missing or out-of-scope tenant preview

  ```
  AssertionError: expected "vi.fn()" to not be called at all, but actually been called 1 times
  Received:
  1st vi.fn() call:
  Array [
  Object {
  "adminScope": Object {
  "collegeId": "11111111-1111-4111-8111-111111111111",
  "organizationId": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  ```
- SA-colleges-branding-page-01 tenant branding permissions and honest editor state > renders persisted preview, real optimistic edit version and selected-college uploader

  ```
  AssertionError: expected '<div class="min-w-0 max-w-full space-…' to contain 'Look and feel'
  Expected: "Look and feel"
  Received: "<div class="min-w-0 max-w-full space-y-4" data-testid="superadmin.college.branding"><header data-slot="page-header" class="mb-2 flex w-full min-w-0 flex-col items-stretch gap-2 border-b border-[var(--lms-canvas-border)] pb-4 md:mb-4 md:flex-row md:items-start md:justify-between md:gap-6 [
  ```
- SA-colleges-branding-page-01 tenant branding permissions and honest editor state > does not silently ignore a failed private branding read

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
