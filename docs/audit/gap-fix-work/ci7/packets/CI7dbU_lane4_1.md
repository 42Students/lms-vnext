# CI unit-test packet (round 7db)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/chat9-college-project-roster-atomic.test.ts (1 failing)
- COL-projects-15 atomic College Admin roster workflow > COL-projects-15 adds and removes a same-college learner with audit-backed atomic writes

  ```
  AssertionError: expected +0 to be 1 // Object.is equality
  - Expected
  + Received
  - 1
  + 0
  ```

## tests/integration/placements-learner-job-feed.test.ts (5 failing)
- Learner placement job feed > shows only published jobs in the learner's active college and carries application state

  ```
  
  ```
- Learner placement job feed > rejects non-learners instead of exposing the learner feed as a generic college read

  ```
  
  ```
- Learner placement job feed > denies feed and new applications when the college has not bought Placements

  ```
  
  ```
- Learner placement job feed > denies feed and new applications for an explicitly ineligible learner even when a job would otherwise admit them

  ```
  
  ```
- Learner placement job feed > denies forged learner membership context even if its role and placement choice look valid

  ```
  error: update or delete on table "placement_applications" violates foreign key constraint "placement_college_application_stages_application_id_placement_a" on table "placement_college_application_stages"
  ❯ node_modules/pg-pool/index.js:45:11
  ❯ cleanup tests/integration/placements-learner-job-feed.test.ts:111:3
  109|     "delete from placement_application_status_history",
  110|   );
  111|   await pool.query(
  |   ^
  112|     "delete from placement_applications",
  ```
