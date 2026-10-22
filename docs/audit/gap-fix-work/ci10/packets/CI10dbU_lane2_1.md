# CI unit-test packet (round 10db)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/courses-c4b-quizzes.test.ts (2 failing)
- courses C4B quizzes against PostgreSQL > scores exact answers, enforces attempt limits and freezes question changes after attempts

  ```
  AssertionError: expected { …(13) } to match object { attemptNumber: 1, score: 4, …(3) }
  (8 matching properties omitted from actual)
  - Expected
  + Received
  {
  "attemptNumber": 1,
  "learnerDisplayName": "C4B Quiz Learner",
  -   "learnerEmail": "c4b.learner.db6887e2-0556-4ce1-848c-1e9e129c8181@example.test",
  ```
- courses C4B quizzes against PostgreSQL > requires close before result publication and preserves attempt snapshots

  ```
  AssertionError: expected { …(21) } to match object { score: 10, maxScore: 10, …(1) }
  (18 matching properties omitted from actual)
  - Expected
  + Received
  {
  -   "maxScore": 10,
  -   "resultsVisible": true,
  -   "score": 10,
  ```
