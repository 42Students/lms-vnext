# CI unit-test packet (round 8db)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/placements-requests.test.ts (3 failing)
- Placement learner requests and exceptions > approves withdrawal atomically, scopes managers, and rejects conflicting duplicate payloads

  ```
  
  ```
- Placement learner requests and exceptions > allows reschedule only for an actual progressed participant and preserves the shared round schedule

  ```
  
  ```
- Placement learner requests and exceptions > extends an issued offer only through approval and blocks application withdrawal while the offer is active

  ```
  error: update or delete on table "placement_applications" violates foreign key constraint "placement_college_application_stages_application_id_placement_a" on table "placement_college_application_stages"
  ❯ node_modules/pg-pool/index.js:45:11
  ❯ cleanup tests/integration/placements-requests.test.ts:150:3
  148|     "delete from placement_application_status_history",
  149|   );
  150|   await pool.query(
  |   ^
  151|     "delete from placement_applications",
  ```
