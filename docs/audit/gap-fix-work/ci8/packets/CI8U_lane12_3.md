# CI unit-test packet (round 8)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

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

## tests/unit/chat7-final-sprint-superadmin-courses-content.test.ts (2 failing)
- chat-7 final sprint Super Admin courses and content > SA-academics-people-50 validates short title, optional official code and colour independently from internal code

  ```
  AssertionError: expected '"use client";\n\nimport { COLLEGE_COU…' to contain 'Official course code (optional)'
  - Expected
  + Received
  - Official course code (optional)
  + "use client";
  +
  + import { COLLEGE_COURSES_COPY } from "@/modules/courses/college-courses-copy";
  + import { academicSetupErrorMessage } from "@/modules/academics/academic-setup-error-copy";
  ```
- chat-7 final sprint Super Admin courses and content > SA-academics-people-64 connects assignments to publish archive and existing builder

  ```
  AssertionError: expected 'import { FilterBar } from "@/componen…' to contain 'Open offering builder / submissions'
  - Expected
  + Received
  - Open offering builder / submissions
  + import { FilterBar } from "@/components/ui/filter-bar";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import Link from "next/link";
  + import {Input} from "@/components/ui/input";
  ```
