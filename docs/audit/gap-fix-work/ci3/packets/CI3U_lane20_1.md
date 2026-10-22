# CI unit-test packet (round 3)

These INTEGRATION tests (real PostgreSQL in CI, all migrations applied) FAIL on main. Read the CI workflow .github/workflows/ci.yml for the DB setup. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/college-batch-retire.test.ts (1 failing)
- Planned batch guarded removal PostgreSQL > blocks a child Section and correctly rejects SQL-default microsecond stale timestamp

  ```
  AssertionError: expected +0 to be 1 // Object.is equality
  - Expected
  + Received
  - 1
  + 0
  ```

## tests/integration/courses-c4a-assignments.test.ts (5 failing)
- courses C4A assignments against PostgreSQL > keeps generic assignment structure admin-owned and exact delivery assignments teacher-scoped

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: ad977ab3-99be-458f-abb1-f9e82e56032e,1,2026,034e60dd-358a-4a6f-b46f-86cacfa8333a,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- courses C4A assignments against PostgreSQL > enforces one-shot submission, rejects late or missing-deadline submissions, and checks assignment audience

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: dfed4fb2-b655-4c12-81b5-e07749909a6b,1,2026,481525ed-3d10-45b8-b22d-d13c24d7d33c,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- courses C4A assignments against PostgreSQL > hides unpublished grades and rejects stale concurrent grading

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: d3dab04b-b025-4277-8800-b472b3ee4c2b,1,2026,50e9d6de-a353-4a9c-ae88-cbd4c61909a7,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- courses C4A assignments against PostgreSQL > enforces grade bounds and database payload constraints

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: c4332a86-a1af-49a9-9e47-8edc15814227,1,2026,c5652093-2108-45cb-a5c0-138d77c97ca7,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- courses C4A assignments against PostgreSQL > rejects submission if a faculty archive commits during the write race

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: cb9cfdf6-cb11-40a6-84da-d503a88ba1b4,1,2026,1bf01c66-ac33-4d45-a2a6-924d61a84d3a,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```

## tests/integration/hr-company-report-export.test.ts (1 failing)
- HR company report export PostgreSQL > exports own company's drives but not another company's in the same college

  ```
  PlacementsServiceError: PLACEMENT_JOB_NOT_PUBLISHABLE
  ❯ src/modules/placements/job-service.ts:830:13
  828|     ]);
  829|     if (!rounds.length || !policy.length) {
  830|       throw new PlacementsServiceError("PLACEMENT_JOB_NOT_PUBLISHABLE"…
  |             ^
  831|     }
  832|     const now = new Date();
  ```

## tests/integration/learner-applications-mobile.test.ts (1 failing)
- L14-024 own persisted application on small screen > shows authorized application with active bookmarked filters

  ```
  AssertionError: expected 'Show application filters (1 active)' to contain '2 active'
  Expected: "2 active"
  Received: "Show application filters (1 active)"
  ```
