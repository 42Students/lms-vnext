# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat4-superadmin-college-one-canvas-audit.test.ts (3 failing)
- Super Admin colleges/organizations canvas and page states > UX-COL-ONE-CANVAS-01 preserves scoped, accessible tenant directories and paging

  ```
  AssertionError: expected 7258 to be less than -1
  ❯ tests/unit/chat4-superadmin-college-one-canvas-audit.test.ts:19:54
  17|    expect(page).toContain('role="search"');
  18|    expect(page).toContain("<ErrorState");
  19|    expect(page.indexOf("requirePermission(context")).toBeLessThan(
  |                                                      ^
  20|     page.indexOf("parseAdminDirectorySearchParams(await searchParams)"…
  21|   }
  ```
- Super Admin colleges/organizations canvas and page states > UX-COL-ONE-CANVAS-02 preserves archived states and college-bound setup links

  ```
  AssertionError: expected 'import Link from "next/link";\n\nimpo…' to contain 'notFound()'
  - Expected
  + Received
  - notFound()
  + import Link from "next/link";
  +
  + import { collegeIdSchema } from "@/modules/colleges/validation";
  + import { AuthorizationError } from "@/modules/permissions/policy";
  ```
- Super Admin colleges/organizations canvas and page states > UX-COL-ONE-CANVAS-03 keeps administrator account and session controls in the directory

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'Showing the first 500 role records.'
  - Expected
  + Received
  - Showing the first 500 role records.
  + import Link from "next/link";
  + import {DataTable} from "@/components/ui/data-table";
  + import {Tabs} from "@/components/ui/tabs";
  + import {Alert} from "@/components/ui/alert";
  ```

## tests/unit/chat6-admin-second-third-lecture-hall-pages.test.ts (1 failing)
- Super Admin second third: actual Lecture Halls server-page states > CHAT6-ADMIN-LECTURES-PAGE-03 passes the authenticated college and validated pagination to both selectors

  ```
  AssertionError: expected '<div class="min-w-0 space-y-4 md:spac…' to contain 'IIT Dharwad'
  - Expected
  + Received
  - IIT Dharwad
  + <div class="min-w-0 space-y-4 md:space-y-6"><header data-slot="page-header" class="mb-2 flex w-full min-w-0 flex-col items-stretch gap-2 border-b border-[var(--lms-canvas-border)] pb-4 md:mb-4 md:flex-row md:items-start md:justify-between md:gap-6 [--lms-page-header-title-size:20px] md:[--lms-page
  ```

## tests/unit/chat6-faculty-evidence-r01-r02-27-r05-r07.test.ts (1 failing)
- chat-6 faculty audit evidence verified from current source > FAC-assessments-R07 reveals exact learner-score rows when a quiz distribution bucket expands

  ```
  AssertionError: expected 'import { MetricBar } from "@/componen…' to contain '<details key={bucket.label}'
  - Expected
  + Received
  - <details key={bucket.label}
  + import { MetricBar } from "@/components/ui/metric-bar";
  + import styles from "@/components/courses/faculty-report-legacy-charts.module.css";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import {FacultyReportBackButton} from "@/components/courses/faculty-report-back-button";
  ```

## tests/unit/chat6-superadmin-faculty-assignment-copy-103.test.ts (1 failing)
- Super Admin faculty assignment copy and audited removal > SA-academics-people-103 shows the faculty assignment legacy heading, creation and current assignments labels

  ```
  AssertionError: expected 'import {and,eq,isNull,sql} from "driz…' to contain 'Current teaching assignments'
  - Expected
  + Received
  - Current teaching assignments
  + import {and,eq,isNull,sql} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  + import {courseTeachingAssignments,courseSectionDeliveries,courseOfferings,courses,departments} from "@/db/schema";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  ```

## tests/unit/chat7-admin-courses-content-hardening.test.ts (1 failing)
- SA-COURSES-CONTENT-AUDIT-02 course and resource list boundaries > does not replace an authorized content result with an empty view when optional pickers fail

  ```
  AssertionError: expected 'import { Banner } from "@/components/…' to contain 'Existing content remains visible'
  - Expected
  + Received
  - Existing content remains visible
  + import { Banner } from "@/components/ui/banner";
  + import Link from "next/link";
  + import { Input } from "@/components/ui/input";
  + import { Select } from "@/components/ui/select";
  ```

## tests/unit/chat7-learner-quiz-discussion-guard-coverage.test.ts (1 failing)
- chat-7 learner assessment and discussion guard exhaustive source-model coverage > UX-course-tab-route-06 denies unexpected tab descendants and unlisted route slugs

  ```
  AssertionError: expected 'roadmap' to be null
  - Expected:
  null
  + Received:
  "roadmap"
  ```

## tests/unit/chat7-round3-mentor-legacy-urls.test.ts (2 failing)
- chat-7 mentor versioned workflow and legacy link parsing > MEN-projects-meetings-R06 has a zero-release recovery state

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain 'No sprints yet. Add the sprints'
  - Expected
  + Received
  - No sprints yet. Add the sprints
  + import { EmptyState } from "@/components/ui/empty-state";
  + import Link from "next/link";
  + import { Tabs } from "@/components/ui/tabs";
  + import { Disclosure } from "@/components/ui/disclosure";
  ```
- chat-7 mentor versioned workflow and legacy link parsing > MEN-projects-meetings-R08 keeps live mentor search controls

  ```
  AssertionError: expected '"use client";\nimport { Input } from …' to contain 'onInput={mentor?liveRefresh:undefined}'
  - Expected
  + Received
  - onInput={mentor?liveRefresh:undefined}
  + "use client";
  + import { Input } from "@/components/ui/input";
  + import { Select } from "@/components/ui/select";
  + import { Button } from "@/components/ui/button";
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
