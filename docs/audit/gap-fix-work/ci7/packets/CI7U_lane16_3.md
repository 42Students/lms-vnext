# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat6-superadmin-course-catalogue-round4.test.ts (3 failing)
- chat-6 Super Admin selected-college course directory parity > SA-academics-people-54 supports search sort pagination and route-correct actions

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'catalogueQuery={catalogueQuery.data}'
  - Expected
  + Received
  - catalogueQuery={catalogueQuery.data}
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {listSuperAdminGlobalCourses} from "@/modules/courses/super-admin-global-course-directory";
  + import { AdminCourseOverview } from "@/components/courses/admin-course-overview";
  ```
- chat-6 Super Admin selected-college course directory parity > SA-academics-people-74 counts lesson dependencies only in the selected college and preflights archive

  ```
  AssertionError: expected '"use client";\n\nimport Link from "ne…' to contain 'confirmDisabled={activeOfferingCount>…'
  - Expected
  + Received
  - confirmDisabled={activeOfferingCount>0}
  + "use client";
  +
  + import Link from "next/link";
  + import Image from "next/image";
  ```
- chat-6 Super Admin selected-college course directory parity > SA-academics-people-62 shows scoped student visibility and lesson ordering with safe external links

  ```
  AssertionError: expected 'import { Banner } from "@/components/…' to contain 'Students {studentContentVisible(item)?'
  - Expected
  + Received
  - Students {studentContentVisible(item)?
  + import { Banner } from "@/components/ui/banner";
  + import Link from "next/link";
  + import { Input } from "@/components/ui/input";
  + import { Select } from "@/components/ui/select";
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

## tests/unit/chat9-final-LEARNER-course-detail-07.test.ts (1 failing)
- chat-9 final sprint > LEARNER-course-detail-07 preserves verified functionality and safe failure states

  ```
  AssertionError: expected '"use client";\nimport { Input } from …' to contain 'Materials ({materials.length}/20)'
  - Expected
  + Received
  - Materials ({materials.length}/20)
  + "use client";
  + import { Input } from "@/components/ui/input";
  + import { Textarea } from "@/components/ui/textarea";
  +
  ```

## tests/unit/college-export-cap-messages.test.ts (3 failing)
- College Admin export cap disclosures > Electives export UI discloses the same bounded cap as the exporter

  ```
  AssertionError: expected 'import { collegeDirectoryValidationMe…' to contain 'flex flex-wrap items-center gap-3'
  - Expected
  + Received
  - flex flex-wrap items-center gap-3
  + import { collegeDirectoryValidationMessage } from "@/modules/academics/college-directory-validation";
  + import Link from "next/link";
  + import {isSuperAdmin} from "@/modules/identity/context";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```
- College Admin export cap disclosures > Semesters export UI discloses the same bounded cap as the exporter

  ```
  AssertionError: expected 'import { collegeDirectoryValidationMe…' to contain 'flex flex-wrap items-center gap-3'
  - Expected
  + Received
  - flex flex-wrap items-center gap-3
  + import { collegeDirectoryValidationMessage } from "@/modules/academics/college-directory-validation";
  + import Link from "next/link";
  + import { Banner } from "@/components/ui/banner";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```
- College Admin export cap disclosures > Batches export UI discloses the same bounded cap as the exporter

  ```
  AssertionError: expected 'import { collegeDirectoryValidationMe…' to contain 'flex flex-wrap items-center gap-3'
  - Expected
  + Received
  - flex flex-wrap items-center gap-3
  + import { collegeDirectoryValidationMessage } from "@/modules/academics/college-directory-validation";
  + import Link from "next/link";
  + import {isSuperAdmin} from "@/modules/identity/context";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```
