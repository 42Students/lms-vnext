# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/UX-college-placements-drives-01.test.ts (1 failing)
- /college/placements/drives UX > UX-college-placements-drives-01 preserves the new accessible state and responsive contract

  ```
  AssertionError: expected 'import { DateInput } from "@/componen…' to contain 'caption="College placement drives"'
  - Expected
  + Received
  - caption="College placement drives"
  + import { DateInput } from "@/components/ui/date-input";
  + import { Select } from "@/components/ui/select";
  + import Link from "next/link";
  + import { redirect } from "next/navigation";
  ```

## tests/unit/UX-college-semester-courses-states-01.test.ts (3 failing)
- UX /college/semester-courses loading, error and retry > UX-college-semester-courses-loading-01 reserves shared directory rows

  ```
  AssertionError: expected 'import { PageHeader } from "@/compone…' to contain 'shape="directory"'
  - Expected
  + Received
  - shape="directory"
  + import { PageHeader } from "@/components/ui/page-header";
  +
  + /** Matches legacy SemesterCourseMapping TableSkeleton (six columns/rows). */
  + export default function SemesterCoursesLoading() {
  ```
- UX /college/semester-courses loading, error and retry > UX-college-semester-courses-loading-02 announces the exact route loading label

  ```
  AssertionError: expected 'import { PageHeader } from "@/compone…' to contain 'Loading course mappings'
  - Expected
  + Received
  - Loading course mappings
  + import { PageHeader } from "@/components/ui/page-header";
  +
  + /** Matches legacy SemesterCourseMapping TableSkeleton (six columns/rows). */
  + export default function SemesterCoursesLoading() {
  ```
- UX /college/semester-courses loading, error and retry > UX-college-semester-courses-error-02 offers a shared retry control

  ```
  AssertionError: expected '"use client";\nimport { PageHeader } …' to contain '<Button type="button" variant="second…'
  - Expected
  + Received
  - <Button type="button" variant="secondary" onClick={reset}>Retry</Button>
  + "use client";
  + import { PageHeader } from "@/components/ui/page-header";
  + import {Button} from "@/components/ui/button";
  + import {ErrorState} from "@/components/ui/error-state";
  ```

## tests/unit/UX-group-import-preview-table-chat17.test.ts (1 failing)
- UX-UNOWNED-TABLE-09 college group bulk import preview > retains validation statuses, row/email fields and safe download after migrating to mobile table

  ```
  AssertionError: expected '"use client";\nimport { FileUpload } …' to contain '131072'
  - Expected
  + Received
  - 131072
  + "use client";
  + import { FileUpload } from "@/components/ui/file-upload";
  + import { Textarea } from "@/components/ui/textarea";
  + import { Select } from "@/components/ui/select";
  ```

## tests/unit/UX-mentor-cross-meeting-drafts-01.test.ts (2 failing)
- Mentor meeting editors preserve drafts and safe errors > UX-mentor-cross-F01 notes cancellation returns to the draft and confirms discard

  ```
  AssertionError: expected '"use client";\nimport { Textarea } fr…' to contain 'if(!next&&!pending)setOpen(true)'
  - Expected
  + Received
  - if(!next&&!pending)setOpen(true)
  + "use client";
  + import { Textarea } from "@/components/ui/textarea";
  + import {useState} from "react";
  + import {useRouter} from "next/navigation";
  ```
- Mentor meeting editors preserve drafts and safe errors > UX-mentor-cross-F02 reschedule has the same discard and retry protection

  ```
  AssertionError: expected '"use client";\nimport {useId,useState…' to contain 'if(!next&&!pending)setOpen(true)'
  - Expected
  + Received
  - if(!next&&!pending)setOpen(true)
  + "use client";
  + import {useId,useState} from "react";
  + import {useRouter} from "next/navigation";
  + import {Button} from "@/components/ui/button";
  ```

## tests/unit/UX-recruiter-invite-token-01.test.ts (2 failing)
- UX-recruiter-invite-token-01 recruiter invitation > renders shared phone-first Card, Input, Skeleton and Button plus focusable friendly errors

  ```
  AssertionError: expected '"use client";\n\nimport authStyles fr…' to contain '<InlineNotice tone="error" message={a…'
  - Expected
  + Received
  - <InlineNotice tone="error" message={actionError}
  + "use client";
  +
  + import authStyles from "@/components/public/public-auth-skin.module.css";
  + import { PageHeader } from "@/components/ui/page-header";
  ```
- UX-recruiter-invite-token-01 recruiter invitation > keeps a bounded route skeleton and home-safe failure route

  ```
  AssertionError: expected 'import { PublicPageLoading } from "@/…' to contain '<GracefulPageLoading'
  - Expected
  + Received
  - <GracefulPageLoading
  + import { PublicPageLoading } from "@/components/public/public-page-loading";
  +
  + export default function Loading() {
  +   return <PublicPageLoading label="Loading recruiter invitation..." />;
  ```

## tests/unit/UX-teacher-gradebook-limit-chat3.test.ts (1 failing)
- UX-teacher-gradebook-limit-chat3: Faculty error and recovery > FAC-attendance-grades-01 denies forged filter selectors before gradebook read

  ```
  AssertionError: expected 'import { Pagination } from "@/compone…' to contain 'knownKeys?rawSearch:{invalid:true}'
  - Expected
  + Received
  - knownKeys?rawSearch:{invalid:true}
  + import { Pagination } from "@/components/ui/pagination";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { Input } from "@/components/ui/input";
  + import {Button} from "@/components/ui/button";
  ```
