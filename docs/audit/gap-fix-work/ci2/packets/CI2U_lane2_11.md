# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat9-tpo-settings-friendly-saves.test.ts (1 failing)
- TPO settings gracious save behavior > TPO-settings-audit-21 preserves the edited job type after a failed network write

  ```
  AssertionError: expected '"use client";\n\nimport { TpoUnifiedJ…' to contain 'apiFetch(url'
  - Expected
  + Received
  - apiFetch(url
  + "use client";
  +
  + import { TpoUnifiedJobTypesEditor, type EditableJobType } from "./tpo-unified-job-types-editor";
  +
  ```

## tests/unit/college-course-crud-guard.test.ts (1 failing)
- College course mutation strict boundaries > refuses unknown edit fields and empty changes

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```

## tests/unit/college-student-csv-model.test.ts (1 failing)
- College student CSV import model > rejects junk after a closing quote rather than silently changing learner identity

  ```
  AssertionError: expected [ Array(1) ] to include 'INVALID_CSV_FORMAT'
  ❯ tests/unit/college-student-csv-model.test.ts:37:57
  35|   it("rejects junk after a closing quote rather than silently changing…
  36|     const malformed = header + "\n" + `"Alice"junk,+919876543210,,${pr…
  37|     expect(parseStudentCsv(malformed).structuralErrors).toContain("INV…
  |                                                         ^
  38|     expect(parseStudentCsv(header+"\n"+`"Alice" ,+919876543210,,${prog…
  39|       .toContain("INVALID_CSV_FORMAT");
  ```

## tests/unit/faculty-profile-round12-14.test.ts (1 failing)
- explains uncoded 409 as a stale profile, not a malformed edit

  ```
  AssertionError: expected 'Profile was updated elsewhere. Please…' to match /updated in another session/
  - Expected:
  /updated in another session/
  + Received:
  "Profile was updated elsewhere. Please refresh and try again."
  ```

## tests/unit/hr-drive-draft-model.test.ts (2 failing)
- HR recruiter Request Drive draft preview > prefills a draft from an already-authorized job without saving anything

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```
- HR recruiter Request Drive draft preview > checks complete fixed/variable annual CTC against both endpoints of the advertised range

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```

## tests/unit/learner-course-detail-live-round5.test.ts (1 failing)
- learner live sessions and recovery > LEARNER-course-detail-18 warns when a requested lesson or content is not published

  ```
  AssertionError: expected 'import { MetricBar } from "@/componen…' to contain 'Content unavailable.'
  - Expected
  + Received
  - Content unavailable.
  + import { MetricBar } from "@/components/ui/metric-bar";
  + import type {ComponentProps} from "react";
  + import progressStyles from "./learner-course-progress.module.css";
  + import { Disclosure } from "@/components/ui/disclosure";
  ```
