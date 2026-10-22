# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/college-contacts-empty-recovery.test.ts (1 failing)
- College Contacts filtered-empty recovery > clears filters while keeping the selected contact category

  ```
  AssertionError: expected 'import { DateInput } from "@/componen…' to contain 'No matching contacts in this college.'
  - Expected
  + Received
  - No matching contacts in this college.
  + import { DateInput } from "@/components/ui/date-input";
  + import { Input } from "@/components/ui/input";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { Button } from "@/components/ui/button";
  ```

## tests/unit/college-role-directory-mobile-parity.test.ts (1 failing)
- Mobile Faculty and Learner roster parity > uses a card list on small screens and retains a real table on desktop

  ```
  AssertionError: expected 'import { Select } from "@/components/…' to match /<table[^>]*md:table/
  - Expected:
  /<table[^>]*md:table/
  + Received:
  "import { Select } from \"@/components/ui/select\";
  import { Disclosure } from \"@/components/ui/disclosure\";
  import { Input } from \"@/components/ui/input\";
  import { Button } from \"@/components/ui/button\";
  ```

## tests/unit/faculty-profile-round10-4.test.ts (1 failing)
- names the invalid field so Faculty can correct it

  ```
  TypeError: .toMatch() expects to receive a string, but got object
  ❯ tests/unit/faculty-profile-round10-4.test.ts:6:79
  4|  expect(facultyProfileTextDraftIssue("personalDetails",{dateOfBirth:"2…
  5|  expect(facultyProfileTextDraftIssue("address",{currentAddress:"Hi"}))…
  6|  expect(facultyProfileTextDraftIssue("about",{description:"x".repeat(5…
  |                                                                               ^
  7| });
  8|
  ```

## tests/unit/graceful-raw-error-scan.test.ts (2 failing)
- new raw-error and mutation regression gate > GR-09 rejects new renderings of API codes or internal error messages

  ```
  AssertionError: New unsafe error rendering in: src/components/projects/super-admin-template-plan-editor.tsx: expected [ Array(1) ] to deeply equal []
  - Expected
  + Received
  - []
  + [
  +   "src/components/projects/super-admin-template-plan-editor.tsx",
  + ]
  ```
- new raw-error and mutation regression gate > GR-31 inventories newly changed unguarded mutating components

  ```
  AssertionError: Mutating fetch without useGuardedAction: src/components/academics/college-archived-programs.tsx, src/components/academics/college-hall-booking-action.tsx, src/components/academics/college-hall-cancellation-action.tsx, src/components/admin/tenant-domain-manager.tsx, src/components/col
  - Expected
  + Received
  - []
  + [
  +   "src/components/academics/college-archived-programs.tsx",
  +   "src/components/academics/college-hall-booking-action.tsx",
  +   "src/components/academics/college-hall-cancellation-action.tsx",
  ```

## tests/unit/learner-coding-profile-link.test.ts (1 failing)
- only accepts named HTTPS coding platforms

  ```
  AssertionError: expected 'https://github.com/learner' to be null
  - Expected:
  null
  + Received:
  "https://github.com/learner"
  ```

## tests/unit/learner-placement-parity.test.ts (1 failing)
- learner placement route parity > keeps every old learner placement sub-route materialized with real content

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'LearnerCareerRoundsWorkspace'
  - Expected
  + Received
  - LearnerCareerRoundsWorkspace
  + import { redirect } from "next/navigation";
  + import { z } from "zod";
  +
  + /** The old Interviews page was an alias for Schedule, not another independent
  ```
