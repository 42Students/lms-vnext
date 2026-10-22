# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat4-super-admin-tenants-modules-gap-closure.test.ts (7 failing)
- chat-4 Super Admin Tenants and Modules verified source contracts > SA-tenants-modules-51 preserves the audited admin workflow

  ```
  AssertionError: expected '"use client";\nimport {useEffect,useR…' to contain 'Mark done'
  - Expected
  + Received
  - Mark done
  + "use client";
  + import {useEffect,useRef,useState} from "react";
  + import Link from "next/link";
  + import {useRouter} from "next/navigation";
  ```
- chat-4 Super Admin Tenants and Modules verified source contracts > SA-tenants-modules-59 preserves the audited admin workflow

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' to contain '<progress'
  - Expected
  + Received
  - <progress
  + import {Button} from "@/components/ui/button";
  + import {MetricBar} from "@/components/ui/metric-bar";
  + import chartStyles from "@/components/placements/report-bar-chart.module.css";
  + import {Select} from "@/components/ui/select";
  ```
- chat-4 Super Admin Tenants and Modules verified source contracts > SA-tenants-modules-61 preserves the audited admin workflow

  ```
  AssertionError: expected 'import {z} from "zod";\nexport const …' to contain '.max(200)'
  - Expected
  + Received
  - .max(200)
  + import {z} from "zod";
  + export const superAdminCollegeBroadcastSchema=z.strictObject({
  +  audienceMode:z.enum(["ALL_COLLEGES","SELECTED_COLLEGES"]),
  +  collegeIds:z.array(z.uuid()).max(500),
  ```
- chat-4 Super Admin Tenants and Modules verified source contracts > SA-tenants-modules-67 presents exact section-specific verification reasons and success copy

  ```
  AssertionError: expected '"use client";\nimport {apiFetch,Frien…' to contain 'apiBase==="/api/admin/verification"'
  - Expected
  + Received
  - apiBase==="/api/admin/verification"
  + "use client";
  + import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
  + import {useEffect,useState} from "react";
  + import {useGuardedAction} from "@/hooks/use-guarded-action";
  ```
- chat-4 Super Admin Tenants and Modules verified source contracts > SA-tenants-modules-43 shows actor sentences and sanitized event details

  ```
  AssertionError: expected 'Ananya changed promoted Cohort 2027' to be 'Ananya promoted cohort Cohort 2027' // Object.is equality
  Expected: "Ananya promoted cohort Cohort 2027"
  Received: "Ananya changed promoted Cohort 2027"
  ```
- chat-4 Super Admin Tenants and Modules verified source contracts > SA-tenants-modules-45 shows 50 events with older matching count

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'limit: 50'
  - Expected
  + Received
  - limit: 50
  + import Link from "next/link";
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {
  ```
- chat-4 Super Admin Tenants and Modules verified source contracts > SA-tenants-modules-44 tells Super Admin the current activity scope

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'Platform-wide activity.'
  - Expected
  + Received
  - Platform-wide activity.
  + import Link from "next/link";
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {
  ```

## tests/unit/chat5-tpo-second-third-page-journeys.test.ts (1 failing)
- chat-5 second-third TPO page journeys > UX-TPO-DRIVE-STOP-37 provides 44px return actions and explicit blocked-state messages on both previews

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'inline-flex min-h-11 items-center'
  - Expected
  + Received
  - inline-flex min-h-11 items-center
  + import Link from "next/link";
  + import {notFound,redirect} from "next/navigation";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {PageHeader} from "@/components/ui/page-header";
  ```

## tests/unit/chat6-faculty-assessment-r04-batched-scope.test.ts (1 failing)
- FAC-assessments-R04 faculty assessment listing cost and ownership > FAC-assessments-R04 reads only authorized teaching offerings in bounded batches, without full authoring workspaces

  ```
  AssertionError: expected 'import { and, asc, count, desc, eq, i…' to contain 'ne(courseAssignments.status, "ARCHIVE…'
  - Expected
  + Received
  - ne(courseAssignments.status, "ARCHIVED")
  + import { and, asc, count, desc, eq, inArray, isNull, ne, or } from "drizzle-orm";
  + import { getDb } from "@/db/client";
  + import {
  +   assignmentSubmissions, courseAssignments, courseLearningPaths, courseLessons, courseQuizzes, lessonContents,
  ```

## tests/unit/chat6-super-admin-session-route-breaker.test.ts (2 failing)
- AUTH-sessions-08 admin session route: origin, payload, tenancy and no-cache > AUTH-sessions-08 forwards only route-college and validated target to the persisted permission service

  ```
  AssertionError: expected { revoked: 2, ok: true, …(2) } to deeply equal { revoked: 2 }
  - Expected
  + Received
  {
  +   "ok": true,
  +   "partial": false,
  +   "refreshSessions": true,
  "revoked": 2,
  ```
- AUTH-sessions-08 admin session route: origin, payload, tenancy and no-cache > AUTH-sessions-08 GET requires target UUID, returns no-store sessions, never revokes

  ```
  AssertionError: expected 500 to be 200 // Object.is equality
  - Expected
  + Received
  - 200
  + 500
  ```

## tests/unit/chat6-tracker-list-round3.test.ts (1 failing)
- Tracker issues list legacy parity > SA-placements-projects-105 filters reporter by literal substring with pagination and legacy labels

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'name="reporter"'
  - Expected
  + Received
  - name="reporter"
  + import Link from "next/link";
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { TrackerAdminNav } from "@/components/tracker/tracker-admin-nav";
  ```

## tests/unit/chat7-learner-course-file-route-boundaries.test.ts (3 failing)
- LEARNER-COURSE-FILE-ROUTE-02 signed learner download security and recovery > resolves one learner-scoped file reference before issuing any storage capability

  ```
  AssertionError: expected 500 to be 302 // Object.is equality
  - Expected
  + Received
  - 302
  + 500
  ```
- LEARNER-COURSE-FILE-ROUTE-02 signed learner download security and recovery > never signs an absent/zero-byte/quarantined-or-unavailable storage reference

  ```
  AssertionError: expected 500 to be 404 // Object.is equality
  - Expected
  + Received
  - 404
  + 500
  ```
- LEARNER-COURSE-FILE-ROUTE-02 signed learner download security and recovery > sanitizes attachment names when the authorized learner requests download=1

  ```
  AssertionError: expected 500 to be 302 // Object.is equality
  - Expected
  + Received
  - 302
  + 500
  ```

## tests/unit/chat7-round2-mentor-01.test.ts (2 failing)
- chat-7 round 2: mentor project card and read-only legacy parity > MEN-projects-meetings-14 real mentor/course subtitle

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain '"Mentor: "'
  - Expected
  + Received
  - "Mentor: "
  + import { EmptyState } from "@/components/ui/empty-state";
  + import Link from "next/link";
  + import { Tabs } from "@/components/ui/tabs";
  + import { Disclosure } from "@/components/ui/disclosure";
  ```
- chat-7 round 2: mentor project card and read-only legacy parity > MEN-projects-meetings-15 archived/completed read-only message

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain 'This workspace is archived. You can r…'
  - Expected
  + Received
  - This workspace is archived. You can read everything here
  + import { EmptyState } from "@/components/ui/empty-state";
  + import Link from "next/link";
  + import { Tabs } from "@/components/ui/tabs";
  + import { Disclosure } from "@/components/ui/disclosure";
  ```

## tests/unit/chat7-superadmin-student-progress-export-boundary.test.ts (3 failing)
- SA-academics-people-67 course-progress students export boundary > rejects ambiguous duplicate offeringId and foreign query keys before checking any membership or reading data

  ```
  AssertionError: expected 403 to be 400 // Object.is equality
  - Expected
  + Received
  - 400
  + 403
  ```
- SA-academics-people-67 course-progress students export boundary > passes only one requested offering ID with the live Super Admin scope, and escapes formula-like learner names

  ```
  AssertionError: expected 403 to be 200 // Object.is equality
  - Expected
  + Received
  - 200
  + 403
  ```
- SA-academics-people-67 course-progress students export boundary > keeps the student browser page from arbitrarily selecting the first duplicated URL parameter

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'typeof query.offeringId==="string"?qu…'
  - Expected
  + Received
  - typeof query.offeringId==="string"?query.offeringId:null
  + import Link from "next/link";
  + import {redirect} from "next/navigation";
  + import {and,asc,eq,sql} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  ```
