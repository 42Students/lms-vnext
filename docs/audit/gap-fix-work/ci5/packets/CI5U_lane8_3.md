# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat4-people-contacts-ledger.test.ts (1 failing)
- chat-4 college people/contact privacy and directory coverage > collegeContactsQuerySchema and parser reject duplicated, unknown, tenant forged, malformed page and alphabet

  ```
  AssertionError: expected [Function] to throw an error
  ❯ tests/unit/chat4-people-contacts-ledger.test.ts:48:57
  46|       {joinedFrom:"2099-06-01",joinedThrough:"2099-05-31"},{tab:"STUDE…
  47|       {teaching:"NONE",teachingRole:"PRIMARY"}])
  48|       expect(()=>parseCollegeContactsSearchParams(bad)).toThrow();
  |                                                         ^
  49|   });
  50|   it("contact compatibility helpers reject contradictory tabs, enrolme…
  ```

## tests/unit/chat5-final-faculty-discussion.test.ts (1 failing)
- chat-5 final sprint: Faculty course discussions > FAC-courses-R06 preserves latest successfully fetched discussion messages and exposes retry on refresh failure even when posting permission is revoked

  ```
  AssertionError: expected '"use client";\nimport { Alert } from …' to contain 'Discussion refresh failed. Could not …'
  - Expected
  + Received
  - Discussion refresh failed. Could not refresh the discussion. Showing the last messages we loaded.
  + "use client";
  + import { Alert } from "@/components/ui/alert";
  +
  +
  ```

## tests/unit/chat6-college-dashboard-graceful-round3.test.ts (3 failing)
- College Admin dashboard graceful degradation > COL-dashboard-10 isolates dashboard data sources with independent failed card states

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'CollegeDashboardSectionFailure title=…'
  - Expected
  + Received
  - CollegeDashboardSectionFailure title="Closing quizzes"
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { CollegeEditDialog } from "@/components/admin/college-edit-dialog";
  + import { CollegeSetupChecklist } from "@/components/admin/college-setup-checklist";
  ```
- College Admin dashboard graceful degradation > GR-70 and GR-72 preserve primary cards when one secondary dashboard source fails

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain '{pendingGrades?<>'
  - Expected
  + Received
  - {pendingGrades?<>
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { CollegeEditDialog } from "@/components/admin/college-edit-dialog";
  + import { CollegeSetupChecklist } from "@/components/admin/college-setup-checklist";
  ```
- College Admin dashboard graceful degradation > GR-90 and GR-91 render a keyboard retry and alert rather than false zeroes

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'role="alert"'
  - Expected
  + Received
  - role="alert"
  + import Link from "next/link";
  + import { ErrorState } from "@/components/ui/error-state";
  +
  + /** A failed secondary College Admin query never masquerades as an empty result. */
  ```

## tests/unit/chat6-independent-finding-actions-round10.test.ts (1 failing)
- Independent audit finding action workflow > SA-placements-projects-121 records version-checked finding edits and reason-required terminal statuses

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```

## tests/unit/chat6-superadmin-middle-third-adversarial.test.ts (3 failing)
- Chat-6 /admin middle-third read and application correctness > SA-admin-middle-applications-filters-02 rejects wrong-shape and cross-tenant filter IDs before querying

  ```
  AssertionError: expected { q: '', status: 'ALL', …(8) } to be null
  - Expected:
  null
  + Received:
  {
  "attention": "ALL",
  "page": 1,
  "q": "",
  ```
- Chat-6 /admin middle-third read and application correctness > SA-admin-middle-placements-settings-01 uses IST for an instant near midnight rather than UTC calendar day

  ```
  AssertionError: expected 'import {SuperAdminDriveDeadline} from…' to contain 'timeZone:"Asia/Kolkata"'
  - Expected
  + Received
  - timeZone:"Asia/Kolkata"
  + import {SuperAdminDriveDeadline} from "@/components/placements/super-admin-drive-deadline";
  + import {SuperAdminDriveDuplicate} from "@/components/placements/super-admin-drive-duplicate";
  + import {SuperAdminDriveArchive} from "@/components/placements/super-admin-drive-archive";
  + import {SuperAdminPublishedDriveEdit} from "@/components/placements/super-admin-published-drive-edit";
  ```
- Chat-6 /admin middle-third read and application correctness > SA-admin-middle-read-04 rejects missing college selection before rendering candidate-level data

  ```
  AssertionError: expected 'import { Select } from "@/components/…' to contain 'EmptyState title="Select a college to…'
  - Expected
  + Received
  - EmptyState title="Select a college to continue"
  + import { Select } from "@/components/ui/select";
  + import { Input } from "@/components/ui/input";
  + import { Button } from "@/components/ui/button";
  + import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
  ```

## tests/unit/chat7-learner-assessment-discussion-policy-matrix.test.ts (1 failing)
- COURSES-LEARNER-DISCUSSIONS-02 learner discussion draft and scoped response > rejects empty, oversized or double-submitted drafts regardless of click/keyboard origin

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```

## tests/unit/chat7-legacy-learner-courses-copy.test.ts (1 failing)
- legacy Learner My Courses copy — legacy-copy-A course listing and Header > uses legacy Back to courses wording in the course workspace and recovery pages

  ```
  AssertionError: expected 'import { Banner } from "@/components/…' not to contain 'Back to Courses'
  - Expected
  + Received
  - Back to Courses
  + import { Banner } from "@/components/ui/banner";
  + import { CoursesServiceError } from "@/modules/courses/errors";
  + import { AuthorizationError } from "@/modules/permissions/policy";
  + import { ZodError } from "zod";
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
