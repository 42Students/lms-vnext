# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat7-learner-course-file-embargo.test.ts (1 failing)
- LEARNER-COURSE-FILE-EMBARGO-01 private course file read boundary > returns a private object key only after scoped learner authorization

  ```
  AssertionError: expected null to be 'courses/tenant/lesson/resource.pdf' // Object.is equality
  - Expected:
  "courses/tenant/lesson/resource.pdf"
  + Received:
  null
  ```

## tests/unit/chat7-mentor-meeting-draft-lifecycle.test.ts (2 failing)
- MEN-projects-meetings-27 meeting draft lifecycle > MEN-projects-meetings-27 makes draft private and never notifies learners when cancelled

  ```
  AssertionError: expected 'import {\n  and,\n  asc,\n  eq,\n  in…' to contain 'inArray(projectMeetings.status, ["DRA…'
  - Expected
  + Received
  - inArray(projectMeetings.status, ["DRAFT", "REQUESTED", "SCHEDULED","RESCHEDULED"])
  + import {
  +   and,
  +   asc,
  +   eq,
  ```
- MEN-projects-meetings-27 meeting draft lifecycle > MEN-projects-meetings-27 does not announce manager-only facilitator changes

  ```
  AssertionError: expected 'import {\n  and,\n  asc,\n  eq,\n  in…' to contain 'targetStatus==="RESCHEDULED" && exist…'
  - Expected
  + Received
  - targetStatus==="RESCHEDULED" && existing && existing.status!=="RESCHEDULED"
  + import {
  +   and,
  +   asc,
  +   eq,
  ```

## tests/unit/chat7-superadmin-course-authoring-break.test.ts (1 failing)
- SA-academics-people-58 GR-COURSES-TENANT-02 authoring, stale tabs and content sanitization > switching acting college invalidates previous lesson and safely selects only current authorized lessons

  ```
  AssertionError: expected '"use client";\nimport { useState } fr…' to contain 'resolveSuperAdminAuthoringLesson(less…'
  - Expected
  + Received
  - resolveSuperAdminAuthoringLesson(lessons,lessonId)
  + "use client";
  + import { useState } from "react";
  + import { useRouter } from "next/navigation";
  + import { Button } from "@/components/ui/button";
  ```

## tests/unit/chat9-calendar-reports-existing-contracts.test.ts (3 failing)
- TPO calendar and reports verified source contracts > TPO-calendar-reports-04 opens a prefilled-hour modal from the week calendar grid

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'role="dialog"'
  - Expected
  + Received
  - role="dialog"
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { Alert } from "@/components/ui/alert";
  + import { InlineNotice } from "@/components/ui/inline-notice";
  ```
- TPO calendar and reports verified source contracts > TPO-calendar-reports-12 provides Show everything while calendar filters are active

  ```
  AssertionError: expected 'import {TpoWeekHourCalendar} from "@/…' to contain 'href={basePath}'
  - Expected
  + Received
  - href={basePath}
  + import {TpoWeekHourCalendar} from "@/components/placements/tpo-week-hour-calendar";
  + import {TPO_OWNER_PAGE_COPY} from "@/modules/placements/tpo-page-copy";
  + import Link from "next/link";
  +
  ```
- TPO calendar and reports verified source contracts > TPO-calendar-reports-47 calculates and labels answered-offer acceptance rate per company

  ```
  AssertionError: expected 'import {tpoReportHasAmbiguousFilters}…' to contain 'accepted / (accepted + declined)'
  - Expected
  + Received
  - accepted / (accepted + declined)
  + import {tpoReportHasAmbiguousFilters} from "@/modules/placements/tpo-report-url-guard";
  + import {TpoReportInvalidFilters} from "@/components/placements/tpo-report-invalid-filters";
  + import {ReportBarChart} from "@/components/placements/report-bar-chart";
  + import {Disclosure} from "@/components/ui/disclosure";
  ```

## tests/unit/chat9-phase2-college-companies.test.ts (1 failing)
- legacy College Admin Companies route and scope > keeps the page on the college-scoped service with a college-role guard

  ```
  AssertionError: expected 'import { Input } from "@/components/u…' to contain 'hasMembershipRole(context, "COLLEGE_A…'
  - Expected
  + Received
  - hasMembershipRole(context, "COLLEGE_ADMIN")
  + import { Input } from "@/components/ui/input";
  + import { Button } from "@/components/ui/button";
  + import { Select } from "@/components/ui/select";
  + import { FilterBar } from "@/components/ui/filter-bar";
  ```

## tests/unit/chat9-super-admin-module-access.test.ts (1 failing)
- Super Admin Module Access entry > uses persisted scoped module-access service, not a dummy redirect

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'listSuperAdminFeatureControls(context…'
  - Expected
  + Received
  - listSuperAdminFeatureControls(context,parsed)
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Banner } from "@/components/ui/banner";
  ```
