# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat7-learner-discussion-revocation-races.test.ts (2 failing)
- LEARNER-DISCUSSIONS-RACE-01 recheck learner role at write commit > persists an active learner post and its activity within the same transaction

  ```
  AssertionError: expected "vi.fn()" to be called 1 times, but got 2 times
  ❯ tests/unit/chat7-learner-discussion-revocation-races.test.ts:65:26
  63|   const message=await createCourseDiscussionMessage(context,deliveryId…
  64|   expect(message.id).toBe(messageId);
  65|   expect(state.txSelect).toHaveBeenCalledTimes(1);
  |                          ^
  66|   expect(state.txInsert).toHaveBeenCalledTimes(1);
  67|   expect(state.event).toHaveBeenCalledTimes(1);
  ```
- LEARNER-DISCUSSIONS-RACE-01 recheck learner role at write commit > allows own unpinned post deletion only with the locked active learner grant

  ```
  TypeError: tx.update is not a function
  ❯ src/modules/courses/discussion-service.ts:606:32
  604|     // Normal history hides deleted rows; delta reads return only the …
  605|     // tombstone, never the retained body, sender identity or attribut…
  606|     const [deleted] = await tx.update(courseDiscussionMessages).set({
  |                                ^
  607|       deletedAt: sql`greatest(now(), ${courseDiscussionMessages.create…
  608|       pinned: false,
  ```

## tests/unit/chat7-round2-faculty-01.test.ts (3 failing)
- chat-7 faculty course listing and roster contracts > FAC-courses-01 faculty course back-link has legacy label and destination

  ```
  AssertionError: expected '"use client";\nimport { Select } from…' to contain 'Back to courses'
  - Expected
  + Received
  - Back to courses
  + "use client";
  + import { Select } from "@/components/ui/select";
  + import { Tabs } from "@/components/ui/tabs";
  + import Link from "next/link";
  ```
- chat-7 faculty course listing and roster contracts > FAC-courses-04 only secondary teaching roles show role badge

  ```
  AssertionError: expected 'import { Badge } from "@/components/u…' to contain 'course.teachingRole!=="PRIMARY"'
  - Expected
  + Received
  - course.teachingRole!=="PRIMARY"
  + import { Badge } from "@/components/ui/badge";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import Link from "next/link";
  + import {FacultyCourseCover} from "./faculty-course-cover";
  ```
- chat-7 faculty course listing and roster contracts > FAC-courses-05 course list exposes assignment and section metrics

  ```
  AssertionError: expected 'import { Badge } from "@/components/u…' to contain 'Teaching assignment(s)'
  - Expected
  + Received
  - Teaching assignment(s)
  + import { Badge } from "@/components/ui/badge";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import Link from "next/link";
  + import {FacultyCourseCover} from "./faculty-course-cover";
  ```

## tests/unit/chat7-superadmin-courses-content-model-matrix.test.ts (2 failing)
- Super Admin Courses and Content model behaviour and legacy-safe URLs > SA-academics-people-61 content filters reject foreign ids, arrays and unbounded paging

  ```
  AssertionError: expected 3 to be 2 // Object.is equality
  - Expected
  + Received
  - 2
  + 3
  ```
- Super Admin Courses and Content model behaviour and legacy-safe URLs > SA-academics-people-62 never renders old unsafe media links

  ```
  AssertionError: expected 'YouTube' to be 'YouTube Video' // Object.is equality
  Expected: "YouTube Video"
  Received: "YouTube"
  ```

## tests/unit/chat9-college-projects-contracts-round8.test.ts (5 failing)
- chat9 college projects scope and persistence contracts > COL-projects-06 previews per-learner cohort creation and confirms exact count before writing

  ```
  AssertionError: expected '"use client";\nimport { EmptyState } …' to contain 'window.confirm("Create "+currentPrefl…'
  - Expected
  + Received
  - window.confirm("Create "+currentPreflight.toCreate+
  + "use client";
  + import { EmptyState } from "@/components/ui/empty-state";
  + import { useEffect, useRef, useState } from "react";
  + import { useRouter } from "next/navigation";
  ```
- chat9 college projects scope and persistence contracts > COL-projects-07 enforces a mentor for ACTIVE creation and permits scoped class roster choices

  ```
  AssertionError: expected '"use client";\n\nimport { type FormEv…' to contain 'value="ACTIVE" disabled={!mentorMembe…'
  - Expected
  + Received
  - value="ACTIVE" disabled={!mentorMembershipId}
  + "use client";
  +
  + import { type FormEvent, useEffect, useRef, useState } from "react";
  + import { useRouter } from "next/navigation";
  ```
- chat9 college projects scope and persistence contracts > COL-projects-12 restricts readiness overrides by current college and provides actual export

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain 'This workspace belongs to a different…'
  - Expected
  + Received
  - This workspace belongs to a different college
  + import { EmptyState } from "@/components/ui/empty-state";
  + import { Badge } from "@/components/ui/badge";
  + import {getProjectReadiness} from "@/modules/projects/readiness-service";
  + import {ProjectReadinessOverrideForm} from "./project-readiness-override-form";
  ```
- chat9 college projects scope and persistence contracts > COL-projects-13 exposes persisted review status, revision count and direct review action

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain 'Math.max(0,submission.version-1)'
  - Expected
  + Received
  - Math.max(0,submission.version-1)
  + import { EmptyState } from "@/components/ui/empty-state";
  + import Link from "next/link";
  + import { safeProjectExternalHref } from "@/modules/projects/mentor-workspace-evidence-model";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```
- chat9 college projects scope and persistence contracts > COL-projects-15 replaces a learner roster atomically with scoped active memberships and version checks

  ```
  AssertionError: expected '"use client";\n\nimport {useRef,useSt…' to contain 'confirmLabel="Replace roster"'
  - Expected
  + Received
  - confirmLabel="Replace roster"
  + "use client";
  +
  + import {useRef,useState} from "react";
  + import {useRouter} from "next/navigation";
  ```

## tests/unit/chat9-project-team-roster-replacement.test.ts (3 failing)
- College Admin atomic Team roster replacement > COL-projects-15 accepts a distinct checked learner roster and preserves optional role labels

  ```
  AssertionError: expected { Object (learnerMembershipIds, roleLabel, ...) } to deeply equal { Object (learnerMembershipIds, roleLabel, ...) }
  - Expected
  + Received
  @@ -2,7 +2,8 @@
  "expectedUpdatedAt": "2099-01-02T12:30:00.000Z",
  "learnerMembershipIds": [
  "11111111-1111-4111-8111-111111111111",
  "22222222-2222-4222-8222-222222222222",
  ```
- College Admin atomic Team roster replacement > COL-projects-15 rejects duplicate, invalid or unbounded learner membership input

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```
- College Admin atomic Team roster replacement > COL-projects-15 uses one transaction for add and remove, rejects class-managed rosters and audits every change

  ```
  AssertionError: expected '"use client";\n\nimport {useRef,useSt…' to contain 'Learners updated'
  - Expected
  + Received
  - Learners updated
  + "use client";
  +
  + import {useRef,useState} from "react";
  + import {useRouter} from "next/navigation";
  ```

## tests/unit/chat9-super-admin-unselected-college-copy.test.ts (5 failing)
- Super Admin exact dev-legacy unselected-college copy > departments exact copy

  ```
  AssertionError: expected 'import { AcademicSetupSteps } from "@…' to contain 'title="Select a college to continue"'
  - Expected
  + Received
  - title="Select a college to continue"
  + import { AcademicSetupSteps } from "@/components/admin/academic-setup-steps";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { DepartmentCreateForm } from "@/components/admin/department-create-form";
  + import { DepartmentDirectory } from "@/components/admin/department-directory";
  ```
- Super Admin exact dev-legacy unselected-college copy > programs exact copy

  ```
  AssertionError: expected 'import { AcademicSetupSteps } from "@…' to contain 'title="Select a college to continue"'
  - Expected
  + Received
  - title="Select a college to continue"
  + import { AcademicSetupSteps } from "@/components/admin/academic-setup-steps";
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {isSuperAdmin} from "@/modules/identity/context";
  ```
- Super Admin exact dev-legacy unselected-college copy > courses exact copy

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'title="Select a college to continue"'
  - Expected
  + Received
  - title="Select a college to continue"
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {listSuperAdminGlobalCourses} from "@/modules/courses/super-admin-global-course-directory";
  + import { AdminCourseOverview } from "@/components/courses/admin-course-overview";
  ```
- Super Admin exact dev-legacy unselected-college copy > lessons exact copy

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'title="Select a college to continue"'
  - Expected
  + Received
  - title="Select a college to continue"
  + import Link from "next/link";
  + import { Button } from "@/components/ui/button";
  + import { Input } from "@/components/ui/input";
  + import { Select } from "@/components/ui/select";
  ```
- Super Admin exact dev-legacy unselected-college copy > lecture-halls exact copy

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'description="Choose a college in the …'
  - Expected
  + Received
  - description="Choose a college in the header above to see its lecture halls."
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {requireSuperAdminSelectedCollege} from "@/modules/admin-ui/super-admin-selected-college";
  + import { LectureHallManager } from "@/components/admin/lecture-hall-manager";
  ```
