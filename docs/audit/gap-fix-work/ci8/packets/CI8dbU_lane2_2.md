# CI unit-test packet (round 8db)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/placements-p7-recruiters.test.ts (2 failing)
- Placement P7 recruiter identity and grants > hydrates exact employer grants without creating college memberships

  ```
  
  ```
- Placement P7 recruiter identity and grants > allows recruiter result staging but keeps final application with TPO

  ```
  error: update or delete on table "placement_college_application_stages" violates foreign key constraint "placement_college_application_stage_history_stage_id_placement_" on table "placement_college_application_stage_history"
  ❯ node_modules/pg-pool/index.js:45:11
  ❯ cleanup tests/integration/placements-p7-recruiters.test.ts:120:3
  118|   // The college-stage projection references application IDs after the
  119|   // round/result ledger rows are deleted; remove that child first.
  120|   await pool.query(
  |   ^
  121|     "delete from placement_college_application_stages",
  ```
