# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/PROJ-BREAK-chat9-admin-scoped-directory-states.test.tsx (4 failing)
- Super Admin last-third shared scoped directories: no false empties or leaked errors > UX-admin-directory-103 missing selected college does not infer a default tenant

  ```
  AssertionError: expected 'Registered Students Super Admin Selec…' to contain 'Select a college to continue'
  Expected: "Select a college to continue"
  Received: "Registered Students Super Admin Select a College to manage Learners Learners are treated as college-scoped in Superadmin to prevent cross-tenant edits."
  ```
- Super Admin last-third shared scoped directories: no false empties or leaked errors > UX-admin-directory-104 essential load outage preserves validated filters and does not render zero matching results

  ```
  AssertionError: expected 'Registered Students Super Admin The s…' to contain 'Directory unavailable'
  Expected: "Directory unavailable"
  Received: "Registered Students Super Admin The selected college's records could not be loaded. Your filters have not changed. Retry /admin/students?q=IIT+Dharwad&status=ACTIVE&page=2&pageSize=50 Could not load student roster"
  ```
- Super Admin last-third shared scoped directories: no false empties or leaked errors > UX-admin-directory-105 optional summary failure keeps filtered primary records reachable

  ```
  AssertionError: expected 'Registered Students Scoped list Direc…' to contain 'No matching records'
  Expected: "No matching records"
  Received: "Registered Students Scoped list Directory totals are temporarily unavailable. The filtered records below remain visible. Search Status Any status Active Suspended Ended Filter Filters Rows per page 0 matching records  · showing  0 – 0  · page  1  of  1"
  ```
- Super Admin last-third shared scoped directories: no false empties or leaked errors > UX-admin-directory-106 legitimate empty list remains a distinct zero-state

  ```
  AssertionError: expected 'Registered Students Scoped list Stude…' to contain 'No matching records'
  Expected: "No matching records"
  Received: "Registered Students Scoped list Students 0 Active 0 Suspended 0 Visible now 0 Search Status Any status Active Suspended Ended Filter Rows per page 0 of 0 students  · showing  0 – 0  · page  1  of  1"
  ```

## tests/unit/PROJ-BREAK-chat9-sa-quiz-role-journey.test.tsx (2 failing)
- Super Admin last-third: quiz directory guarded server journey > UX-admin-quizzes-08 directory outage retains valid filters and shows retry without leaking internals

  ```
  AssertionError: expected 'Quizzes Courses & Content Quizzes cou…' to contain 'Quizzes unavailable'
  Expected: "Quizzes unavailable"
  Received: "Quizzes Courses & Content Quizzes could not be loaded Failed to fetch quizzes. Please try again. Your selected college and filters have not changed. Retry loading quizzes /admin/quizzes?q=IIT+Dharwad&status=PUBLISHED&page=2"
  ```
- Super Admin last-third: quiz directory guarded server journey > UX-admin-quizzes-09 authoring-option outage never hides existing authorized quiz directory

  ```
  TypeError: Cannot read properties of undefined (reading 'map')
  ❯ Module.SuperAdminQuizzesPage src/app/(authenticated)/admin/quizzes/page.tsx:88:33
  86|          className="w-full">
  87|          <option value="">All courses</option>
  88|          {data.directoryCourses.map(course=><option key={course.code} …
  |                                 ^
  89|         </Select>
  90|        </label>
  ```

## tests/unit/UX-HR-chat19-round-unsaved.test.ts (1 failing)
- UX-HR-ROUND-UNSAVED-32: protected round-edit dialog changes > routes Escape/backdrop and Cancel through confirmation, and keeps remove confirmation distinct

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'open={confirmDiscard} title="Discard …'
  - Expected
  + Received
  - open={confirmDiscard} title="Discard unsaved round changes?"
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { InlineNotice } from "@/components/ui/inline-notice";
  + import { Select } from "@/components/ui/select";
  ```

## tests/unit/UX-chat15-shell-activity-components-01.test.ts (2 failing)
- UX-chat15-shell-activity-components-01 > UX-shell-learner-bell-01 gives button 44px, marks unread and preserves role scoped personal inbox

  ```
  AssertionError: expected '"use client";\nimport Link from "next…' to contain 'role="dialog"'
  - Expected
  + Received
  - role="dialog"
  + "use client";
  + import Link from "next/link";
  + import {Button} from "@/components/ui/button";
  + import {PopoverPanel} from "@/components/ui/popover";
  ```
- UX-chat15-shell-activity-components-01 > UX-shell-mobile-navigation-01 opens a true accessible navigation overlay with Escape and focus trap

  ```
  AssertionError: expected '"use client";\n\nimport { useEffect, …' to contain 'aria-label="Open navigation menu"'
  - Expected
  + Received
  - aria-label="Open navigation menu"
  + "use client";
  +
  + import { useEffect, useState } from "react";
  + import { usePathname } from "next/navigation";
  ```

## tests/unit/UX-college-college-contacts-01.test.ts (1 failing)
- UX-college-college-contacts-01 retains responsive forms, states and legacy copy

  ```
  AssertionError: expected 'import { DateInput } from "@/componen…' to contain 'overflow-x-clip'
  - Expected
  + Received
  - overflow-x-clip
  + import { DateInput } from "@/components/ui/date-input";
  + import { Input } from "@/components/ui/input";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { Button } from "@/components/ui/button";
  ```

## tests/unit/UX-college-college-live-classes-01.test.ts (1 failing)
- UX-college-college-live-classes-01 ensures route-safe responsive navigation

  ```
  AssertionError: expected 'import {CollegeCourseMissingScope} fr…' to contain 'overflow-x-clip'
  - Expected
  + Received
  - overflow-x-clip
  + import {CollegeCourseMissingScope} from "@/components/courses/college-course-missing-scope";
  + import Link from "next/link";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {CollegeLiveClassesDirectory} from "@/components/courses/college-live-classes-directory";
  ```
