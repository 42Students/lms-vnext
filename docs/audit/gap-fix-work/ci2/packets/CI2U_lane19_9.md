# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat5-placements-scroll-motion-surfaces.test.ts (9 failing)
- chat-5 placements scroll and motion surface contracts > UX-placements-scroll-motion-02 cues every newly audited scroll container in tpo-bulk-round-result-recorder.tsx

  ```
  
  ```
- chat-5 placements scroll and motion surface contracts > UX-placements-scroll-motion-07 cues every newly audited scroll container in tpo-week-hour-calendar.tsx

  ```
  AssertionError: expected 0 to be greater than or equal to 1
  ❯ tests/unit/chat5-placements-scroll-motion-surfaces.test.ts:39:48
  37|     return;
  38|   }
  39|   expect(source.split("mask-image:").length-1).toBeGreaterThanOrEqual(…
  |                                                ^
  40|   expect(source.split("tabIndex={0}").length-1).toBeGreaterThanOrEqual…
  41|   const overscroll=(source.match(/overscroll-(?:x-)?contain/g)??[]).le…
  ```
- chat-5 placements scroll and motion surface contracts > UX-placements-scroll-motion-05 cues every newly audited scroll container in tpo-request-bulk-decision.tsx

  ```
  
  ```
- chat-5 placements scroll and motion surface contracts > UX-placements-scroll-motion-09 cues every newly audited scroll container in tpo-selection-import.tsx

  ```
  AssertionError: expected 0 to be greater than or equal to 2
  ❯ tests/unit/chat5-placements-scroll-motion-surfaces.test.ts:39:48
  37|     return;
  38|   }
  39|   expect(source.split("mask-image:").length-1).toBeGreaterThanOrEqual(…
  |                                                ^
  40|   expect(source.split("tabIndex={0}").length-1).toBeGreaterThanOrEqual…
  41|   const overscroll=(source.match(/overscroll-(?:x-)?contain/g)??[]).le…
  ```
- chat-5 placements scroll and motion surface contracts > UX-placements-scroll-motion-06 cues every newly audited scroll container in tpo-round-drive-day-read-only.tsx

  ```
  
  ```
- chat-5 placements scroll and motion surface contracts > UX-placements-scroll-motion-11 cues every newly audited scroll container in placement-drive-day-overview.tsx

  ```
  AssertionError: expected 'import type { ReactNode } from "react…' to contain 'sm:first:sticky'
  - Expected
  + Received
  - sm:first:sticky
  + import type { ReactNode } from "react";
  + import Link from "next/link";
  + import { ScrollCue } from "@/components/ui/scroll-cue";
  + import { TableSelectAll } from "@/components/ui/table-select-all";
  ```
- chat-5 placements scroll and motion surface contracts > UX-placements-scroll-motion-08 cues every newly audited scroll container in tpo-round-results-import.tsx

  ```
  AssertionError: expected 0 to be greater than or equal to 3
  ❯ tests/unit/chat5-placements-scroll-motion-surfaces.test.ts:39:48
  37|     return;
  38|   }
  39|   expect(source.split("mask-image:").length-1).toBeGreaterThanOrEqual(…
  |                                                ^
  40|   expect(source.split("tabIndex={0}").length-1).toBeGreaterThanOrEqual…
  41|   const overscroll=(source.match(/overscroll-(?:x-)?contain/g)??[]).le…
  ```
- chat-5 placements scroll and motion surface contracts > UX-placements-scroll-motion-11 retains candidate as a sticky, labeled row identifier

  ```
  AssertionError: expected 'import type { ReactNode } from "react…' to contain 'sm:first:sticky'
  - Expected
  + Received
  - sm:first:sticky
  + import type { ReactNode } from "react";
  + import Link from "next/link";
  + import { ScrollCue } from "@/components/ui/scroll-cue";
  + import { TableSelectAll } from "@/components/ui/table-select-all";
  ```
- chat-5 placements scroll and motion surface contracts > UX-placements-scroll-motion-09 keeps import preview separate from release confirmation

  ```
  AssertionError: expected '"use client";\nimport { Disclosure } …' to contain 'Selection import preview, scroll for …'
  - Expected
  + Received
  - Selection import preview, scroll for more
  + "use client";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { Button } from "@/components/ui/button";
  + import { FileUpload } from "@/components/ui/file-upload";
  ```

## tests/unit/chat6-auth-http-guard.test.ts (1 failing)
- authentication guard: hostile requests and audit integrity > AUTH-HTTP-07 maps known login and configuration failures without exposing internal errors

  ```
  AssertionError: expected { error: 'TOO_MANY_REQUESTS', …(2) } to deeply equal { error: 'TOO_MANY_REQUESTS', …(1) }
  - Expected
  + Received
  {
  "error": "TOO_MANY_REQUESTS",
  +   "message": "Too many OTP requests. Please try again later.",
  "retryAfterSeconds": 37,
  }
  ```

