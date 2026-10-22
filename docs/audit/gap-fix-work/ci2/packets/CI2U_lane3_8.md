# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat2-tpo-recruiter-needs.test.ts (1 failing)
- TPO Engage legacy Needs doing > TPO-recruiters-07 shows only real nonzero legacy attention categories and count

  ```
  AssertionError: expected '"use client";\nimport { PageHeader } …' to contain 'Nothing right now.'
  - Expected
  + Received
  - Nothing right now.
  + "use client";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Tabs } from "@/components/ui/tabs";
  + import { FilterChip } from "@/components/ui/filter-chip";
  ```

## tests/unit/chat3-closure-round13-six.test.ts (3 failing)
- chat-3 final six round13 audited functional closures > TPO-drives-05 displays real persisted lifecycle stages rather than static placeholder

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'Where it is: {tpoDriveWhereItIs(job,d…'
  - Expected
  + Received
  - Where it is: {tpoDriveWhereItIs(job,data.asOf)}
  + import Link from "next/link";
  + import { Dropdown } from "@/components/ui/dropdown";
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```
- chat-3 final six round13 audited functional closures > LEARNER-learning-misc-33 distinguishes unassigned, empty week and retriable error

  ```
  AssertionError: expected '"use client";\nimport { Input } from …' to contain 'No scheduled classes this week.'
  - Expected
  + Received
  - No scheduled classes this week.
  + "use client";
  + import { Input } from "@/components/ui/input";
  + import { CalendarGrid } from "@/components/ui/calendar-grid";
  + import calendarStyles from "@/components/placements/legacy-calendar-theme.module.css";
  ```
- chat-3 final six round13 audited functional closures > LEARNER-learning-misc-38 preserves separate no-course/no-record/error messages

  ```
  AssertionError: expected '"use client";\n\nimport { Disclosure …' to contain 'deliveryId ? "No attendance records" …'
  - Expected
  + Received
  - deliveryId ? "No attendance records" : "Select a course"
  + "use client";
  +
  + import { Disclosure } from "@/components/ui/disclosure";
  + import Link from "next/link";
  ```

## tests/unit/chat3-sa-faculty-assignments-tenant-pages.test.ts (3 failing)
- SA3-FAC-ASSIGNMENTS-01 scoped assignment directory and facets > limits assignment joins to one college and a Section matching the course offering cohort and term

  ```
  TypeError: Cannot read properties of undefined (reading 'toISOString')
  ❯ src/modules/admin-ui/super-admin-faculty-assignments-service.ts:117:26
  115|   id:row.id,title:row.teacherName?.trim()||"Faculty name unavailable (…
  116|   subtitle:(row.courseName?.trim()||"Course name unavailable (ID "+row…
  117|   revision:row.updatedAt.toISOString(),
  |                          ^
  118|   // Private server-rendered action metadata; the generic directory do…
  119|   // not display these membership or delivery identifiers as columns.
  ```
- SA3-FAC-ASSIGNMENTS-01 scoped assignment directory and facets > clamps stale deep links to the current final page after a Faculty assignment was removed

  ```
  TypeError: Cannot read properties of undefined (reading 'toISOString')
  ❯ src/modules/admin-ui/super-admin-faculty-assignments-service.ts:117:26
  115|   id:row.id,title:row.teacherName?.trim()||"Faculty name unavailable (…
  116|   subtitle:(row.courseName?.trim()||"Course name unavailable (ID "+row…
  117|   revision:row.updatedAt.toISOString(),
  |                          ^
  118|   // Private server-rendered action metadata; the generic directory do…
  119|   // not display these membership or delivery identifiers as columns.
  ```
- SA3-FAC-ASSIGNMENTS-01 scoped assignment directory and facets > limits selectable class facets by both cohort-program department and term college

  ```
  AssertionError: expected 2 to be greater than or equal to 3
  ❯ tests/unit/chat3-sa-faculty-assignments-tenant-pages.test.ts:197:84
  195|     expect(joined).toContain('"academic_periods"."college_id"');
  196|     expect(joined).toContain('"departments"."college_id"');
  197|     expect(state.joins.flatMap(p => p.params).filter(p => p === colleg…
  |                                                                                    ^
  198|     expect(state.joins.flatMap(p => p.params)).toContain(organizationI…
  199|     expect(joined).toContain('"colleges"."organization_id"');
  ```

## tests/unit/chat4-college-admin-projects-role-journey.test.ts (3 failing)
- Existing chat-4 CI failure regression contracts > SA-placements-projects-58 overload is strictly above 150% of the current average, not a fixed cap

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```
- PROJ-BREAK-COLLEGE-04 College Admin project list URL and navigation hardening > PROJ-BREAK-COLLEGE-04-09 preserves numeric pagination and valid college project status filters

  ```
  AssertionError: expected { Object (view, page, ...) } to match object { Object (view, page, ...) }
  - Expected
  + Received
  {
  "page": 1,
  -   "pageSize": 25,
  -   "view": "cards",
  +   "pageSize": 20,
  ```
- PROJ-BREAK-COLLEGE-04 College Admin project list URL and navigation hardening > PROJ-BREAK-COLLEGE-04-10 refuses duplicated, foreign, malformed or exponential query filters

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```

## tests/unit/chat4-college-structure-responsive-data-table.test.tsx (2 failing)
- COL-UX-STRUCTURE-TABLE-02 responsive Classes and Electives directories > keeps class academic period, capacity, current roster and accessible schedule/lifecycle actions

  ```
  
  ```
- COL-UX-STRUCTURE-TABLE-02 responsive Classes and Electives directories > retains academic choices, confirmed learners and elective actions on a phone-readable table

  ```
  Error: invariant expected app router to be mounted
  ❯ useRouter node_modules/next/src/client/components/navigation.ts:169:11
  ❯ CollegeDirectoryRefresh src/components/academics/college-directory-page-size.tsx:49:18
  47|
  48| export function CollegeDirectoryRefresh() {
  49|   const router = useRouter();
  |                  ^
  50|   const [pending, startTransition] = useTransition();
  ```

## tests/unit/chat4-learner-home-courses-gap-closure.test.ts (6 failing)
- chat-4 learner Home and Courses gap closure > LEARNER-home-courses-13 learner header retains Course workspace and separate read-only status

  ```
  AssertionError: expected 'import { Banner } from "@/components/…' to contain 'description="Course workspace"'
  - Expected
  + Received
  - description="Course workspace"
  + import { Banner } from "@/components/ui/banner";
  + import { CoursesServiceError } from "@/modules/courses/errors";
  + import { AuthorizationError } from "@/modules/permissions/policy";
  + import { ZodError } from "zod";
  ```
- chat-4 learner Home and Courses gap closure > LEARNER-course-detail-R01 persists actual rewind position and restarts completed playback

  ```
  AssertionError: expected '"use client";\n\nimport {\n  useEffec…' to contain 'completed ? 0 : initialPositionSeconds'
  - Expected
  + Received
  - completed ? 0 : initialPositionSeconds
  + "use client";
  +
  + import {
  +   useEffect,
  ```
- chat-4 learner Home and Courses gap closure > LEARNER-home-courses-23 omits empty course About content

  ```
  AssertionError: expected 'import { StatTile } from "@/component…' to contain 'aboutSource.hasDescription||meta.cred…'
  - Expected
  + Received
  - aboutSource.hasDescription||meta.credits!==null||meta.instructors.length>0
  + import { StatTile } from "@/components/ui/stat-tile";
  + import { Badge } from "@/components/ui/badge";
  + import { Alert } from "@/components/ui/alert";
  + import Link from "next/link";
  ```
- chat-4 learner Home and Courses gap closure > LEARNER-home-courses-19 uses an in-page Delete this message dialog

  ```
  AssertionError: expected '"use client";\n\nimport { useId, useR…' to contain 'modal.showModal()'
  - Expected
  + Received
  - modal.showModal()
  + "use client";
  +
  + import { useId, useRef, type ReactNode, type CSSProperties } from "react";
  + import { Button } from "@/components/ui/button";
  ```
- chat-4 learner Home and Courses gap closure > LEARNER-home-courses-16 renders one legacy attendance percentage and Present Absent Held counts

  ```
  AssertionError: expected '"use client";\nimport { Input } from …' to contain 'aria-label="Attendance this month"'
  - Expected
  + Received
  - aria-label="Attendance this month"
  + "use client";
  + import { Input } from "@/components/ui/input";
  +
  + import { learnerCourseAttendanceMonthShortcutVisible } from "@/modules/attendance/learner-course-attendance-month-shortcut-model";
  ```
- chat-4 learner Home and Courses gap closure > LEARNER-home-courses-20 shows who pinned a discussion and number of pinned messages

  ```
  AssertionError: expected '"use client";\nimport { Alert } from …' to contain 'Pinned by {pinned.senderName??"Unknow…'
  - Expected
  + Received
  - Pinned by {pinned.senderName??"Unknown"} · 1 of {pinnedMessages.length||1}
  + "use client";
  + import { Alert } from "@/components/ui/alert";
  +
  +
  ```
