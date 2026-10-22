# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat9-college-exact-page-titles.test.ts (2 failing)
- College Admin exact legacy page title copy > videos/page.tsx has exact legacy title for normal and invalid states

  ```
  AssertionError: expected 'import {CollegeCourseMissingScope} fr…' to contain 'title="Video"'
  - Expected
  + Received
  - title="Video"
  + import {CollegeCourseMissingScope} from "@/components/courses/college-course-missing-scope";
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { CollegeContentAggregate } from "@/components/courses/college-content-aggregate";
  ```
- College Admin exact legacy page title copy > course-progress/page.tsx has exact legacy title for normal and invalid states

  ```
  AssertionError: expected 'import {CollegeProgressCapture} from …' to contain 'title="Progress"'
  - Expected
  + Received
  - title="Progress"
  + import {CollegeProgressCapture} from "@/components/courses/college-progress-last-good";
  + import { CollegeCourseMissingScope } from "@/components/courses/college-course-missing-scope";
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```

## tests/unit/chat9-project-navigation-reachability.test.ts (1 failing)
- College Projects navigation has a real route and one tab strip > links Projects and Workspaces to the real list and preserves detail route

  ```
  AssertionError: expected 'import { Tabs } from "@/components/ui…' to contain 'if (basePath === "/college/projects" …'
  - Expected
  + Received
  - if (basePath === "/college/projects" || basePath === "/admin/projects") return null;
  + import { Tabs } from "@/components/ui/tabs";
  + import styles from "./legacy-project-tabs.module.css";
  + import { PROJECT_ADMIN_SECTIONS } from "@/modules/projects/project-admin-navigation-model";
  +
  ```

## tests/unit/chat9-super-admin-verification-copy.test.ts (1 failing)
- Super Admin legacy verification exact page copy > never selects the first college or exposes cross-college decisions

  ```
  AssertionError: expected 'import {Banner} from "@/components/ui…' to contain 'redirect(`/admin/colleges/${encodeURI…'
  - Expected
  + Received
  - redirect(`/admin/colleges/${encodeURIComponent(collegeId)}/verification`);
  + import {Banner} from "@/components/ui/banner";
  + import AdminCollegeVerification from "@/app/(authenticated)/admin/colleges/[collegeId]/verification/page";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { PageHeader } from "@/components/ui/page-header";
  ```

## tests/unit/college-contacts-page-shortcuts.test.ts (1 failing)
- College Contacts first and last page navigation > retains all active scoped filters while changing only pagination

  ```
  AssertionError: expected null to be '10' // Object.is equality
  - Expected:
  "10"
  + Received:
  null
  ```

## tests/unit/college-term-mapping-model.test.ts (1 failing)
- Semester-course mapping boundaries > updates mapping credits/order and rejects invalid positions or values

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```

## tests/unit/faculty-report-pdf.test.ts (3 failing)
- Faculty PDF reports > keeps a section heading with its first row across a page boundary

  ```
  AssertionError: expected '0.039 0.486 0.533 rg 0 834 595 8 re f…' to contain '(LEARNER RESULTS)'
  - Expected
  + Received
  - (LEARNER RESULTS)
  + 0.039 0.486 0.533 rg 0 834 595 8 re f
  + 0.039 0.486 0.533 rg BT /F2 12 Tf 42 794 Td (FACULTY ASSIGNMENT REPORT) Tj ET
  + 0.851 0.890 0.925 RG 0.6 w 42 776 m 553 776 l S
  + 0.949 0.974 0.979 rg 42 704 164.33333333333334 50 re f
  ```
- Faculty PDF reports > normalizes non-ASCII text to PDF-safe printable content

  ```
  AssertionError: expected '%PDF-1.4\n1 0 obj\n<< /Type /Catalog …' to contain '(Ecole ? Report)'
  - Expected
  + Received
  - (Ecole ? Report)
  + %PDF-1.4
  + 1 0 obj
  + << /Type /Catalog /Pages 2 0 R >>
  + endobj
  ```
- Faculty monthly Attendance PDF > exports the current Section's marked and unknown outcomes as a valid PDF

  ```
  AssertionError: expected '%PDF-1.4\n1 0 obj\n<< /Type /Catalog …' to contain 'Unmarked: 3 excluded from percentage'
  - Expected
  + Received
  - Unmarked: 3 excluded from percentage
  + %PDF-1.4
  + 1 0 obj
  + << /Type /Catalog /Pages 2 0 R >>
  + endobj
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

## tests/unit/learner-jobs-browse-parity.test.ts (1 failing)
- Learner Drives browse integration > preserves URL search/back navigation and does not mutate applications on filter

  ```
  AssertionError: expected '"use client";\n\nimport { useCallback…' to contain 'filterLearnerPlacementJobs(matchingIt…'
  - Expected
  + Received
  - filterLearnerPlacementJobs(matchingItems, filters, Date.parse(snapshotNowIso))
  + "use client";
  +
  + import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
  + import {Disclosure} from "@/components/ui/disclosure";
  ```
