# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat7-last-gaps-faculty-assessments.test.ts (3 failing)
- chat-7 last gaps: faculty assessment behavior > FAC-assessments-25: due or created timestamps and course lesson scope information are shown

  ```
  AssertionError: expected '"use client";\nimport { Badge } from …' to contain 'Due date: '
  - Expected
  + Received
  - Due date:
  + "use client";
  + import { Badge } from "@/components/ui/badge";
  + import {PageHeader} from "@/components/ui/page-header";
  + import { Disclosure } from "@/components/ui/disclosure";
  ```
- chat-7 last gaps: faculty assessment behavior > FAC-assessments-26: drafts and published assignments link to a real review with empty state

  ```
  AssertionError: expected '"use client";\n\nimport { Select } fr…' to contain 'No submissions yet. Publish this assi…'
  - Expected
  + Received
  - No submissions yet. Publish this assignment to allow students to submit work.
  + "use client";
  +
  + import { Select } from "@/components/ui/select";
  + import Link from "next/link";
  ```
- chat-7 last gaps: faculty assessment behavior > FAC-assessments-28: incomplete PDF must be confirmed and marked, complete report is immediate

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
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

## tests/unit/chat7-round3-mentor-basics.test.ts (1 failing)
- chat-7 round 3 mentor access and state > MEN-projects-meetings-01 module lookup failure does not assert disabled state

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'Projects could not be loaded'
  - Expected
  + Received
  - Projects could not be loaded
  + import Link from "next/link";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Banner } from "@/components/ui/banner";
  +
  ```

## tests/unit/chat9-accreditation-employer-contact.test.ts (2 failing)
- NAAC employer contact disclosure > TPO-calendar-reports-R04 uses a recorded college company relationship email rather than a learner contact

  ```
  AssertionError: expected undefined to be 'recruiter@example.com' // Object.is equality
  - Expected:
  "recruiter@example.com"
  + Received:
  undefined
  ```
- NAAC employer contact disclosure > TPO-calendar-reports-R04 leaves missing employer emails unavailable, never substitutes student PII

  ```
  AssertionError: expected undefined to be null
  - Expected:
  null
  + Received:
  undefined
  ```

## tests/unit/chat9-final-LEARNER-course-detail-18.test.ts (1 failing)
- chat-9 final sprint > LEARNER-course-detail-18 preserves verified functionality and safe failure states

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

## tests/unit/chat9-round9-calendar-behavior.test.ts (4 failing)
- chat9 calendar and report layout behavior verification (no restyling) > TPO-calendar-reports-03 shows a real 07:00–21:00 weekly hourly timeline with active now indicator

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'const FIRST=7,LAST=21,HEIGHT=64;'
  - Expected
  + Received
  - const FIRST=7,LAST=21,HEIGHT=64;
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { Alert } from "@/components/ui/alert";
  + import { InlineNotice } from "@/components/ui/inline-notice";
  ```
- chat9 calendar and report layout behavior verification (no restyling) > TPO-calendar-reports-04 opens a prefilled, cancellable follow-up form from an hour slot, with blocked-day confirmation

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'aria-label="New recruiter follow-up"'
  - Expected
  + Received
  - aria-label="New recruiter follow-up"
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { Alert } from "@/components/ui/alert";
  + import { InlineNotice } from "@/components/ui/inline-notice";
  ```
- chat9 calendar and report layout behavior verification (no restyling) > TPO-calendar-reports-09 shows actual today items and next 7 days while keeping unavailable data distinct from zero

  ```
  AssertionError: expected 'import {TpoWeekHourCalendar} from "@/…' to contain 'Next 7 days ·'
  - Expected
  + Received
  - Next 7 days ·
  + import {TpoWeekHourCalendar} from "@/components/placements/tpo-week-hour-calendar";
  + import {TPO_OWNER_PAGE_COPY} from "@/modules/placements/tpo-page-copy";
  + import Link from "next/link";
  +
  ```
- chat9 calendar and report layout behavior verification (no restyling) > TPO-calendar-reports-39 keeps journey links tied to selected season with no pretend offer count

  ```
  AssertionError: expected 'import { Select } from "@/components/…' to contain 'offers made across the selected seaso…'
  - Expected
  + Received
  - offers made across the selected season and drive scope.
  + import { Select } from "@/components/ui/select";
  + import { tpoReportHasAmbiguousFilters } from "@/modules/placements/tpo-report-url-guard";
  + import { TpoReportInvalidFilters } from "@/components/placements/tpo-report-invalid-filters";
  + import { Input } from "@/components/ui/input";
  ```
