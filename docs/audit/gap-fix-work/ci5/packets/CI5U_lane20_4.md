# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat9-phase2-college-companies.test.ts (1 failing)
- legacy College Admin Companies route and scope > keeps the page on the college-scoped service with a college-role guard

  ```
  AssertionError: expected 'import { Input } from "@/components/u…' to contain 'hasMembershipRole(context, "COLLEGE_A…'
  - Expected
  + Received
  - hasMembershipRole(context, "COLLEGE_ADMIN")
  + import { Input } from "@/components/ui/input";
  + import { Button } from "@/components/ui/button";
  + import { Select } from "@/components/ui/select";
  + import { FilterBar } from "@/components/ui/filter-bar";
  ```

## tests/unit/chat9-super-admin-orphan-routes.test.ts (1 failing)
- Super Admin sidebar consolidation retains orphan routes > keeps domains, academics overview and audit findings reachable

  ```
  AssertionError: expected 'import { AcademicSetupSteps } from "@…' to contain 'href="/admin/academics"'
  - Expected
  + Received
  - href="/admin/academics"
  + import { AcademicSetupSteps } from "@/components/admin/academic-setup-steps";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { DepartmentCreateForm } from "@/components/admin/department-create-form";
  + import { DepartmentDirectory } from "@/components/admin/department-directory";
  ```

## tests/unit/college-batch-promotion-model.test.ts (1 failing)
- College Admin batch promotion preview policy > accepts only bounded query fields and valid academic year overrides

  ```
  ZodError: [
  {
  "expected": "number",
  "code": "invalid_type",
  "received": "NaN",
  "path": [
  "yearStart"
  ],
  ```

## tests/unit/college-recurring-preview.test.ts (1 failing)
- College recurring preview is IST-safe and bounded > requires unique weekdays, valid calendar dates, bounded range and increasing times

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
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

## tests/unit/hr-team-pagination-model.test.ts (1 failing)
- HR exact-company team roster pagination > shows only the requested 25 of an already-authorized and searched set

  ```
  AssertionError: expected [ { id: 'r50' }, { id: 'r51' } ] to deeply equal []
  - Expected
  + Received
  - []
  + [
  +   {
  +     "id": "r50",
  +   },
  ```

## tests/unit/learner-drive-deadline-urgency-model.test.ts (1 failing)
- learner drive persisted deadline urgency > never claims a deadline without persisted evidence

  ```
  AssertionError: expected 'Closed 17 Oct 2026' to be 'Deadline listed' // Object.is equality
  Expected: "Deadline listed"
  Received: "Closed 17 Oct 2026"
  ```

## tests/unit/learner-placements-chat7-notice-actions.test.ts (1 failing)
- Chat-7 learner notice action and audience parity > LEARNER-placements-47 renders only safe persisted TPO action links

  ```
  AssertionError: expected { id: 'notice-1', …(14) } to match object { …(4) }
  (11 matching properties omitted from actual)
  - Expected
  + Received
  {
  -   "audienceLabel": "College",
  +   "audienceLabel": null,
  "buttonLabel": "View preparation",
  ```
