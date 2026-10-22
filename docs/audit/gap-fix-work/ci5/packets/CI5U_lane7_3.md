# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

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

## tests/unit/chat5-final-faculty-courses-b.test.ts (4 failing)
- chat-5 final sprint: teaching surface and discussion parity > FAC-courses-30 has exact composer hint, quick fills, new message notice, and reversible pin without a native confirmation

  ```
  AssertionError: expected '"use client";\nimport { Alert } from …' to contain 'Students can post questions here anyt…'
  - Expected
  + Received
  - Students can post questions here anytime.
  + "use client";
  + import { Alert } from "@/components/ui/alert";
  +
  +
  ```
- chat-5 final sprint: teaching surface and discussion parity > FAC-courses-33 redirects legacy cls deep links only to an assigned matching course and section

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'if(!target)notFound()'
  - Expected
  + Received
  - if(!target)notFound()
  + import Link from "next/link";
  + import {notFound,redirect} from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { FacultyCourseRoster } from "@/components/courses/faculty-course-roster";
  ```
- chat-5 final sprint: teaching surface and discussion parity > FAC-courses-35 groups lesson authoring in accessible details and describes a keyboard-operable summary

  ```
  AssertionError: expected 'import { StatTile } from "@/component…' to contain '<summary aria-label='
  - Expected
  + Received
  - <summary aria-label=
  + import { StatTile } from "@/components/ui/stat-tile";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { Badge } from "@/components/ui/badge";
  + import { assignmentFilesRuntimeEnabled } from "@/modules/courses/assignment-file-readiness";
  ```
- chat-5 final sprint: teaching surface and discussion parity > FAC-courses-R03 shows assigned Credits and Instructor in the course overview even when descriptive text is empty

  ```
  AssertionError: expected 19136 to be greater than 19939
  ❯ tests/unit/chat5-final-faculty-courses-b.test.ts:52:19
  50|   const display=workspace.indexOf("<CourseDisplayReadOnly");
  51|   expect(intro).toBeGreaterThan(0);
  52|   expect(display).toBeGreaterThan(intro);
  |                   ^
  53|  });
  54| });
  ```

## tests/unit/chat6-auth-logout-revocation.test.ts (3 failing)
- AUTH-sessions-05 logout is truthful and clears shared-device credentials > only reports success after the server token is revoked

  ```
  AssertionError: expected { ok: true, …(2) } to deeply equal { ok: true }
  - Expected
  + Received
  {
  +   "message": "Logged out",
  "ok": true,
  +   "reloginRequired": true,
  }
  ```
- AUTH-sessions-05 logout is truthful and clears shared-device credentials > AUTH-sessions-05 DB outage reports 503, never ok:true; still expires this device's cookies

  ```
  AssertionError: expected { ok: false, …(4) } to deeply equal { ok: false, …(1) }
  - Expected
  + Received
  {
  "error": "LOGOUT_REVOKE_FAILED",
  +   "message": "Could not complete sign-out. Please retry.",
  "ok": false,
  +   "reloginRequired": true,
  ```
- AUTH-sessions-05 logout is truthful and clears shared-device credentials > no prior token is an idempotent logout and never mutates device sessions

  ```
  AssertionError: expected { ok: true, …(2) } to deeply equal { ok: true }
  - Expected
  + Received
  {
  +   "message": "Logged out",
  "ok": true,
  +   "reloginRequired": true,
  }
  ```

## tests/unit/chat6-independent-audit-findings-round9.test.ts (1 failing)
- Independent Super Admin audit findings > SA-placements-projects-122 provides Open Release All, multi filters and bounded 50-row paging

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain 'Assigned'
  - Expected
  + Received
  - Assigned
  + import { EmptyState } from "@/components/ui/empty-state";
  + import { Banner } from "@/components/ui/banner";
  + import Link from "next/link";
  + import {Button} from "@/components/ui/button";
  ```

## tests/unit/chat6-superadmin-middle-role-journeys-21.test.tsx (3 failing)
- SA-admin-middle-role-journeys-21 private placement pages > retention report denies forged learner scope before loading any applicant names

  ```
  TypeError: You must provide a Promise to expect() when using .rejects, not 'object'.
  ❯ tests/unit/chat6-superadmin-middle-role-journeys-21.test.tsx:51:76
  49|  it("retention report denies forged learner scope before loading any a…
  50|   vi.mocked(getCurrentRequestContext).mockResolvedValue(context("LEARN…
  51|   await expect(SuperAdminRetentionPage({searchParams:Promise.resolve({…
  |                                                                            ^
  52|   expect(getSuperAdminPlacementRetentionReport).not.toHaveBeenCalled();
  53|  });
  ```
- SA-admin-middle-role-journeys-21 private placement pages > retention report displays recovery without a college and makes no private query

  ```
  AssertionError: expected '<div class="min-w-0 space-y-4" aria-b…' to contain 'Select a college'
  Expected: "Select a college"
  Received: "<div class="min-w-0 space-y-4" aria-busy="true" aria-label="Loading retention review"><header data-slot="page-header" class="mb-2 flex w-full min-w-0 flex-col items-stretch gap-2 border-b border-[var(--lms-canvas-border)] pb-4 md:mb-4 md:flex-row md:items-start md:justify-between md:gap-6
  ```
- SA-admin-middle-role-journeys-21 private placement pages > expired session aborts both role journeys without a private report read

  ```
  TypeError: You must provide a Promise to expect() when using .rejects, not 'object'.
  ❯ tests/unit/chat6-superadmin-middle-role-journeys-21.test.tsx:62:76
  60|  it("expired session aborts both role journeys without a private repor…
  61|   vi.mocked(getCurrentRequestContext).mockRejectedValue(new Error("Rev…
  62|   await expect(SuperAdminRetentionPage({searchParams:Promise.resolve({…
  |                                                                            ^
  63|   await expect(SuperAdminPlacementInterviewCalendarPage({searchParams:…
  64|   expect(getSuperAdminPlacementRetentionReport).not.toHaveBeenCalled();
  ```

## tests/unit/chat7-final-sprint-superadmin-courses-content.test.ts (4 failing)
- chat-7 final sprint Super Admin courses and content > SA-academics-people-50 validates short title, optional official code and colour independently from internal code

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```
- chat-7 final sprint Super Admin courses and content > SA-academics-people-56 can edit archive reorder and open offering creation from the lesson directory

  ```
  AssertionError: expected '"use client";\nimport { Alert } from …' to contain 'Course / Offering'
  - Expected
  + Received
  - Course / Offering
  + "use client";
  + import { Alert } from "@/components/ui/alert";
  + import Link from "next/link";
  +
  ```
- chat-7 final sprint Super Admin courses and content > SA-academics-people-64 connects assignments to publish archive and existing builder

  ```
  AssertionError: expected 'import { FilterBar } from "@/componen…' to contain 'assignment?"assignments":"quizzes"'
  - Expected
  + Received
  - assignment?"assignments":"quizzes"
  + import { FilterBar } from "@/components/ui/filter-bar";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import Link from "next/link";
  + import {Input} from "@/components/ui/input";
  ```
- chat-7 final sprint Super Admin courses and content > SA-academics-people-65 exposes quiz transitions, result releases and existing builder entry

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'Export quizzes.csv'
  - Expected
  + Received
  - Export quizzes.csv
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {isSuperAdmin} from "@/modules/identity/context";
  + import {requireSuperAdminSelectedCollege} from "@/modules/admin-ui/super-admin-selected-college";
  ```

## tests/unit/chat7-legacy-learner-assignment-detail-copy.test.ts (1 failing)
- legacy learner assignment detail — ViewAssignmentModal.jsx dev > preserves exact Your submission and Due with safe submission state

  ```
  AssertionError: expected 'import { Button } from "@/components/…' to contain 'Submitted {formatDate(item.submittedA…'
  - Expected
  + Received
  - Submitted {formatDate(item.submittedAt)}
  + import { Button } from "@/components/ui/button";
  + import { assignmentFilesRuntimeEnabled } from "@/modules/courses/assignment-file-readiness";
  + import Link from "next/link";
  + import { learnerAssignmentPublishedGradeLabel } from "@/modules/courses/learner-assignment-grade-label-model";
  ```

## tests/unit/chat7-superadmin-course-bulk-page-isolation.test.ts (2 failing)
- SA-courses-visibility-01 admin acting-college, page and bulk selection isolation > never retains a mutable selection on acting-college or visible catalogue ID changes

  ```
  AssertionError: expected 'import { FilterBar } from "@/componen…' to contain 'map(course=>course.id).join'
  - Expected
  + Received
  - map(course=>course.id).join
  + import { FilterBar } from "@/components/ui/filter-bar";
  + import { StatTile } from "@/components/ui/stat-tile";
  + import { Alert } from "@/components/ui/alert";
  + import { Disclosure } from "@/components/ui/disclosure";
  ```
- SA-courses-visibility-01 admin acting-college, page and bulk selection isolation > filters selected items to current college/page on every submit, count and checkbox

  ```
  AssertionError: expected '"use client";\nimport {useEffect,useR…' to contain 'const currentIds=new Set(courses.map(…'
  - Expected
  + Received
  - const currentIds=new Set(courses.map(course=>course.id))
  + "use client";
  + import {useEffect,useRef,useState} from "react";
  + import {useRouter,useSearchParams} from "next/navigation";
  + import {Alert} from "@/components/ui/alert";
  ```
