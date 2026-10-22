# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat9-final-TPO-campaigns-public-27.test.ts (1 failing)
- chat-9 final sprint > TPO-campaigns-public-27 preserves verified functionality and safe failure states

  ```
  AssertionError: expected 'import "server-only";\n\nimport { cre…' to contain 'scope === "COMPANY" && !companyJoinEm…'
  - Expected
  + Received
  - scope === "COMPANY" && !companyJoinEmailCandidate
  + import "server-only";
  +
  + import { createHash, createHmac } from "node:crypto";
  + import {companyDomainAcceptsMail} from "../company-mail-domain-resolver";
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

## tests/unit/college-academic-setup-gap-verification.test.ts (5 failing)
- College Academic Setup source acceptance > COL-academic-setup-04 verified academic workflow

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'Waitlist:'
  - Expected
  + Received
  - Waitlist:
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { Select } from "@/components/ui/select";
  + import { Input } from "@/components/ui/input";
  ```
- College Academic Setup source acceptance > COL-academic-setup-05 verified academic workflow

  ```
  AssertionError: expected 'import type { ReactNode } from "react…' to contain 'Pick:'
  - Expected
  + Received
  - Pick:
  + import type { ReactNode } from "react";
  + import { FilterBar } from "@/components/ui/filter-bar";
  + import { Button } from "@/components/ui/button";
  + import { Disclosure } from "@/components/ui/disclosure";
  ```
- College Academic Setup source acceptance > COL-academic-setup-07 verified academic workflow

  ```
  AssertionError: expected '"use client";\n\nimport { Select } fr…' to contain 'Semester course mapping updated.'
  - Expected
  + Received
  - Semester course mapping updated.
  + "use client";
  +
  + import { Select } from "@/components/ui/select";
  + import { Input } from "@/components/ui/input";
  ```
- College Academic Setup source acceptance > COL-academic-setup-13 verified academic workflow

  ```
  AssertionError: expected '"use client";\n\nimport Link from "ne…' to contain 'Academic setup · Step'
  - Expected
  + Received
  - Academic setup · Step
  + "use client";
  +
  + import Link from "next/link";
  + import { Tabs } from "@/components/ui/tabs";
  ```
- College Academic Setup source acceptance > COL-academic-setup-38 verified academic workflow

  ```
  AssertionError: expected '"use client";\n\nimport { useRouter }…' to contain 'title="Archive lecture hall"'
  - Expected
  + Received
  - title="Archive lecture hall"
  + "use client";
  +
  + import { useRouter } from "next/navigation";
  + import Link from "next/link";
  ```

## tests/unit/college-lecture-hall-directory-model.test.ts (2 failing)
- College Admin lecture hall directory filters > defaults to all statuses and room types with a bounded first page

  ```
  AssertionError: expected { q: '', status: 'ALL', …(4) } to deeply equal { q: '', status: 'ALL', …(3) }
  - Expected
  + Received
  {
  "page": 1,
  +   "pageSize": 10,
  "q": "",
  "roomType": "ALL",
  ```
- College Admin lecture hall directory filters > accepts trimmed search with validated type/status/department/page

  ```
  AssertionError: expected { q: 'Comp Lab', …(6) } to deeply equal { q: 'Comp Lab', …(5) }
  - Expected
  + Received
  {
  "departmentId": "00000000-0000-4000-8000-000000000001",
  "page": 2,
  +   "pageSize": 10,
  "q": "Comp Lab",
  ```

## tests/unit/faculty-learner-attendance-detail.test.ts (2 failing)
- Faculty attendance learner detail (read-only) > uses persisted absence evidence on historic sessions without a session marker

  ```
  AssertionError: expected { …(7) } to match object { absent: 1, marked: 1, …(1) }
  (4 matching properties omitted from actual)
  - Expected
  + Received
  {
  -   "absent": 1,
  -   "attendedPercent": 0,
  +   "absent": 0,
  ```
- Faculty monthly class-health report > excludes unmarked, future and out-of-roster historical marks

  ```
  AssertionError: expected { learnerCount: 2, …(11) } to match object { learnerCount: 2, …(10) }
  (1 matching property omitted from actual)
  - Expected
  + Received
  @@ -3,11 +3,11 @@
  "averagePercent": 50,
  "learnerCount": 2,
  "markedMarks": 2,
  ```

## tests/unit/graceful-root-screens.test.ts (1 failing)
- graceful route screens > GR-13 includes not-found paths for each role and public links

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'GracefulScreen'
  - Expected
  + Received
  - GracefulScreen
  + import Link from "next/link";
  + import { PageHeader } from "@/components/ui/page-header";
  +
  + /** In the authenticated shell, errors use its single white page canvas. */
  ```

## tests/unit/learner-course-list-layout.test.ts (2 failing)
- learner Courses responsive layout source contract > keeps course-type filters mobile-responsive and accessible

  ```
  AssertionError: expected '"use client";\n\nimport { MetricBar }…' to contain 'aria-label="Filter by course type"'
  - Expected
  + Received
  - aria-label="Filter by course type"
  + "use client";
  +
  + import { MetricBar } from "@/components/ui/metric-bar";
  + import progressStyles from "./learner-course-progress.module.css";
  ```
- learner Courses responsive layout source contract > keeps clickable cards linked to the correct learner course overview

  ```
  AssertionError: expected '"use client";\n\nimport { MetricBar }…' to contain 'href={`/learn/courses/${row.course.de…'
  - Expected
  + Received
  - href={`/learn/courses/${row.course.deliveryId}/home`}
  + "use client";
  +
  + import { MetricBar } from "@/components/ui/metric-bar";
  + import progressStyles from "./learner-course-progress.module.css";
  ```

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
