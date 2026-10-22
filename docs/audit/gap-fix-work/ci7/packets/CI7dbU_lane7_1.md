# CI unit-test packet (round 7db)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/core-platform-acceptance.test.ts (1 failing)
- core platform pre-browser acceptance flow > runs the tenant, people, role, membership and isolation story against PostgreSQL

  ```
  AssertionError: promise rejected "AuthorizationError: Missing permission: a…" instead of resolving
  ❯ tests/integration/core-platform-acceptance.test.ts:420:6
  418|         drizzlePeopleRepository,
  419|       ),
  420|     ).resolves.toEqual([
  |      ^
  421|       "FACULTY",
  422|       "MENTOR",
  ```

## tests/integration/placements-p7-recruiters.test.ts (2 failing)
- Placement P7 recruiter identity and grants > hydrates exact employer grants without creating college memberships

  ```
  
  ```
- Placement P7 recruiter identity and grants > allows recruiter result staging but keeps final application with TPO

  ```
  error: update or delete on table "placement_applications" violates foreign key constraint "placement_college_application_stages_application_id_placement_a" on table "placement_college_application_stages"
  ❯ node_modules/pg-pool/index.js:45:11
  ❯ cleanup tests/integration/placements-p7-recruiters.test.ts:118:3
  116|     "delete from placement_application_status_history",
  117|   );
  118|   await pool.query(
  |   ^
  119|     "delete from placement_applications",
  ```
