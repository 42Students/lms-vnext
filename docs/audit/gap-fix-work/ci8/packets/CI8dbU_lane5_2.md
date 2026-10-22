# CI unit-test packet (round 8db)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/placements-w04-coordinator-days.test.ts (6 failing)
- W04 coordinator same-day / tenant authorization > limits listing and roster to the assigned day's actual rounds

  ```
  
  ```
- W04 coordinator same-day / tenant authorization > revokes roster access immediately when assignment is removed

  ```
  
  ```
- W04 coordinator same-day / tenant authorization > does not treat a forged authenticated user as the assigned learner

  ```
  
  ```
- W04 coordinator same-day / tenant authorization > keeps cross-college managers out while preserving an authorized TPO's historical round view

  ```
  
  ```
- W04 coordinator same-day / tenant authorization > rejects adding an existing applicant as a Drive Day coordinator

  ```
  
  ```
- W04 coordinator same-day / tenant authorization > serializes application versus coordinator assignment so neither role can coexist

  ```
  error: update or delete on table "placement_applications" violates foreign key constraint "placement_college_application_stages_application_id_placement_a" on table "placement_college_application_stages"
  ❯ node_modules/pg-pool/index.js:45:11
  ❯ cleanup tests/integration/placements-w04-coordinator-days.test.ts:65:3
  63|   await pool.query("delete from placement_application_screenings");
  64|   await pool.query("delete from placement_application_status_history");
  65|   await pool.query("delete from placement_applications");
  |   ^
  66|   await pool.query("delete from placement_job_eligibility_policies");
  ```
