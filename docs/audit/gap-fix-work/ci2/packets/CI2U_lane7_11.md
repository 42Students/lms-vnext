# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/college-academic-directory-model.test.ts (2 failing)
- College Admin semester and batch read models > accepts only bounded, college-independent semester queries

  ```
  AssertionError: expected { q: '', page: 1, pageSize: 25, …(1) } to deeply equal { q: '', status: 'ALL', page: 1, …(1) }
  - Expected
  + Received
  {
  "page": 1,
  -   "pageSize": 10,
  +   "pageSize": 25,
  "q": "",
  ```
- College Admin semester and batch read models > accepts only defined cohort lifecycles

  ```
  AssertionError: expected { q: '', page: 1, pageSize: 25, …(2) } to deeply equal { q: '', status: 'ALL', …(3) }
  - Expected
  + Received
  {
  "page": 1,
  -   "pageSize": 10,
  +   "pageSize": 25,
  "progression": "ALL",
  ```

## tests/unit/college-drive-read-model.test.ts (1 failing)
- College drives filters > strictly validates bounded filters and never accepts caller college

  ```
  AssertionError: expected { q: '', status: 'ALL', …(3) } to deeply equal { q: '', status: 'PUBLISHED', …(2) }
  - Expected
  + Received
  {
  "page": 1,
  +   "pageSize": 20,
  "q": "",
  -   "sort": "TITLE",
  ```

## tests/unit/db01-tenant-domain-authorization.test.ts (2 failing)
- DB01 tenant-domain authorization and identity-state regression > allows an unscoped active superadmin to delete another college domain

  ```
  AssertionError: expected "vi.fn()" to be called with arguments: [ …(2) ]
  Received:
  1st vi.fn() call:
  [
  "44444444-4444-4444-8444-444444444444",
  undefined,
  +   {
  +     "adminScope": undefined,
  ```
- DB01 tenant-domain authorization and identity-state regression > allows an active authorized superadmin to select a verified primary in their own college

  ```
  AssertionError: expected "vi.fn()" to be called with arguments: [ Array(1) ]
  Received:
  1st vi.fn() call:
  [
  "33333333-3333-4333-8333-333333333333",
  +   {
  +     "adminScope": undefined,
  +     "membership": null,
  ```

## tests/unit/faculty-report-students.test.ts (1 failing)
- Faculty PDF report name privacy > uses only a public display name and a neutral missing-name label

  ```
  AssertionError: expected 'Unknown student' to be 'Learner (name unavailable)' // Object.is equality
  Expected: "Learner (name unavailable)"
  Received: "Unknown student"
  ```

## tests/unit/hr-today-action-queue-model.test.ts (1 failing)
- filters foreign-company and foreign-college drives before constructing review links

  ```
  AssertionError: expected [ { key: 'notifications', …(5) } ] to have a length of 2 but got 1
  - Expected
  + Received
  - 2
  + 1
  ```

## tests/unit/learner-dashboard-model.test.ts (4 failing)
- Learner placement dashboard summary and priority > renders a real first-run browse action with zero counts

  ```
  AssertionError: expected '/learn/my-placements' to be '/learn/my-placements/jobs' // Object.is equality
  Expected: "/learn/my-placements/jobs"
  Received: "/learn/my-placements"
  ```
- Learner placement dashboard summary and priority > prioritizes a soon assessment over an earlier interview

  ```
  AssertionError: expected 'interview' to be 'test' // Object.is equality
  Expected: "test"
  Received: "interview"
  ```
- Learner placement dashboard summary and priority > retains the actual chronologically next scheduled event even when hero prefers a later test

  ```
  AssertionError: expected 'earlier' to be 'later' // Object.is equality
  Expected: "later"
  Received: "earlier"
  ```
- L11-014 needs-attention ordering > shows the earliest effective schedule, not all assessments before interviews

  ```
  AssertionError: expected 'early-interview' to be 'middle-test' // Object.is equality
  Expected: "middle-test"
  Received: "early-interview"
  ```
