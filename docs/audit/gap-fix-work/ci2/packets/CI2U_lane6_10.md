# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat7-learner-assessment-route-boundaries.test.ts (1 failing)
- COURSES7-07 / COURSES7-08 authenticated learner assessment HTTP boundaries > COURSES7-07 passes the authenticated context, path quiz, and unmodified body into the authorized service

  ```
  AssertionError: expected 200 to be 201 // Object.is equality
  - Expected
  + Received
  - 201
  + 200
  ```

## tests/unit/chat7-legacy-learner-assignment-detail-copy.test.ts (1 failing)
- legacy learner assignment detail — ViewAssignmentModal.jsx dev > preserves exact Your submission and Due with safe submission state

  ```
  AssertionError: expected 'import { Button } from "@/components/…' to contain 'Submitted {formatDate(item.submittedA…'
  - Expected
  + Received
  - Submitted {formatDate(item.submittedAt)}
  + import { Button } from "@/components/ui/button";
  + import { assignmentFilesRuntimeEnabled } from "@/modules/courses/assignment-file-readiness";
  + import Link from "next/link";
  + import { learnerAssignmentPublishedGradeLabel } from "@/modules/courses/learner-assignment-grade-label-model";
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

## tests/unit/chat9-calendar-contracts-round8.test.ts (2 failing)
- chat-9 TPO calendar source-verified contracts > TPO-calendar-reports-11 distinguishes talks from rounds and supports additive multi-kind selection

  ```
  AssertionError: expected [ 'Round', 'Talk', 'Deadline', …(2) ] to include 'Talks'
  ❯ tests/unit/chat9-calendar-contracts-round8.test.ts:8:53
  6| describe("chat-9 TPO calendar source-verified contracts",()=>{
  7|  it("TPO-calendar-reports-11 distinguishes talks from rounds and suppo…
  8|   expect(TPO_CALENDAR_CHIP_CHOICES.map(x=>x.label)).toContain("Talks");
  |                                                     ^
  9|   expect(parseTpoCalendarChips("ROUND,TALK,ROUND,BOGUS")).toEqual(["RO…
  10|   expect(toggleTpoCalendarChip(["ROUND"],"TALK")).toEqual(["ROUND","TA…
  ```
- chat-9 TPO calendar source-verified contracts > TPO-calendar-reports-25 lets native keyboard button open Move and preserves Escape cancellation

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'aria-label="Move recruiter follow-up"'
  - Expected
  + Received
  - aria-label="Move recruiter follow-up"
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { Alert } from "@/components/ui/alert";
  + import { InlineNotice } from "@/components/ui/inline-notice";
  ```

## tests/unit/chat9-final-named-gap-verification.test.ts (1 failing)
- chat-9 final named gap source acceptance > COL-academic-setup-21 is NOT-A-GAP: departments are sorted, searchable and pageable with a result count

  ```
  AssertionError: expected [ 'Zoology', 'Biology', 'Physics' ] to deeply equal [ 'Biology', 'Physics', 'Zoology' ]
  - Expected
  + Received
  [
  +   "Zoology",
  "Biology",
  "Physics",
  -   "Zoology",
  ```

## tests/unit/chat9-shell-tpo-graceful-topbar.test.ts (2 failing)
- TPO shell navigation dependencies > TPO-home-44 shows Messages in the global TPO topbar instead of requiring a Home-only widget

  ```
  AssertionError: expected 'import { Suspense, type ReactNode } f…' to contain '<TpoTopbarMessages'
  - Expected
  + Received
  - <TpoTopbarMessages
  + import { Suspense, type ReactNode } from "react";
  + import {
  +   hasMembershipRole,
  +   isSuperAdmin,
  ```
- TPO shell navigation dependencies > TPO-home-40 avoids duplicate Notifications links in TPO accounts

  ```
  AssertionError: expected 'import { Suspense, type ReactNode } f…' to contain 'showNotifications={!learner&&!hasActi…'
  - Expected
  + Received
  - showNotifications={!learner&&!hasActiveRecruiter(context)&&!hasTpoTooling(context)}
  + import { Suspense, type ReactNode } from "react";
  + import {
  +   hasMembershipRole,
  +   isSuperAdmin,
  ```
