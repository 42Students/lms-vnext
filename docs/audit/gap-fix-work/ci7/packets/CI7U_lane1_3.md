# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat6-admin-write-safety-guards.test.ts (1 failing)
- GR-31 + GR-09 Super Admin write safety > SA-tenants-branding-01 prevents rapid duplicate writes and retains unsaved branding after network failure

  ```
  AssertionError: expected '"use client";\n\nimport { useEffect, …' to contain 'Could not save branding. Check your c…'
  - Expected
  + Received
  - Could not save branding. Check your connection and try again.
  + "use client";
  +
  + import { useEffect, useRef, useState, useTransition } from "react";
  + import { Button } from "@/components/ui/button";
  ```

## tests/unit/chat6-superadmin-middle-third-adversarial.test.ts (2 failing)
- Chat-6 /admin middle-third read and application correctness > SA-admin-middle-applications-filters-02 rejects wrong-shape and cross-tenant filter IDs before querying

  ```
  AssertionError: expected { q: '', status: 'ALL', …(8) } to be null
  - Expected:
  null
  + Received:
  {
  "attention": "ALL",
  "page": 1,
  "q": "",
  ```
- Chat-6 /admin middle-third read and application correctness > SA-admin-middle-read-04 rejects missing college selection before rendering candidate-level data

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain '<AdminScopedReadPage'
  - Expected
  + Received
  - <AdminScopedReadPage
  + import { redirect } from "next/navigation";
  + /** Legacy Hiring Dashboard address. The scoped report with KPI, funnel and
  +  * company sections is the Analytics page; do not treat job-count list as the
  +  * original dashboard or synthesize three incompatible legacy API responses. */
  ```

## tests/unit/chat7-superadmin-bulk-published-only.test.ts (4 failing)
- SA-academics-people-53 bulk course/lesson visibility never alters future content > changes only published items whose visibility differs and retains drafts/archived content

  ```
  AssertionError: expected "vi.fn()" to be called 1 times, but got 0 times
  ❯ tests/unit/chat7-superadmin-bulk-published-only.test.ts:36:23
  34|   const result=await bulkSuperAdminLessonVisibility(context,{lessonIds…
  35|    visibleToStudents:true,confirmed:true});
  36|   expect(state.write).toHaveBeenCalledTimes(1);
  |                       ^
  37|   expect(state.write).toHaveBeenCalledWith(context,{
  38|    lessonContentId:"published-hidden",visibleToStudents:true,
  ```
- SA-academics-people-53 bulk course/lesson visibility never alters future content > returns accurate partial failures without trying to mutate unpublished records

  ```
  AssertionError: expected '11111111-1111-4111-8111-111111111111' to be 'published-hidden' // Object.is equality
  Expected: "published-hidden"
  Received: "11111111-1111-4111-8111-111111111111"
  ```
- SA-academics-people-53 bulk course/lesson visibility never alters future content > limits bulk visibility SQL to published content under active parents and a published path

  ```
  AssertionError: expected 'import "server-only";\nimport {and,eq…' to contain 'eq(lessonContents.status,"PUBLISHED")'
  - Expected
  + Received
  - eq(lessonContents.status,"PUBLISHED")
  + import "server-only";
  + import {and,eq,sql} from "drizzle-orm";
  + import {z} from "zod";
  + import {getDb} from "@/db/client";
  ```
- SA-academics-people-53 bulk course/lesson visibility never alters future content > never opens database queries when the input is unconfirmed or exceeds the allowed lesson batch

  ```
  AssertionError: promise resolved "{ requested: 2, updatedCount: +0, …(6) }" instead of rejecting
  - Expected
  + Received
  - Error {
  -   "message": "rejected promise",
  + {
  +   "changed": 0,
  +   "failed": [
  ```

## tests/unit/chat9-project-team-mentor-modal.test.ts (1 failing)
- College Admin workspace Team actions > COL-projects-15 offers a scoped mentor search and confirmed reassignment modal without changing member roles directly

  ```
  AssertionError: expected '"use client";\n\nimport {useRef,useSt…' to contain 'Confirm reassignment'
  - Expected
  + Received
  - Confirm reassignment
  + "use client";
  +
  + import {useRef,useState} from "react";
  + import {useRouter} from "next/navigation";
  ```
