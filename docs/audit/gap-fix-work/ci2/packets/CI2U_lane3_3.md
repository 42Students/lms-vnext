# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/UX-college-people-01.test.ts (2 failing)
- /college/people UX > UX-college-people-01 retains safe route or shared-workspace UX

  ```
  AssertionError: expected 'import CollegeContactsPage from "../c…' to contain 'redirect("/college/contacts")'
  - Expected
  + Received
  - redirect("/college/contacts")
  + import CollegeContactsPage from "../contacts/page";
  +
  + /** Keep the historical /college-admin/people destination on the canonical
  +  * college workspace URL. The old shared directory maps to role-specific
  ```
- /college/people UX > UX-college-people-02 retains safe route or shared-workspace UX

  ```
  AssertionError: expected 'import CollegeContactsPage from "../c…' to contain 'Legacy People Directory'
  - Expected
  + Received
  - Legacy People Directory
  + import CollegeContactsPage from "../contacts/page";
  +
  + /** Keep the historical /college-admin/people destination on the canonical
  +  * college workspace URL. The old shared directory maps to role-specific
  ```

## tests/unit/UX-college-scroll-motion-01.test.ts (1 failing)
- UX-college-scroll-motion-01 hidden scrollbars retain honest cues > directory wide table has a keyboard-reachable responsive edge cue

  ```
  AssertionError: expected 'import { Select } from "@/components/…' to contain 'import { ScrollCue } from "@/componen…'
  - Expected
  + Received
  - import { ScrollCue } from "@/components/ui/scroll-cue"
  + import { Select } from "@/components/ui/select";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { Input } from "@/components/ui/input";
  + import { Button } from "@/components/ui/button";
  ```

## tests/unit/UX-dense-grids-chat17.test.ts (2 failing)
- UX-UNOWNED-DENSE-GRID-05 semantic grid exceptions > TPO spreadsheet has semantic desktop table AND mobile row disclosure with same selection actions

  ```
  AssertionError: expected '"use client";\nimport {Checkbox} from…' to contain '<ScrollCue axis="x" label="TPO spread…'
  - Expected
  + Received
  - <ScrollCue axis="x" label="TPO spreadsheet columns"
  + "use client";
  + import {Checkbox} from "@/components/ui/checkbox";
  + import {FilterChip} from "@/components/ui/filter-chip";
  + import {Button} from "@/components/ui/button";
  ```
- UX-UNOWNED-DENSE-GRID-05 semantic grid exceptions > college attendance month grid retains each scheduled-day column and per-learner correction controls

  ```
  AssertionError: expected '"use client";\n\nimport { ADMIN_ATTEN…' to contain '<ScrollCue axis="x" label="College at…'
  - Expected
  + Received
  - <ScrollCue axis="x" label="College attendance monthly grid"
  + "use client";
  +
  + import { ADMIN_ATTENDANCE_COPY } from "@/modules/attendance/admin-attendance-copy";
  + import {AdminAttendanceParentContactEditor} from "./admin-attendance-parent-contact-editor";
  ```

## tests/unit/UX-mentor-cross-filter-mobile-01.test.ts (1 failing)
- Mentor projects directory responsive filters and paging > UX-mentor-cross-X01 uses minimum 44px controls and 16px input fonts on phones

  ```
  AssertionError: expected '"use client";\nimport { Input } from …' to contain 'className="min-h-11 w-full min-w-0 ma…'
  - Expected
  + Received
  - className="min-h-11 w-full min-w-0 max-w-full
  + "use client";
  + import { Input } from "@/components/ui/input";
  + import { Select } from "@/components/ui/select";
  + import { Button } from "@/components/ui/button";
  ```

## tests/unit/UX-recruiter-home-01.test.ts (1 failing)
- UX-recruiter-home-01 > preserves canonical route, scoped data and the audited mobile/action states

  ```
  AssertionError: expected 'import HrHome from "@/app/(authentica…' to match /export\s*\{\s*default\s*\}/
  - Expected:
  /export\s*\{\s*default\s*\}/
  + Received:
  "import HrHome from \"@/app/(authenticated)/hr/home/page\";
  /** Preserve /recruiter/home while forwarding the selected recruiter college. */
  export default function RecruiterHome({searchParams}:{
  searchParams:Promise<{collegeId?:string|string[]}>
  ```

## tests/unit/UX-teacher-courses-shared-controls.test.ts (1 failing)
- Shared Faculty Courses controls > UX-teacher-courses-shared-03 uses a single shared labelled form pattern for both faculty course entry points

  ```
  AssertionError: expected 'import { Badge } from "@/components/u…' to contain '<Select name="section"'
  - Expected
  + Received
  - <Select name="section"
  + import { Badge } from "@/components/ui/badge";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import Link from "next/link";
  + import {FacultyCourseCover} from "./faculty-course-cover";
  ```
