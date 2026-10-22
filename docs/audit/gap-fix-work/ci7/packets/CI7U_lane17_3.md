# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat6-superadmin-course-entrypoints.test.ts (1 failing)
- Super Admin course in-tab entry points > SA-academics-people-57 lessons have course filter CSV and bulk visibility controls

  ```
  AssertionError: expected '"use client";\nimport { Alert } from …' to contain 'Show selected'
  - Expected
  + Received
  - Show selected
  + "use client";
  + import { Alert } from "@/components/ui/alert";
  + import { Checkbox } from "@/components/ui/checkbox";
  + import { ConfirmDialog } from "@/components/ui/confirm-dialog";
  ```

## tests/unit/chat7-legacy-learner-submission-form-copy.test.ts (1 failing)
- SubmitAssignmentModal.jsx dev copy in Learner submission form > uses exact drawer and submission-method labels

  ```
  AssertionError: expected '"use client";\nimport { Select } from…' to contain 'Add your work using the allowed metho…'
  - Expected
  + Received
  - Add your work using the allowed methods below. Submission is final once recorded.
  + "use client";
  + import { Select } from "@/components/ui/select";
  +
  + import {
  ```

## tests/unit/chat9-final-named-gap-verification.test.ts (1 failing)
- chat-9 final named gap source acceptance > COL-academic-setup-21 is NOT-A-GAP: departments are sorted, searchable and pageable with a result count

  ```
  AssertionError: expected [ 'Zoology', 'Biology', 'Physics' ] to deeply equal [ 'Biology', 'Physics', 'Zoology' ]
  - Expected
  + Received
  [
  +   "Zoology",
  "Biology",
  "Physics",
  -   "Zoology",
  ```

## tests/unit/college-mapping-model.test.ts (1 failing)
- College Admin semester offering and faculty assignment models > validates teaching lifecycle filters and rejects unrecognised fields

  ```
  AssertionError: expected { role: 'ALL', q: '', …(2) } to deeply equal { q: '', status: 'ACTIVE', …(2) }
  - Expected
  + Received
  {
  "page": 1,
  "q": "",
  "role": "ALL",
  -   "status": "ACTIVE",
  ```
