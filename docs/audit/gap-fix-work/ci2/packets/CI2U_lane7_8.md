# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat2-tpo-reports-gallery-order.test.ts (1 failing)
- TPO report gallery display order > sorts independently inside existing category groups

  ```
  AssertionError: expected [ 'Zebra', 'Alpha' ] to deeply equal [ 'Alpha', 'Zebra' ]
  - Expected
  + Received
  [
  -   "Alpha",
  "Zebra",
  +   "Alpha",
  ]
  ```

## tests/unit/chat3-faculty-contacts-detail-service-scope.test.ts (1 failing)
- FAC-CONTACTS-DETAIL-01 authorized public contact detail > blocks a direct URL into a different tab when the contact lacks that role

  ```
  AssertionError: expected 4 to be 3 // Object.is equality
  - Expected
  + Received
  - 3
  + 4
  ```

## tests/unit/chat3-superadmin-academics-people-journeys.test.ts (1 failing)
- chat-3 Super Admin Academics + People account journeys > SA-academics-people-06 Academics, People and recruiter compatibility pages keep scoped safe entrypoints

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'title="Select a college scope"'
  - Expected
  + Received
  - title="Select a college scope"
  + import Link from "next/link";
  + import { redirect } from "next/navigation";
  + import { isSuperAdmin } from "@/modules/identity/context";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```

## tests/unit/chat4-college-course-tabs-gap-closure.test.ts (7 failing)
- chat-4 College Course Tabs gap closure > COL-course-tabs-06 verifies scoped College Admin authoring and listing

  ```
  AssertionError: expected '"use client";\nimport { Textarea } fr…' to contain 'Create New Quiz'
  - Expected
  + Received
  - Create New Quiz
  + "use client";
  + import { Textarea } from "@/components/ui/textarea";
  + import { Input } from "@/components/ui/input";
  + import { Select } from "@/components/ui/select";
  ```
- chat-4 College Course Tabs gap closure > COL-course-tabs-27 shows Lessons, Progress, Assignments and Quizzes as mobile cards

  ```
  AssertionError: expected 'import type { ReactNode } from "react…' to contain 'aria-label={title+" mobile records"}'
  - Expected
  + Received
  - aria-label={title+" mobile records"}
  + import type { ReactNode } from "react";
  + import { Input } from "@/components/ui/input";
  + import { Select } from "@/components/ui/select";
  + import { Button } from "@/components/ui/button";
  ```
- chat-4 College Course Tabs gap closure > COL-course-tabs-22 keeps all College Course pages usable when no college is assigned

  ```
  AssertionError: expected 'import { getCurrentRequestContext } f…' to contain 'CollegeCourseMissingScope'
  - Expected
  + Received
  - CollegeCourseMissingScope
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { CollegeAssessmentAggregate } from "@/components/courses/college-assessment-aggregate";
  + import {CollegeAssignmentCreate} from "@/components/courses/college-assignment-create";
  + import {getCollegeAssignmentAuthoringCatalog} from "@/modules/courses/college-assignment-authoring-options";
  ```
- chat-4 College Course Tabs gap closure > COL-course-tabs-17 permits only metadata in authorized admin content preview

  ```
  AssertionError: expected '"use client";\n\nimport { useState } …' to contain 'Private files, meeting links and sign…'
  - Expected
  + Received
  - Private files, meeting links and signed playback addresses are not exposed here.
  + "use client";
  +
  + import { useState } from "react";
  + import { Dialog } from "@/components/ui/dialog";
  ```
- chat-4 College Course Tabs gap closure > COL-course-tabs-04 protects current Course Tabs controls while legacy work remains

  ```
  AssertionError: expected '"use client";\nimport {Checkbox} from…' to contain 'Create New Assignment'
  - Expected
  + Received
  - Create New Assignment
  + "use client";
  + import {Checkbox} from "@/components/ui/checkbox";
  +
  + import {useMemo,useRef,useState} from "react";
  ```
- chat-4 College Course Tabs gap closure > COL-course-tabs-14 protects current Course Tabs controls while legacy work remains

  ```
  AssertionError: expected '"use client";\n\nimport { useEffect, …' to contain 'Lesson order updated'
  - Expected
  + Received
  - Lesson order updated
  + "use client";
  +
  + import { useEffect, useRef, useState, useTransition } from "react";
  + import { useRouter } from "next/navigation";
  ```
- chat-4 College Course Tabs gap closure > COL-course-tabs-18 protects current Course Tabs controls while legacy work remains

  ```
  AssertionError: expected 'import { Input } from "@/components/u…' to contain 'Course code (exact)'
  - Expected
  + Received
  - Course code (exact)
  + import { Input } from "@/components/ui/input";
  + import { Button } from "@/components/ui/button";
  + import { Select } from "@/components/ui/select";
  + import Link from "next/link";
  ```

## tests/unit/chat4-college-ux-round1.test.ts (4 failing)
- Chat-4 College UX round one > UX-college-01 preserves narrow-screen content and 44px navigation targets

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'min-w-0 overflow-x-clip space-y'
  - Expected
  + Received
  - min-w-0 overflow-x-clip space-y
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { CollegeEditDialog } from "@/components/admin/college-edit-dialog";
  + import { CollegeSetupChecklist } from "@/components/admin/college-setup-checklist";
  ```
- Chat-4 College UX round one > UX-college-academics-01 preserves narrow-screen content and 44px navigation targets

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'min-h-11'
  - Expected
  + Received
  - min-h-11
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { AcademicsOverview } from "@/components/academics/academics-overview";
  + import { PageHeader } from "@/components/ui/page-header";
  ```
- Chat-4 College UX round one > UX-college-activity-01 preserves narrow-screen content and 44px navigation targets

  ```
  AssertionError: expected 'import { DateInput } from "@/componen…' to contain 'min-w-0 overflow-x-clip space-y'
  - Expected
  + Received
  - min-w-0 overflow-x-clip space-y
  + import { DateInput } from "@/components/ui/date-input";
  + import { Select } from "@/components/ui/select";
  + import { Input } from "@/components/ui/input";
  + import Link from "next/link";
  ```
- Chat-4 College UX round one > UX-college-activity-eventId-01 preserves narrow-screen content and 44px navigation targets

  ```
  AssertionError: expected 'import { PageBackLink } from "@/compo…' to contain 'min-h-11'
  - Expected
  + Received
  - min-h-11
  + import { PageBackLink } from "@/components/ui/page-back-link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { StatusBadge } from "@/components/ui/status-badge";
  ```

## tests/unit/chat4-public-college-signin-policy-behaviour.test.ts (1 failing)
- Public host-derived college sign-in policy behaviour > SA-tenants-public-signin-03 corrupted stored method fails closed instead of falling back to BOTH

  ```
  AssertionError: promise resolved "'EMAIL_AND_PHONE'" instead of rejecting
  - Expected:
  Error {
  "message": "rejected promise",
  }
  + Received:
  "EMAIL_AND_PHONE"
  ```
