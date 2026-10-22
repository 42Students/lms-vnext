# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

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

## tests/unit/chat4-tpo-home-gap-closure.test.ts (7 failing)
- chat-4 verified TPO Home gap coverage > TPO-home-R06 avoids invented fallback copy or fabricated null counts

  ```
  AssertionError: expected 'Registration data unavailable' to be '' // Object.is equality
  - Expected
  + Received
  + Registration data unavailable
  ```
- chat-4 verified TPO Home gap coverage > TPO-home-36 renders dated notifications and screen-reader unread text

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'slice(0,20)'
  - Expected
  + Received
  - slice(0,20)
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { canOpenTpoWorkspace, hasTpoTooling } from "@/modules/placements/tpo-workspace-access-model";
  + import { TpoKeyboardShortcuts } from "@/components/tpo/tpo-keyboard-shortcuts";
  ```
- chat-4 verified TPO Home gap coverage > TPO-home-39 uses the accessible notification Drawer instead of an absolute region

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain '<Drawer open={open} onOpenChange={cha…'
  - Expected
  + Received
  - <Drawer open={open} onOpenChange={changeOpen} title="Notifications"
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import Link from "next/link";
  + import {Drawer} from "@/components/ui/drawer";
  ```
- chat-4 verified TPO Home gap coverage > TPO-home-18 verified legacy and graceful behavior

  ```
  AssertionError: expected 'import { Badge } from "@/components/u…' to contain 'lg:grid-cols-[minmax(0,5fr)_minmax(0,…'
  - Expected
  + Received
  - lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]
  + import { Badge } from "@/components/ui/badge";
  + import Link from "next/link";
  + import {TpoHomeReturnRefresh} from "@/components/tpo/tpo-home-return-refresh";
  + import {eq} from "drizzle-orm";
  ```
- chat-4 verified TPO Home gap coverage > TPO-home-20 verified legacy and graceful behavior

  ```
  AssertionError: expected 'import { PageHeader } from "@/compone…' to contain '<PageLoading label="Loading placement…'
  - Expected
  + Received
  - <PageLoading label="Loading placement home…" variant="kpi" count={4} />
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Skeleton } from "@/components/ui/skeleton";
  + export default function LoadingTpoHome() {
  +  return <div className="min-w-0 space-y-4" aria-label="Loading placement home">
  ```
- chat-4 verified TPO Home gap coverage > TPO-home-38 verified legacy and graceful behavior

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'unread>0?<button'
  - Expected
  + Received
  - unread>0?<button
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import Link from "next/link";
  + import {Drawer} from "@/components/ui/drawer";
  ```
- chat-4 verified TPO Home gap coverage > TPO-home-28 opens an accessible Ctrl K palette with bounded live search

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'role="listbox"'
  - Expected
  + Received
  - role="listbox"
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { Alert } from "@/components/ui/alert";
  + import Link from "next/link";
  ```

## tests/unit/chat6-admin-second-third-placements.test.ts (1 failing)
- /admin placements second-third: scoping, filtering, counts, links > CHAT6-ADMIN-DRIVES-01 maps only published drives to active and caps paginated results

  ```
  AssertionError: expected 'Expired' to be 'Open · Expired' // Object.is equality
  Expected: "Open · Expired"
  Received: "Expired"
  ```

## tests/unit/chat6-final-sprint-rec-home-drives-06.test.ts (1 failing)
- Final sprint recruiter this-week combined feed > REC-home-drives-06 week feed includes scoped round slot deadline and result events

  ```
  AssertionError: expected 'import {NeedsDoingChips} from "@/comp…' to contain 'recruiterTodayEightDayWindow(now)'
  - Expected
  + Received
  - recruiterTodayEightDayWindow(now)
  + import {NeedsDoingChips} from "@/components/ui/needs-doing-chips";
  + import { Badge } from "@/components/ui/badge";
  + import { Alert } from "@/components/ui/alert";
  + import Link from "next/link";
  ```

