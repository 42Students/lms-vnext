# CI unit-test packet (round 8db)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/placements-learner-journey.test.ts (2 failing)
- Learner placement journey > hides internal screening state while exposing confirmed learner-facing decisions and applied results

  ```
  
  ```
- Learner placement journey > is learner-only rather than a generic same-college read model

  ```
  error: update or delete on table "placement_applications" violates foreign key constraint "placement_college_application_stages_application_id_placement_a" on table "placement_college_application_stages"
  ❯ node_modules/pg-pool/index.js:45:11
  ❯ cleanup tests/integration/placements-learner-journey.test.ts:104:3
  102|     "delete from placement_application_status_history",
  103|   );
  104|   await pool.query(
  |   ^
  105|     "delete from placement_applications",
  ```
