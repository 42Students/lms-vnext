# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat9-final-SA-placements-projects-102.test.ts (1 failing)
- chat9 final quick-report launcher > SA-placements-projects-102 exposes the existing issue launcher in every authenticated shell without a new unguarded submit route

  ```
  AssertionError: expected '"use client";\n\nimport { useEffect, …' to contain 'modal.showModal()'
  - Expected
  + Received
  - modal.showModal()
  + "use client";
  +
  + import { useEffect, useId, useRef, type ReactNode, type RefObject, type CSSProperties } from "react";
  + import { Button } from "@/components/ui/button";
  ```

## tests/unit/chat9-round9-report-actions.test.ts (1 failing)
- chat9 TPO report drilldowns and presentation > TPO-calendar-reports-44 sends authorized batch and branch to the Students subset with an honest scope disclaimer

  ```
  AssertionError: expected 'import { Input } from "@/components/u…' to contain 'it is not an exhaustive filter of eve…'
  - Expected
  + Received
  - it is not an exhaustive filter of every unplaced student
  + import { Input } from "@/components/ui/input";
  + import { SummaryStrip } from "@/components/ui/summary-strip";
  + import { TpoReportPresentation } from "@/components/placements/tpo-report-presentation";
  + import { Button } from "@/components/ui/button";
  ```

## tests/unit/college-academic-directory-model.test.ts (2 failing)
- College Admin semester and batch read models > accepts only bounded, college-independent semester queries

  ```
  AssertionError: expected { q: '', page: 1, pageSize: 25, …(1) } to deeply equal { q: '', status: 'ALL', page: 1, …(1) }
  - Expected
  + Received
  {
  "page": 1,
  -   "pageSize": 10,
  +   "pageSize": 25,
  "q": "",
  ```
- College Admin semester and batch read models > accepts only defined cohort lifecycles

  ```
  AssertionError: expected { q: '', page: 1, pageSize: 25, …(2) } to deeply equal { q: '', status: 'ALL', …(3) }
  - Expected
  + Received
  {
  "page": 1,
  -   "pageSize": 10,
  +   "pageSize": 25,
  "progression": "ALL",
  ```

## tests/unit/college-faculty-round6-gap-verification.test.ts (3 failing)
- chat-11 College roster and Faculty attendance source parity > COL-academic-setup-28 verifies batch roster, search and class-move entry

  ```
  AssertionError: expected 'import type { ReactNode } from "react…' to contain '"/students"'
  - Expected
  + Received
  - "/students"
  + import type { ReactNode } from "react";
  + import { FilterBar } from "@/components/ui/filter-bar";
  + import { Button } from "@/components/ui/button";
  + import { StatusBadge } from "@/components/ui/status-badge";
  ```
- chat-11 College roster and Faculty attendance source parity > FAC-attendance-grades-14 restores legacy attendance subtitle while keeping useful coverage navigation

  ```
  AssertionError: expected '"use client";\nimport { SummaryStrip …' to contain 'See attendance history and monthly tr…'
  - Expected
  + Received
  - See attendance history and monthly trends in one place.
  + "use client";
  + import { SummaryStrip } from "@/components/ui/summary-strip";
  + import { Alert } from "@/components/ui/alert";
  + import { Textarea } from "@/components/ui/textarea";
  ```
- chat-11 College roster and Faculty attendance source parity > FAC-attendance-grades-18 verifies explicit membership lists and disjoint attendance marks

  ```
  AssertionError: expected 'import "server-only";\n\nimport {\n  …' to contain 'absentMembershipIds: z.array(uuid).ma…'
  - Expected
  + Received
  - absentMembershipIds: z.array(uuid).max(1000)
  + import "server-only";
  +
  + import {
  +   and,
  ```

## tests/unit/faculty-courses-chat7-acceptance.test.ts (1 failing)
- Faculty Courses verified source contracts > FAC-courses-05 maintains the faculty course behavior

  ```
  AssertionError: expected 'import { Badge } from "@/components/u…' to contain 'Teaching assignment(s)'
  - Expected
  + Received
  - Teaching assignment(s)
  + import { Badge } from "@/components/ui/badge";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import Link from "next/link";
  + import {FacultyCourseCover} from "./faculty-course-cover";
  ```

## tests/unit/graceful-provider-adoption.test.ts (2 failing)
- graceful outbound provider adoption > GR-50 ZeptoMail OTP goes through the bounded outbound transport

  ```
  AssertionError: expected 'import { outboundFetch } from "@/lib/…' to contain 'maxAttempts: 1'
  - Expected
  + Received
  - maxAttempts: 1
  + import { outboundFetch } from "@/lib/outbound";
  + import { writeStructuredLog } from "@/observability/logger";
  + import type { EmailProvider } from "./types";
  + import { isValidRecipient, normalizeRecipient } from "@/modules/messaging/model";
  ```
- graceful outbound provider adoption > GR-50 campaign outbound calls avoid duplicate unkeyed POST retries

  ```
  AssertionError: expected 1 to be 2 // Object.is equality
  - Expected
  + Received
  - 2
  + 1
  ```

## tests/unit/learner-course-detail-live-round5.test.ts (1 failing)
- learner live sessions and recovery > LEARNER-course-detail-18 warns when a requested lesson or content is not published

  ```
  AssertionError: expected 'import { MetricBar } from "@/componen…' to contain 'Content unavailable.'
  - Expected
  + Received
  - Content unavailable.
  + import { MetricBar } from "@/components/ui/metric-bar";
  + import type {ComponentProps} from "react";
  + import progressStyles from "./learner-course-progress.module.css";
  + import { Disclosure } from "@/components/ui/disclosure";
  ```

## tests/unit/learner-placements-53-college-rules.test.ts (1 failing)
- LEARNER-placements-53 authoritative placement rules > LEARNER-placements-53 reports saved college limits and truthful held-offer uplift

  ```
  AssertionError: expected [ …(6) ] to include 'Offers you can hold: up to 1 active o…'
  ❯ tests/unit/learner-placements-53-college-rules.test.ts:8:23
  6|  it("LEARNER-placements-53 reports saved college limits and truthful h…
  7|   const view=learnerCollegePlacementRulePoints(rules,[{kind:"OFFER",st…
  8|   expect(view.points).toContain("Offers you can hold: up to 1 active o…
  |                       ^
  9|   expect(view.points.some(point=>point.includes("48 hours"))).toBe(tru…
  10|   expect(view.personal).toContain("₹6 LPA");
  ```
