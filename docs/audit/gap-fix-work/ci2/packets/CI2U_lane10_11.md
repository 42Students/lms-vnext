# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/college-academic-setup-round4-gap-verification.test.ts (2 failing)
- chat-11 college academic setup remaining acceptance > COL-academic-setup-21 sorts, paginates, counts and clears department searches

  ```
  AssertionError: expected [ 'Zoology', 'Physics', 'Biology' ] to deeply equal [ 'Biology', 'Physics', 'Zoology' ]
  - Expected
  + Received
  [
  -   "Biology",
  -   "Physics",
  "Zoology",
  +   "Physics",
  ```
- chat-11 college academic setup remaining acceptance > COL-academic-setup-40 provides department retry and safe loading feedback

  ```
  AssertionError: expected 'import { PageHeader } from "@/compone…' to contain 'Loading departments…'
  - Expected
  + Received
  - Loading departments…
  + import { PageHeader } from "@/components/ui/page-header";
  +
  + /** Reserve the legacy eight-row, six-column department directory while the
  +  * scoped college and dependency counts are being loaded. */
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

## tests/unit/faculty-attendance-source-round5.test.ts (4 failing)
- chat-11 faculty attendance gap closure verification > FAC-attendance-grades-07 validates end after start, 12-hour bound and successful scheduling

  ```
  AssertionError: expected 'import { authoringLocalDateTime, auth…' to contain 'A class can be at most 12 hours. Chec…'
  - Expected
  + Received
  - A class can be at most 12 hours. Check AM/PM.
  + import { authoringLocalDateTime, authoringDueInstant } from "@/modules/courses/faculty-authoring-datetime-model";
  +
  + /** Editor wall times are always IST; persisted values remain UTC instants.
  +  * The authenticated delivery route owns the faculty/class assignment; it must
  ```
- chat-11 faculty attendance gap closure verification > FAC-attendance-grades-08 shows legacy monthly attendance legend and Active days

  ```
  AssertionError: expected '"use client";\nimport { SummaryStrip …' to contain 'P = Present · A = Absent'
  - Expected
  + Received
  - P = Present · A = Absent
  + "use client";
  + import { SummaryStrip } from "@/components/ui/summary-strip";
  + import { Alert } from "@/components/ui/alert";
  + import { Textarea } from "@/components/ui/textarea";
  ```
- chat-11 faculty attendance gap closure verification > FAC-attendance-grades-09 shows marked and unmarked session counts with monthly report tiles

  ```
  AssertionError: expected '"use client";\nimport { SummaryStrip …' to contain 'session(s) not yet marked'
  - Expected
  + Received
  - session(s) not yet marked
  + "use client";
  + import { SummaryStrip } from "@/components/ui/summary-strip";
  + import { Alert } from "@/components/ui/alert";
  + import { Textarea } from "@/components/ui/textarea";
  ```
- chat-11 faculty attendance gap closure verification > FAC-attendance-grades-17 shows Download Report and safe PDF error feedback

  ```
  AssertionError: expected '"use client";\nimport { Alert } from …' to contain 'Couldn\\'t generate the attendance re…'
  - Expected
  + Received
  - Couldn\'t generate the attendance report. Please try again.
  + "use client";
  + import { Alert } from "@/components/ui/alert";
  + import { useRef, useState } from "react";
  + import { Button } from "@/components/ui/button";
  ```

## tests/unit/faculty-video-management-ui.test.ts (1 failing)
- faculty lesson management storage API wiring > exposes upload thumbnail replacement, publish, ordering, delete and content linking

  ```
  AssertionError: expected '"use client";\n\nimport { useEffect, …' to contain '"DELETE",undefined'
  - Expected
  + Received
  - "DELETE",undefined
  + "use client";
  +
  + import { useEffect, useRef, useState } from "react";
  + import { useRouter } from "next/navigation";
  ```

## tests/unit/learner-added-pages-recovery.test.ts (3 failing)
- Learner added page mobile/recovery/empty audit > learn/my-placements/applications/[applicationId]/history has a real mobile layout and an honest empty state

  ```
  AssertionError: expected 'import { Tabs } from "@/components/ui…' to contain 'No application-status history records'
  - Expected
  + Received
  - No application-status history records
  + import { Tabs } from "@/components/ui/tabs";
  + import {ErrorState} from "@/components/ui/error-state";
  + import {getLearnerPlacementJourney} from "@/modules/placements/learner-journey-service";
  + import {AuthorizationError} from "@/modules/permissions/policy";
  ```
- Learner added page mobile/recovery/empty audit > learn/my-placements/applications/[applicationId]/company has a real mobile layout and an honest empty state

  ```
  AssertionError: expected 'import { Banner } from "@/components/…' to contain 'sm:'
  - Expected
  + Received
  - sm:
  + import { Banner } from "@/components/ui/banner";
  + import { ErrorState } from "@/components/ui/error-state";
  + import { AuthorizationError } from "@/modules/permissions/policy";
  + import Link from "next/link";
  ```
- Learner added page mobile/recovery/empty audit > retains resilient Profile and Placement Cell boundaries

  ```
  AssertionError: expected '"use client";\n\nimport Link from "ne…' to contain 'sm:'
  - Expected
  + Received
  - sm:
  + "use client";
  +
  + import Link from "next/link";
  + import {Dialog} from "@/components/ui/dialog";
  ```

## tests/unit/learner-education-picker-model.test.ts (3 failing)
- LEARNER-profile-misc-06 education examination validation > preserves 10th, 12th/Diploma and degree choices

  ```
  AssertionError: expected [ '10th', '12th', 'Diploma', …(4) ] to deeply equal [ '10th', '12th', 'Diploma', …(2) ]
  - Expected
  + Received
  @@ -2,6 +2,8 @@
  "10th",
  "12th",
  "Diploma",
  "UG",
  ```
- LEARNER-profile-misc-06 education examination validation > guards CGPA, percentage, impossible year order and maximum

  ```
  AssertionError: expected undefined to be 'gradeObtained' // Object.is equality
  - Expected:
  "gradeObtained"
  + Received:
  undefined
  ```
- LEARNER-profile-misc-06 education examination validation > requires every field used by placement eligibility checks with exact legacy errors

  ```
  AssertionError: expected undefined to be 'Choose a valid education type' // Object.is equality
  - Expected:
  "Choose a valid education type"
  + Received:
  undefined
  ```
