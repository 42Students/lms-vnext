# CI unit-test packet (round 3)

These INTEGRATION tests (real PostgreSQL in CI, all migrations applied) FAIL on main. Read the CI workflow .github/workflows/ci.yml for the DB setup. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/lecture-halls.test.ts (1 failing)
- lecture halls: authorization > denies another college's admin and a learner, for every operation

  ```
  AssertionError: promise resolved "{ …(4) }" instead of rejecting
  - Expected
  + Received
  - Error {
  -   "message": "rejected promise",
  + {
  +   "collegeId": "20000000-0000-4000-8000-000000000001",
  +   "collegeName": "Seed College A",
  ```

## tests/integration/placements-p6a-screening.test.ts (5 failing)
- Placement P6A screening > creates a pending screening queue item and exposes only learner-safe state

  ```
  
  ```
- Placement P6A screening > audits hold-to-shortlist transitions without leaking internal notes

  ```
  
  ```
- Placement P6A screening > keeps rejection internals private while exposing candidate-safe wording

  ```
  
  ```
- Placement P6A screening > removes withdrawn applications from the active queue and blocks later decisions

  ```
  
  ```
- Placement P6A screening > rejects a screening manager from another college

  ```
  error: update or delete on table "placement_applications" violates foreign key constraint "placement_college_application_stages_application_id_placement_a" on table "placement_college_application_stages"
  ❯ node_modules/pg-pool/index.js:45:11
  ❯ cleanup tests/integration/placements-p6a-screening.test.ts:102:3
  100|     "delete from placement_application_status_history",
  101|   );
  102|   await pool.query(
  |   ^
  103|     "delete from placement_applications",
  ```

## tests/integration/projects-placements-pg-harness-boundaries.test.ts (2 failing)
- PROJ-HARNESS role/tenancy and concurrent PostgreSQL fixture boundaries > PROJ-HARNESS-33 role spoofing in Project fixture constructor fails before templates are inserted

  ```
  AssertionError: expected 1 to be +0 // Object.is equality
  - Expected
  + Received
  - 0
  + 1
  ```
- PROJ-HARNESS role/tenancy and concurrent PostgreSQL fixture boundaries > PROJ-HARNESS-34 suspended or disabled author cannot create a Projects graph

  ```
  AssertionError: expected [ …(2) ] to have a length of +0 but got 2
  - Expected
  + Received
  - 0
  + 2
  ```

## tests/integration/tenant-domains.test.ts (4 failing)
- tenant domains against PostgreSQL > creates idempotently, verifies, and resolves a tenant host

  ```
  Error: Failed query: select "platform_status" from "users" where "users"."id" = $1 limit $2 for share
  params: integration-superadmin,1
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- tenant domains against PostgreSQL > requires exact hostname confirmation for deletion of a persisted primary host

  ```
  Error: Failed query: select "platform_status" from "users" where "users"."id" = $1 limit $2 for share
  params: integration-superadmin,1
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- tenant domains against PostgreSQL > switches one verified primary domain transactionally

  ```
  Error: Failed query: select "platform_status" from "users" where "users"."id" = $1 limit $2 for share
  params: integration-superadmin,1
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- tenant domains against PostgreSQL > enforces global host uniqueness and tenant management boundaries

  ```
  Error: Failed query: select "platform_status" from "users" where "users"."id" = $1 limit $2 for share
  params: integration-superadmin,1
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
