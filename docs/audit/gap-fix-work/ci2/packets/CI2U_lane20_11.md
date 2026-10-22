# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/college-contacts-page-shortcuts.test.ts (1 failing)
- College Contacts first and last page navigation > retains all active scoped filters while changing only pagination

  ```
  AssertionError: expected null to be '10' // Object.is equality
  - Expected:
  "10"
  + Received:
  null
  ```

## tests/unit/college-section-mutation-model.test.ts (1 failing)
- College Admin class mutation model > requires explicit edit confirmation and rejects parent reassignment

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```

## tests/unit/faculty-profile-round10-8.test.ts (1 failing)
- rejects invalid and duplicate-id skills but accepts valid saved records

  ```
  AssertionError: expected null not to be null
  ❯ tests/unit/faculty-profile-round10-8.test.ts:7:61
  5|  const row={id,skill:"Java",proficiency:"Advanced"};
  6|  expect(facultyProfileSkillsIssue([row])).toBeNull();
  7|  expect(facultyProfileSkillsIssue([{...row,skill:""}])).not.toBeNull();
  |                                                             ^
  8|  expect(facultyProfileSkillsIssue([row,row])).toMatch(/Duplicate/);
  9| });
  ```

## tests/unit/graceful-root-screens.test.ts (1 failing)
- graceful route screens > GR-13 includes not-found paths for each role and public links

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'GracefulScreen'
  - Expected
  + Received
  - GracefulScreen
  + import Link from "next/link";
  + import { PageHeader } from "@/components/ui/page-header";
  +
  + /** In the authenticated shell, errors use its single white page canvas. */
  ```

## tests/unit/learner-coding-profile-privacy.test.ts (1 failing)
- never renders spoofed profile hosts or unsafe schemes

  ```
  AssertionError: expected 'https://github.com/real' to be null
  - Expected:
  null
  + Received:
  "https://github.com/real"
  ```

## tests/unit/learner-placements-13-saved-drives.test.ts (1 failing)
- LEARNER-placements-13 saved drive bookmarks > LEARNER-placements-13 uses the exact legacy saved-drive button and toast text

  ```
  AssertionError: expected { action: 'Save for later', …(4) } to deeply equal { action: 'Save for later', …(1) }
  - Expected
  + Received
  {
  "action": "Save for later",
  +   "iconLabel": "Not saved",
  +   "showToast": true,
  "toast": "Saved for later",
  ```
