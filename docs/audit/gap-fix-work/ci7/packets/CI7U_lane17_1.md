# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/PROJ-BREAK-chat9-admin-verification-entry.test.tsx (1 failing)
- Super Admin last-third: verification entry security and scope > UX-admin-verification-20 a global operator must select a college rather than inheriting a guessed default

  ```
  AssertionError: expected 'Profile verification Students\' educa…' to contain 'Choose a college first'
  Expected: "Choose a college first"
  Received: "Profile verification Students' education and identity, checked against their documents. Choose a college at the top to see its students waiting for verification."
  ```

## tests/unit/UX-tpo-drive-day-01.test.ts (1 failing)
- UX-tpo-drive-day-01 /tpo/drive-day > preserves legacy UI and signed-off phone and contrast contracts

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' to contain 'md:min-h-9'
  - Expected
  + Received
  - md:min-h-9
  + import {Button} from "@/components/ui/button";
  + import {Select} from "@/components/ui/select";
  + import {Input} from "@/components/ui/input";
  + import Link from "next/link";
  ```

## tests/unit/chat12-tpo-student-marks-export-truth.test.ts (2 failing)
- TPO-students-export-TRUTH-02 marks-verification evidence provenance > exports missing marks-verification as empty rather than falsely claiming No

  ```
  AssertionError: expected '"Not recorded"' to be '""' // Object.is equality
  Expected: """"
  Received: ""Not recorded""
  ```
- TPO-students-export-TRUTH-02 marks-verification evidence provenance > retains explicit persisted Yes and No outcomes without inferring them from grades

  ```
  AssertionError: expected '"Verified"' to be '"Yes"' // Object.is equality
  Expected: ""Yes""
  Received: ""Verified""
  ```

## tests/unit/chat15-reassigned-learner-parity.test.ts (1 failing)
- chat-15 reassigned learner course and placement parity > LEARNER-placements-03 placement tabs render content without extra PageHeader

  ```
  AssertionError: expected 'import { Alert } from "@/components/u…' to contain '<PageHeader'
  - Expected
  + Received
  - <PageHeader
  + import { Alert } from "@/components/ui/alert";
  + import { PageLoading } from "@/components/ui/page-loading";
  + import {StatusBadge,applicationStatusTone} from "@/components/ui/status-badge";
  + import { ErrorState } from "@/components/ui/error-state";
  ```