## tests/unit/chat6-faculty-quiz-report-header-r06.test.ts (1 failing)
- Faculty quiz report legacy header > FAC-assessments-R06 shows the legacy Back link and Submitted, Average score, Questions and Due date metrics

  ```
  AssertionError: expected 'import { MetricBar } from "@/componen…' to contain '        Back'
  - Expected
  + Received
  -         Back
  + import { MetricBar } from "@/components/ui/metric-bar";
  + import styles from "@/components/courses/faculty-report-legacy-charts.module.css";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import {FacultyReportBackButton} from "@/components/courses/faculty-report-back-button";
  ```

## tests/unit/chat6-super-admin-middle-third-entrypoints.test.ts (3 failing)
- SA-admin-middle-inventory-01 37 actual Super Admin page entrypoints > SA-admin-middle-inventory-01 /admin/placements/hiring authenticates before any scoped view

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'getCurrentRequestContext'
  - Expected
  + Received
  - getCurrentRequestContext
  + import { redirect } from "next/navigation";
  + /** Legacy Hiring Dashboard address. The scoped report with KPI, funnel and
  +  * company sections is the Analytics page; do not treat job-count list as the
  +  * original dashboard or synthesize three incompatible legacy API responses. */
  ```
- SA-admin-middle-inventory-01 37 actual Super Admin page entrypoints > SA-admin-middle-inventory-03 /admin/placements/hiring delegates filtered reads to protected scaffold

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
- SA-admin-middle-inventory-01 37 actual Super Admin page entrypoints > SA-admin-middle-inventory-03 /admin/placements/interviews delegates filtered reads to protected scaffold

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain '<AdminScopedReadPage'
  - Expected
  + Received
  - <AdminScopedReadPage
  + import Link from "next/link";
  + import {and,eq,inArray,sql} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  + import {
  ```

## tests/unit/chat6-superadmin-people-round3.test.ts (3 failing)
- Chat-6 Super Admin people round 3 source verification > SA-academics-people-83 exposes college-scoped suspend and reactivate actions with reason

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'Other college access is unaffected'
  - Expected
  + Received
  - Other college access is unaffected
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { Textarea } from "@/components/ui/textarea";
  + import { ConfirmDialog } from "@/components/ui/confirm-dialog";
  ```
- Chat-6 Super Admin people round 3 source verification > SA-academics-people-96 supports student suspend and reactivate via membership lifecycle

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'College membership suspended.'
  - Expected
  + Received
  - College membership suspended.
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { Textarea } from "@/components/ui/textarea";
  + import { ConfirmDialog } from "@/components/ui/confirm-dialog";
  ```
- Chat-6 Super Admin people round 3 source verification > SA-academics-people-97 supports safe bulk student module overrides with selection cap

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'Select first'
  - Expected
  + Received
  - Select first
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { Select } from "@/components/ui/select";
  + import { Checkbox } from "@/components/ui/checkbox";
  ```

## tests/unit/chat7-final-sprint-superadmin-course-visibility.test.ts (4 failing)
- Final sprint Super Admin course student visibility > SA-academics-people-52 bulk Show/Hide confirms, reports partial failures and offers Retry failed

  ```
  AssertionError: expected '"use client";\nimport {useEffect,useR…' to contain 'window.confirm('
  - Expected
  + Received
  - window.confirm(
  + "use client";
  + import {useEffect,useRef,useState} from "react";
  + import {useRouter,useSearchParams} from "next/navigation";
  + import {Alert} from "@/components/ui/alert";
  ```
- Final sprint Super Admin course student visibility > SA-academics-people-53 guards college scope and preserves published lesson state when toggling student visibility

  ```
  AssertionError: expected 'import "server-only";\nimport {and,eq…' to contain 'updateCollegeContentStudentVisibility…'
  - Expected
  + Received
  - updateCollegeContentStudentVisibility(context
  + import "server-only";
  + import {and,eq,sql} from "drizzle-orm";
  + import {z} from "zod";
  + import {getDb} from "@/db/client";
  ```
- SA-academics-people-52/53 selected-course retry integrity > SA-academics-people-52 sends only failed courses on retry instead of reapplying successful changes

  ```
  AssertionError: expected '"use client";\nimport {useEffect,useR…' to contain 'void apply(lastAction,report.failedCo…'
  - Expected
  + Received
  - void apply(lastAction,report.failedCourseIds)
  + "use client";
  + import {useEffect,useRef,useState} from "react";
  + import {useRouter,useSearchParams} from "next/navigation";
  + import {Alert} from "@/components/ui/alert";
  ```
- SA-academics-people-52/53 selected-course retry integrity > SA-academics-people-52 accepts the 100-course page but refuses unbounded bulk actions

  ```
  AssertionError: expected 'import "server-only";\nimport {and,eq…' to contain '.limit(501)'
  - Expected
  + Received
  - .limit(501)
  + import "server-only";
  + import {and,eq,inArray,sql} from "drizzle-orm";
  + import {z} from "zod";
  + import {getDb} from "@/db/client";
  ```
