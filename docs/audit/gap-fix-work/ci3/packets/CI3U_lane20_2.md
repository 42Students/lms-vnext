# CI unit-test packet (round 3)

These INTEGRATION tests (real PostgreSQL in CI, all migrations applied) FAIL on main. Read the CI workflow .github/workflows/ci.yml for the DB setup. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/mentor-resource-directory.test.ts (4 failing)
- Mentor scoped resource metadata and links — PostgreSQL > denies Learner/foreign Resource edits without persisting audit or changing content

  ```
  
  ```
- Mentor scoped resource metadata and links — PostgreSQL > writes all three Resource event types atomically and exposes only redacted Mentor labels

  ```
  
  ```
- Mentor scoped resource metadata and links — PostgreSQL > reads only assigned project resource metadata and denies forged/foreign scope

  ```
  error: update or delete on table "project_instances" violates foreign key constraint "project_resource_audit_project_id_fkey" on table "project_resource_audit"
  ❯ node_modules/pg-pool/index.js:45:11
  ❯ cleanup tests/integration/mentor-resource-directory.test.ts:42:5
  40|       await pool.query("delete from "+table+" where project_id=any($1:…
  41|     }
  42|     await pool.query("delete from project_instances where id=any($1::u…
  |     ^
  43|   }
  ```
- Mentor scoped resource metadata and links — PostgreSQL > writes all three Resource event types atomically and exposes only redacted Mentor labels

  ```
  AssertionError: expected { afterJson: { …(11) }, …(9) } to deeply equal { …(2) }
  - Expected
  + Received
  {
  +   "actionType": "CREATE",
  +   "afterJson": {
  +     "accessNotes": null,
  +     "description": "[redacted resource description]",
  ```

## tests/integration/placements-p9-seasons.test.ts (2 failing)
- Placement P9 seasons > binds new drives to the active season and keeps historical seasons read-only

  ```
  
  ```
- Placement P9 seasons > rejects a season from another college even when it is active

  ```
  error: update or delete on table "placement_applications" violates foreign key constraint "placement_college_application_stages_application_id_placement_a" on table "placement_college_application_stages"
  ❯ node_modules/pg-pool/index.js:45:11
  ❯ cleanup tests/integration/placements-p9-seasons.test.ts:94:3
  92|     "delete from placement_application_status_history",
  93|   );
  94|   await pool.query(
  |   ^
  95|     "delete from placement_applications",
  ```

## tests/integration/sa-tenants-modules-02-today-board.test.ts (1 failing)
- SA-tenants-modules-02 Today board DB access > uses the selected college and rejects a foreign selected scope

  ```
  Error: Failed query: select count(*) from "section_schedule_events" inner join "sections" on "sections"."id" = "section_schedule_events"."section_id" inner join "cohorts" on "cohorts"."id" = "sections"."cohort_id" inner join "programs" on "programs"."id" = "cohorts"."program_id" inner join "departme
  params: MARKED,20000000-0000-4000-8000-000000000001,SCHEDULED,2026-10-15T18:30:00.000Z,2026-10-22T05:44:13.775Z
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
