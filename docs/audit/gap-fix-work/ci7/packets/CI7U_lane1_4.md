# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/company-share-audit-columns-safety.test.ts (1 failing)
- public share service selects only preview-approved candidate identity fields

  ```
  AssertionError: expected 'import {learnerProfileDocumentSchema}…' to contain 'Object.fromEntries(columns.map(key=>[…'
  - Expected
  + Received
  - Object.fromEntries(columns.map(key=>[key,values[key]]))
  + import {learnerProfileDocumentSchema} from "@/modules/people/profile-validation";
  + import {placementReportCsv} from "../report-model";
  + export const COMPANY_SHARE_COLUMNS={
  +  APPLICATION_ID:"Applicant ID",NAME:"Name",ROLL_NUMBER:"Roll number",
  ```

## tests/unit/learner-course-detail-round5.test.ts (1 failing)
- chat-11 Learner Course Detail legacy parity > LEARNER-course-detail-14 displays content kind, progress and due labels on learning items

  ```
  AssertionError: expected 'import { MetricBar } from "@/componen…' to contain 'caption="Assignment"'
  - Expected
  + Received
  - caption="Assignment"
  + import { MetricBar } from "@/components/ui/metric-bar";
  + import type {ComponentProps} from "react";
  + import progressStyles from "./learner-course-progress.module.css";
  + import { Disclosure } from "@/components/ui/disclosure";
  ```

## tests/unit/nsrit-migration-academics.test.ts (1 failing)
- buildAcademicsPlan on a synthetic snapshot > loads quiz attempts as SUBMITTED history with prompt and option snapshots

  ```
  AssertionError: expected [ Array(1) ] to have a length of 2 but got 1
  - Expected
  + Received
  - 2
  + 1
  ```

## tests/unit/super-admin-videos-directory.test.ts (1 failing)
- Super Admin Videos directory pure model > includes hosted and YouTube videos, not other content

  ```
  AssertionError: expected 'YouTube' to be 'YouTube Video' // Object.is equality
  Expected: "YouTube Video"
  Received: "YouTube"
  ```
