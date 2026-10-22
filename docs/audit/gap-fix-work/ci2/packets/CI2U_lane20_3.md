# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/UX-college-resources-states-01.test.ts (1 failing)
- UX /college/resources loading, error and retry > UX-college-resources-loading-01 reserves shared directory rows

  ```
  AssertionError: expected 'import { PageHeader } from "@/compone…' to contain 'shape="directory"'
  - Expected
  + Received
  - shape="directory"
  + import { PageHeader } from "@/components/ui/page-header";
  + export default function CollegeResourcesLoading(){
  +  return <section className="min-w-0 space-y-4" aria-busy="true" aria-label="Loading resources">
  +   <PageHeader title="Resources"
  ```

## tests/unit/UX-coverage-closure-chat17.test.ts (5 failing)
- chat-17 UX-coverage-closure-01 owned route contracts > UX-teacher-allAssignments-coverage-02 maintains authorized route, safe actions and recovery

  ```
  AssertionError: expected 'import { assignmentFilesRuntimeEnable…' to match /PageHeader|FacultyCourseWorkspace|Fac…/
  - Expected:
  /PageHeader|FacultyCourseWorkspace|FacultyCourseList|redirect\(/
  + Received:
  "import { assignmentFilesRuntimeEnabled } from \"@/modules/courses/assignment-file-readiness\";
  import { getCurrentRequestContext } from \"@/auth/request-context\";
  import {RetainedFacultyAssignments} from \"@/components/courses/faculty-assignments-retention\";
  import { getFacultyAssessmentOverview } from \"@/modules/courses/faculty-assessment-service\";
  ```
- chat-17 UX-coverage-closure-01 owned route contracts > UX-company-share-token-coverage-02 maintains authorized route, safe actions and recovery

  ```
  AssertionError: expected 'import authStyles from "@/components/…' not to match /target\s*=\s*["']_blank["']/
  - Expected:
  /target\s*=\s*["']_blank["']/
  + Received:
  "import authStyles from \"@/components/public/public-auth-skin.module.css\";
  import Link from \"next/link\";
  import { Button } from \"@/components/ui/button\";
  import { DataTable, type DataTableColumn } from \"@/components/ui/data-table\";
  ```
- chat-17 UX-coverage-closure-01 owned route contracts > UX-e2e-superadmin-login-coverage-02 maintains authorized route, safe actions and recovery

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'redirect("/")'
  - Expected
  + Received
  - redirect("/")
  + import Link from "next/link";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { isSuperAdmin } from "@/modules/identity/context";
  ```
- chat-17 UX-coverage-closure-01 owned route contracts > UX-privacy-policy-coverage-02 maintains authorized route, safe actions and recovery

  ```
  AssertionError: expected 'import type { Metadata } from "next";…' to contain 'redirect("/assets/static/privacy-poli…'
  - Expected
  + Received
  - redirect("/assets/static/privacy-policy-view.html")
  + import type { Metadata } from "next";
  + import { readFile } from "node:fs/promises";
  + import { join } from "node:path";
  +
  ```
- chat-17 UX-coverage-closure-01 owned route contracts > UX-request-demo-coverage-02 maintains authorized route, safe actions and recovery

  ```
  AssertionError: expected 'import type { Metadata } from "next";…' to contain 'mailto:hello@42lms.com'
  - Expected
  + Received
  - mailto:hello@42lms.com
  + import type { Metadata } from "next";
  + import { MarketingLayout } from "@/components/marketing/marketing-layout";
  +
  + const SITE = "https://42lms.com";
  ```

## tests/unit/UX-mentor-cross-board-safety-01.test.ts (1 failing)
- Mentor board external links and modal focus > UX-mentor-cross-B05 task detail restores focus and handles Escape

  ```
  AssertionError: expected '"use client";\nimport { Banner } from…' to contain 'opener.current?.focus()'
  - Expected
  + Received
  - opener.current?.focus()
  + "use client";
  + import { Banner } from "@/components/ui/banner";
  + import { Dialog } from "@/components/ui/dialog";
  + import Link from "next/link";
  ```

## tests/unit/UX-recruiter-01.test.ts (1 failing)
- UX-recruiter-01 > preserves role-safe navigation, exact route copy and accessible shared surface

  ```
  AssertionError: expected 'import {redirect} from "next/navigati…' to contain 'redirect("/hr/home")'
  - Expected
  + Received
  - redirect("/hr/home")
  + import {redirect} from "next/navigation";
  + /** Preserve the legacy recruiter entrypoint while using the canonical Today workspace. */
  + export default function RecruiterIndex(){redirect("/recruiter/home");}
  +
  ```

## tests/unit/UX-teacher-courses-deliveryid-discussions-coverage-01.test.ts (1 failing)
- UX-teacher-courses-deliveryid-discussions-01 /teacher/courses/[deliveryId]/discussions enforces page access and feedback contracts

  ```
  AssertionError: expected 'import { getCurrentRequestContext } f…' to contain '<PageHeader\n        eyebrow="Faculty…'
  - Expected
  + Received
  - <PageHeader
  -         eyebrow="Faculty · Course"
  -         title="Discussions"
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { LearnerCourseDiscussion } from "@/components/courses/learner-course-discussion";
  ```

## tests/unit/UX-teacher-quiz-builder-selection-controls.test.ts (1 failing)
- Quiz builder checkbox semantics > UX-teacher-courses-deliveryId-quizzes-manage-10 uses signed-off Checkbox controls with all existing labels

  ```
  AssertionError: expected '"use client";\nimport { Radio } from …' to contain 'type={question.type==="SINGLE_CHOICE"…'
  - Expected
  + Received
  - type={question.type==="SINGLE_CHOICE"?"radio":"checkbox"}
  + "use client";
  + import { Radio } from "@/components/ui/radio";
  + import { Checkbox as NativeCheckbox } from "@/components/ui/checkbox";
  + import {useRef,useState} from "react";
  ```
