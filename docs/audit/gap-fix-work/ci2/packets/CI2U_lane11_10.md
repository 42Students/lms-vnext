# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat7-learner-course-list-model-coverage.test.ts (1 failing)
- chat-7 learner course discovery/list behavioural matrix > UX-learn-courses-tab-query-11 excludes selection-only keys and rejects oversized values

  ```
  AssertionError: expected null to be 'x' // Object.is equality
  - Expected:
  "x"
  + Received:
  null
  ```

## tests/unit/chat7-project-task-comments-legacy-copy.test.ts (1 failing)
- Mentor and Learner 0090 task comments exact legacy copy > uses TaskDetailsModal dev comment labels, empty and button strings

  ```
  AssertionError: expected '"use client";\nimport {useEffect,useS…' to contain 'Notes and progress updates people on …'
  - Expected
  + Received
  - Notes and progress updates people on this task have written.
  + "use client";
  + import {useEffect,useState} from "react";
  + import {useRouter} from "next/navigation";
  + import {Button} from "@/components/ui/button";
  ```

## tests/unit/chat7-superadmin-course-bulk-typed-boundaries.test.ts (3 failing)
- SA-academics-people-53 scoped bulk course visibility and recoverable input errors > returns typed 400-class size conflict before opening any content mutation

  ```
  AssertionError: expected TypeError: (0 , __vite_ssr_import_3__.get… to match object { name: 'CoursesServiceError', …(1) }
  - Expected
  + Received
  - {
  -   "code": "COURSE_VISIBILITY_BULK_TOO_LARGE",
  -   "name": "CoursesServiceError",
  + TypeError {
  +   "message": "(0 , __vite_ssr_import_3__.getDb)(...).transaction is not a function",
  ```
- SA-academics-people-53 scoped bulk course visibility and recoverable input errors > executes only selected scoped lessons and returns precise partial success totals

  ```
  TypeError: getDb(...).transaction is not a function
  ❯ Module.bulkSuperAdminCourseVisibility src/modules/courses/super-admin-course-bulk-visibility.ts:122:16
  120|  // The prior per-lesson activity trail remains the authoritative row …
  121|  // Do not replace a partial result with a misleading "100 updated" me…
  122|  await getDb().transaction(async tx=>{
  |                ^
  123|   await assertPersistedPlatformPermission(tx,context,"courses.manage",{
  124|    collegeId:acting.collegeId,organizationId:acting.organizationId,
  ```
- SA-academics-people-53 scoped bulk course visibility and recoverable input errors > keeps per-course retry IDs when published content updates fail

  ```
  TypeError: getDb(...).transaction is not a function
  ❯ Module.bulkSuperAdminCourseVisibility src/modules/courses/super-admin-course-bulk-visibility.ts:122:16
  120|  // The prior per-lesson activity trail remains the authoritative row …
  121|  // Do not replace a partial result with a misleading "100 updated" me…
  122|  await getDb().transaction(async tx=>{
  |                ^
  123|   await assertPersistedPlatformPermission(tx,context,"courses.manage",{
  124|    collegeId:acting.collegeId,organizationId:acting.organizationId,
  ```

## tests/unit/chat9-college-navigation-contract.test.ts (2 failing)
- legacy College Admin full sidebar + group href contract > has the correct placements tabs and only one College Projects strip

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
- legacy College Admin full sidebar + group href contract > links all six formerly orphaned pages from an authorized College page

  ```
  AssertionError: college/attendance/page.tsx: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```

## tests/unit/chat9-phase2-college-shortlist-recovery.test.ts (1 failing)
- College Admin shortlist page recovery > recovers a stale bookmark only after an authorized scoped read

  ```
  AssertionError: expected -1 to be greater than 0
  ❯ tests/unit/chat9-phase2-college-shortlist-recovery.test.ts:18:19
  16|     const scopedRead=src.indexOf("listCollegeDriveApplications(context…
  17|     const recovery=src.indexOf("query.page>data.totalPages");
  18|     expect(guard).toBeGreaterThan(0);
  |                   ^
  19|     expect(scopedRead).toBeGreaterThan(guard);
  20|     expect(recovery).toBeGreaterThan(scopedRead);
  ```

## tests/unit/chat9-super-admin-orphan-routes.test.ts (1 failing)
- Super Admin sidebar consolidation retains orphan routes > keeps domains, academics overview and audit findings reachable

  ```
  AssertionError: expected 'import { AcademicSetupSteps } from "@…' to contain 'href="/admin/academics"'
  - Expected
  + Received
  - href="/admin/academics"
  + import { AcademicSetupSteps } from "@/components/admin/academic-setup-steps";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { DepartmentCreateForm } from "@/components/admin/department-create-form";
  + import { DepartmentDirectory } from "@/components/admin/department-directory";
  ```
