# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat7-learner-course-discussion-coverage.test.ts (1 failing)
- chat-7 learner course Discussion capability and concurrency > UX-learn-discussion-limit-03 bounds persisted text at 3900 characters, rejecting whitespace-only input

  ```
  AssertionError: expected 4000 to be 3900 // Object.is equality
  - Expected
  + Received
  - 3900
  + 4000
  ```

## tests/unit/chat7-legacy-learner-submission-form-copy.test.ts (1 failing)
- SubmitAssignmentModal.jsx dev copy in Learner submission form > uses exact drawer and submission-method labels

  ```
  AssertionError: expected '"use client";\nimport { Select } from…' to contain 'Add your work using the method below'
  - Expected
  + Received
  - Add your work using the method below
  + "use client";
  + import { Select } from "@/components/ui/select";
  +
  + import {
  ```

## tests/unit/chat7-superadmin-course-assessment-ux-boundaries.test.ts (3 failing)
- SA-academics-people-64/65 Super Admin assessment privacy and phone states > SA-academics-people-64 rejects quiz-only result publication filters rather than throwing after fetching

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'query.data.results !== "ALL"'
  - Expected
  + Received
  - query.data.results !== "ALL"
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {isSuperAdmin} from "@/modules/identity/context";
  + import { EmptyState } from "@/components/ui/empty-state";
  ```
- SA-academics-people-64/65 Super Admin assessment privacy and phone states > SA-academics-people-64 offers 44px Section, Publish grades and retry actions

  ```
  AssertionError: expected '"use client";\nimport {Select} from "…' to contain 'Publish grades for every graded submi…'
  - Expected
  + Received
  - Publish grades for every graded submission in this Section?
  + "use client";
  + import {Select} from "@/components/ui/select";
  + import {Button} from "@/components/ui/button";
  + import {Alert} from "@/components/ui/alert";
  ```
- SA-academics-people-64/65 Super Admin assessment privacy and phone states > SA-academics-people-65 keeps private quiz attempts within keyboard-readable 44px controls and contained list

  ```
  AssertionError: expected '"use client";\n\nimport {useEffect,us…' to contain 'aria-label="Quiz submissions, scroll …'
  - Expected
  + Received
  - aria-label="Quiz submissions, scroll for more attempts"
  + "use client";
  +
  + import {useEffect,useRef,useState} from "react";
  + import {Input} from "@/components/ui/input";
  ```

## tests/unit/chat9-calendar-partial-recovery.test.ts (1 failing)
- TPO calendar partial-data recovery > TPO-calendar-reports-22 keeps a successful primary calendar visible when auxiliary counts fail

  ```
  AssertionError: expected 'import {TpoWeekHourCalendar} from "@/…' to contain 'Calendar summary is partially unavail…'
  - Expected
  + Received
  - Calendar summary is partially unavailable.
  + import {TpoWeekHourCalendar} from "@/components/placements/tpo-week-hour-calendar";
  + import {TPO_OWNER_PAGE_COPY} from "@/modules/placements/tpo-page-copy";
  + import Link from "next/link";
  +
  ```

## tests/unit/chat9-phase2-college-analytics.test.ts (1 failing)
- legacy College Admin Analytics scope and URL > requires the persisted membership college before calling the report service

  ```
  AssertionError: expected 'import { Alert } from "@/components/u…' to contain 'collegeId: context.membership.college…'
  - Expected
  + Received
  - collegeId: context.membership.collegeId
  + import { Alert } from "@/components/ui/alert";
  + import { AuthorizationError } from "@/modules/permissions/policy";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { hasMembershipRole } from "@/modules/identity/context";
  ```

## tests/unit/chat9-super-admin-exact-page-copy.test.ts (2 failing)
- Super Admin exact dev-legacy per-page title strings (legacy-copy-B) > dashboard/page.tsx uses the exact title case

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'title="Overview"'
  - Expected
  + Received
  - title="Overview"
  + import Link from "next/link";
  + import {getSuperAdminCollegeAtGlance} from "@/modules/colleges/admin-college-at-glance-service";
  + import {CollegeAtGlancePanel} from "@/components/admin/college-at-glance-panel";
  + import {getSuperAdminTodayBoard} from "@/modules/colleges/admin-today-attention-service";
  ```
- Super Admin exact dev-legacy per-page title strings (legacy-copy-B) > admin/audit/page.tsx uses the exact title case

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'title="Activity Log"'
  - Expected
  + Received
  - title="Activity Log"
  + import Link from "next/link";
  + import {redirect} from "next/navigation";
  + import ActivityPage from "@/app/(authenticated)/activity/page";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  ```
