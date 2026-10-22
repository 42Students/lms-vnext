# CI unit-test packet (round 8db)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/courses-c4b-quizzes.test.ts (3 failing)
- courses C4B quizzes against PostgreSQL > scores exact answers, enforces attempt limits and freezes question changes after attempts

  ```
  ZodError: [
  {
  "origin": "array",
  "code": "too_small",
  "minimum": 1,
  "inclusive": true,
  "path": [
  "answers",
  ```
- courses C4B quizzes against PostgreSQL > requires close before result publication and preserves attempt snapshots

  ```
  AssertionError: expected CoursesServiceError: INVALID_QUIZ_TRANSIT… { code: '…' } to match object { code: 'QUIZ_RESULTS_ADMIN_ONLY' }
  (1 matching property omitted from actual)
  - Expected
  + Received
  - {
  -   "code": "QUIZ_RESULTS_ADMIN_ONLY",
  + CoursesServiceError {
  +   "code": "INVALID_QUIZ_TRANSITION",
  ```
- courses C4B quizzes against PostgreSQL > rejects a quiz submission when a faculty close commits during the race

  ```
  AssertionError: expected ZodError: [
  {
  "origin": "array",
  … { …(7) } to match object { code: 'QUIZ_NOT_PUBLISHED' }
  (2 matching properties omitted from actual)
  - Expected
  + Received
  - {
  ```