## tests/unit/chat6-superadmin-middle-drive-ist-date.test.ts (1 failing)
- Super Admin placement drive directory date safety > SA-admin-middle-drives-IST-01 never renders a UTC ISO date fragment for either timestamp

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'adminDriveIstDate(row.job.publishedAt)'
  - Expected
  + Received
  - adminDriveIstDate(row.job.publishedAt)
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {requireSuperAdminSelectedCollege} from "@/modules/admin-ui/super-admin-selected-college";
  + import { AuthorizationError } from "@/modules/permissions/policy";
  ```

## tests/unit/chat7-college-content-authoring-weak.test.ts (3 failing)
- COURSES-WEAK-CONTENT-AUTHORING-01 tenant, stage and private link boundaries > Super Admin resolves acting college scope instead of trusting membership's stale college

  ```
  TypeError: db.select(...).from(...).innerJoin(...).innerJoin(...).innerJoin(...).innerJoin(...).innerJoin(...).where(...).orderBy(...).limit(...).offset is not a function
  ❯ Module.getCollegeContentAuthoringOptions src/modules/courses/college-content-authoring-service.ts:128:21
  126|  .where(and(...where))
  127|  .orderBy(asc(courseLessons.name),asc(lessonContents.sequence),asc(les…
  128|  .limit(pageSize+1).offset((page-1)*pageSize);
  |                     ^
  129|  const positions=lessons.length?await db.select({lessonId:lessonConten…
  130|   .from(lessonContents).where(inArray(lessonContents.lessonId,lessons.…
  ```
- COURSES-WEAK-CONTENT-AUTHORING-01 tenant, stage and private link boundaries > never exposes published external playback URL in metadata editor while retaining editable drafts

  ```
  TypeError: db.select(...).from(...).innerJoin(...).innerJoin(...).innerJoin(...).innerJoin(...).innerJoin(...).where(...).orderBy(...).limit(...).offset is not a function
  ❯ Module.getCollegeContentAuthoringOptions src/modules/courses/college-content-authoring-service.ts:128:21
  126|  .where(and(...where))
  127|  .orderBy(asc(courseLessons.name),asc(lessonContents.sequence),asc(les…
  128|  .limit(pageSize+1).offset((page-1)*pageSize);
  |                     ^
  129|  const positions=lessons.length?await db.select({lessonId:lessonConten…
  130|   .from(lessonContents).where(inArray(lessonContents.lessonId,lessons.…
  ```
- COURSES-WEAK-CONTENT-AUTHORING-01 tenant, stage and private link boundaries > honestly flags truncated content list at 250 and never includes >250 records

  ```
  TypeError: db.select(...).from(...).innerJoin(...).innerJoin(...).innerJoin(...).innerJoin(...).innerJoin(...).where(...).orderBy(...).limit(...).offset is not a function
  ❯ Module.getCollegeContentAuthoringOptions src/modules/courses/college-content-authoring-service.ts:128:21
  126|  .where(and(...where))
  127|  .orderBy(asc(courseLessons.name),asc(lessonContents.sequence),asc(les…
  128|  .limit(pageSize+1).offset((page-1)*pageSize);
  |                     ^
  129|  const positions=lessons.length?await db.select({lessonId:lessonConten…
  130|   .from(lessonContents).where(inArray(lessonContents.lessonId,lessons.…
  ```

## tests/unit/chat7-legacy-faculty-assignment-report-copy.test.ts (2 failing)
- AssignmentReportContent.jsx dev report headings and empty copy > keeps authoritative assignment title and legacy report sections

  ```
  AssertionError: expected 'import { MetricBar } from "@/componen…' to contain '<PageHeader title={assignment.title} …'
  - Expected
  + Received
  - <PageHeader title={assignment.title} />
  + import { MetricBar } from "@/components/ui/metric-bar";
  + import styles from "@/components/courses/faculty-report-legacy-charts.module.css";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { assignmentFilesRuntimeEnabled } from "@/modules/courses/assignment-file-readiness";
  ```
- AssignmentReportContent.jsx dev report headings and empty copy > uses legacy no-submissions empty only for assignment reports

  ```
  AssertionError: expected '"use client";\nimport {EmptyState} fr…' to contain 'emptyMessage = "No learners have subm…'
  - Expected
  + Received
  - emptyMessage = "No learners have submitted yet."
  + "use client";
  + import {EmptyState} from "@/components/ui/empty-state";
  + import {useMemo,useState} from "react";
  + import {Input} from "@/components/ui/input";
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
