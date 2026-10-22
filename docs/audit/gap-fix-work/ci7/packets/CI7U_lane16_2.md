# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat2-UX-tpo-overlay-01.test.ts (1 failing)
- UX-tpo-overlay: focus-safe mobile and desktop workflows > UX-tpo-overlay primitive contracts share focus restoration, top-layer dismissal and reduced-motion exit

  ```
  Error: ENOENT: no such file or directory, open 'src/components/ui/use-overlay-exit.tsx'
  ❯ ui tests/unit/chat2-UX-tpo-overlay-01.test.ts:5:30
  3|
  4| const file = (name: string) => readFileSync("src/components/tpo/" + na…
  5| const ui = (name: string) => readFileSync("src/components/ui/" + name …
  |                              ^
  6|
  7| describe("UX-tpo-overlay: focus-safe mobile and desktop workflows", ()…
  ```

## tests/unit/chat3-college-round12-parity-contracts.test.ts (2 failing)
- chat-3 college people and attendance source contract audit > COL-attendance-05 successful attendance corrections are announced

  ```
  AssertionError: expected '"use client";\n\nimport { ADMIN_ATTEN…' to contain 'Marked present'
  - Expected
  + Received
  - Marked present
  + "use client";
  +
  + import { ADMIN_ATTENDANCE_COPY } from "@/modules/attendance/admin-attendance-copy";
  + import {AdminAttendanceParentContactEditor} from "./admin-attendance-parent-contact-editor";
  ```
- chat-3 college people and attendance source contract audit > COL-attendance-12 day-wise attendance CSV preserves discrete mark codes

  ```
  AssertionError: expected '"use client";\n\nimport { ADMIN_ATTEN…' to contain 'return "P"'
  - Expected
  + Received
  - return "P"
  + "use client";
  +
  + import { ADMIN_ATTENDANCE_COPY } from "@/modules/attendance/admin-attendance-copy";
  + import {AdminAttendanceParentContactEditor} from "./admin-attendance-parent-contact-editor";
  ```

## tests/unit/chat4-remaining-queue-revalidation-round.test.ts (1 failing)
- chat-4 remaining source contracts after final-sprint split > SA-placements-projects-71 keeps pending-age, reviewer evidence, scoped export, and mentor reassignment

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'Revisions'
  - Expected
  + Received
  - Revisions
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { projectAdminCsv } from "@/modules/projects/project-admin-csv-model";
  +
  ```

## tests/unit/chat5-ux-tpo-middle-third.test.ts (4 failing)
- chat-5 UX /tpo middle-third route coverage (43–84) > UX-tpo-placements-jobs-jobid-candidate-schedule-02 gives phone readers all schedule fields and explicit empty copy

  ```
  AssertionError: expected 'import { PageHeader } from "@/compone…' to contain 'empty={<p role="status">No progressio…'
  - Expected
  + Received
  - empty={<p role="status">No progression-eligible round participants are currently recorded.
  + import { PageHeader } from "@/components/ui/page-header";
  + import Link from "next/link";
  + import { DataTable } from "@/components/ui/data-table";
  + import { Banner } from "@/components/ui/banner";
  ```
- chat-5 UX /tpo middle-third route coverage (43–84) > UX-tpo-reports-after-college-02 keeps six report columns on phone and explicit filtered-empty wording

  ```
  AssertionError: expected 'import { Select } from "@/components/…' to contain 'empty={<p role="status">No students m…'
  - Expected
  + Received
  - empty={<p role="status">No students match these filters.</p>}
  + import { Select } from "@/components/ui/select";
  + import { Button } from "@/components/ui/button";
  + import {TpoReportPresentation} from "@/components/placements/tpo-report-presentation";
  + import {Suspense} from "react";
  ```
- chat-5 UX /tpo middle-third route coverage (43–84) > UX-tpo-reports-branch-season-02 preserves eight report fields and exact no-evidence copy on responsive cards

  ```
  AssertionError: expected 'import { Select } from "@/components/…' to contain 'empty={<p role="status">This season h…'
  - Expected
  + Received
  - empty={<p role="status">This season has no persisted applicant, accepted-offer or registered-pool branch evidence.
  + import { Select } from "@/components/ui/select";
  + import { Button } from "@/components/ui/button";
  + import {TpoReportPresentation} from "@/components/placements/tpo-report-presentation";
  + import {Suspense} from "react";
  ```
- chat-5 UX /tpo middle-third route coverage (43–84) > UX-tpo-reports-accreditation-02 renders both eleven-field and six-field tables as cards without losing the authoritative export

  ```
  AssertionError: expected 'import { Input } from "@/components/u…' to contain 'empty={<p role="status">No placed stu…'
  - Expected
  + Received
  - empty={<p role="status">No placed students were recorded in this batch.</p>}
  + import { Input } from "@/components/ui/input";
  + import { PageBackLink } from "@/components/ui/page-back-link";
  + import { Select } from "@/components/ui/select";
  + import { Button } from "@/components/ui/button";
  ```
