# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/college-academic-export-model.test.ts (1 failing)
- college semester CSV > exports bounded saved batch progression and neutralizes spreadsheet formulas

  ```
  TypeError: Cannot read properties of undefined (reading 'replace')
  ❯ safeCollegeCsvCell src/modules/academics/college-directory-export-model.ts:6:22
  4|  * invisible prefixes that some spreadsheet engines silently strip. */
  5| function safeCollegeCsvCell(value:string):string {
  6|  const visible=value.replace(/^[\s\p{Cf}\p{Mn}]*/u,"");
  |                      ^
  7|  return escapeActivityCsvCell(/^[-=+@]/u.test(visible)?"'"+value:value…
  8| }
  ```

## tests/unit/college-elective-slot-mutation-model.test.ts (1 failing)
- college elective slot mutation model > requires a version and confirmation for editing

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```

## tests/unit/faculty-assessment-report.test.ts (2 failing)
- Faculty fractional grade bands > does not lose fractional percentages between labeled ranges

  ```
  AssertionError: expected 1 to be 5 // Object.is equality
  - Expected
  + Received
  - 5
  + 1
  ```
- Faculty assignment score precision > rounds the final average, not individual fractional marks

  ```
  AssertionError: expected 22 to be 21 // Object.is equality
  - Expected
  + Received
  - 21
  + 22
  ```

## tests/unit/faculty-route-access-model.test.ts (1 failing)
- Faculty-only /teacher route boundary > does not allow learner, mentor or college admin role substitution

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```

## tests/unit/hr-today-action-queue-scoped.test.ts (2 failing)
- REC-home-drives-01 scoped task queue > orders dated results-due first, then readable conversations and notices, then reviews

  ```
  AssertionError: expected [ 'thread:thread', 'notifications' ] to deeply equal [ 'due:round', 'notifications', …(2) ]
  - Expected
  + Received
  [
  -   "due:round",
  +   "thread:thread",
  "notifications",
  -   "thread:thread",
  ```
- REC-home-drives-01 scoped task queue > cannot leak foreign-company or unlinked deadline rows into actions

  ```
  AssertionError: expected [] to deeply equal [ Array(1) ]
  - Expected
  + Received
  - [
  -   "review:11111111-1111-4111-8111-111111111111",
  - ]
  + []
  ```

## tests/unit/learner-discussion-message-limit-model.test.ts (1 failing)
- learner discussion message limit > accepts the maximum 3900 characters enforced by server validation

  ```
  AssertionError: expected 4000 to be 3900 // Object.is equality
  - Expected
  + Received
  - 3900
  + 4000
  ```
