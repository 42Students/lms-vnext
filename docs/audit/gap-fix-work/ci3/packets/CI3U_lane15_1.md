# CI unit-test packet (round 3)

These INTEGRATION tests (real PostgreSQL in CI, all migrations applied) FAIL on main. Read the CI workflow .github/workflows/ci.yml for the DB setup. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/chat5-tpo-offer-academic-tenant-isolation.test.ts (1 failing)
- PLACEMENTS-OFFERS-IDOR-07: academic enrichment cannot leak a foreign college's cohort > masks cross-college program/cohort on a same-college membership, but keeps legitimate academic data

  ```
  error: Cohort program and start period must belong to one college
  ❯ node_modules/pg-pool/index.js:45:11
  ❯ tests/integration/chat5-tpo-offer-academic-tenant-isolation.test.ts:65:4
  63|    // Even a same-college program can point at a cohort whose academic…
  64|    // belongs to a different college. The label still cannot be export…
  65|    await pool.query("insert into cohorts(id,program_id,name,code,start…
  |    ^
  66|     [wrongPeriodCohort,localProgram,"WRONG COLLEGE START PERIOD","WC-"…
  ```

## tests/integration/core-admin-domains.test.ts (1 failing)
- core admin domains against PostgreSQL > persists the superadmin organization -> college -> department flow

  ```
  AssertionError: expected [ { …(14) } ] to deeply equal [ ObjectContaining{…} ]
  - Expected
  + Received
  [
  {
  -     "code": "ITEST-CORE",
  +     "addressLine1": null,
  +     "addressLine2": null,
  ```

## tests/integration/faculty-section-authoring.test.ts (8 failing)
- Faculty own-delivery assessment command successful DB writes and denials > reads a real published HTTPS live class with exact Faculty Section scope

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: deb202c2-11ed-446b-a369-785407d3cd57,1,2026,a7c0a171-cb0e-4c51-8128-17cc17e3d3fd,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- Faculty own-delivery assessment command successful DB writes and denials > serves a real Section Assignment report and regenerates privacy-safe CSV with deny checks

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: 429b7d59-ae38-4bc8-b082-769d9d7fa46e,1,2026,df004894-ac47-4161-8ae3-0b5f646d093b,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- Faculty own-delivery assessment command successful DB writes and denials > creates and audits Assignment draft, rejects stale/foreign, then publishes and archives

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: 1aca56ab-d75a-414f-8b39-0f9235f72e7e,1,2026,c29209af-126d-48a5-991a-2ae77a04ed2d,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- Faculty own-delivery assessment command successful DB writes and denials > denies a stale Assignment token from a SQL-default now() snapshot

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: d906d197-8b82-4be2-b9f4-0c351bede433,1,2026,68932728-0e0c-4535-870e-f4a7ac99866b,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- Faculty own-delivery assessment command successful DB writes and denials > serves real Section Quiz question accuracy and privacy-safe filtered CSV

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: 05c66bc1-89bc-4e12-bdac-0ba42bc53526,1,2026,58b79ec1-14a0-4181-aa5d-5d0b3a00327d,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- Faculty own-delivery assessment command successful DB writes and denials > edits published and closed quiz metadata without mutating its immutable question bank

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: dbf88b49-3be2-437a-a60b-bf062fa3f883,1,2026,93727a8b-aef7-44a8-b89a-c4b028bc5904,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- Faculty own-delivery assessment command successful DB writes and denials > rejects SQL microsecond-stale Quiz question replacement with one audited edit

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: 3c9e3750-aab3-4d85-bd15-26c889cf62d1,1,2026,d5f88aa9-8582-4eb7-9453-7882d23ff857,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- Faculty own-delivery assessment command successful DB writes and denials > validates choice answers and audit, denies old token and foreign Section

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: 24c4507a-2d92-48d2-954b-03d7e155fa3b,1,2026,7cbebaf9-0cbb-46db-8e19-a99695b26b24,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```

## tests/integration/hr-round-schedule.test.ts (1 failing)
- HR round schedule scoped PG > shows own scheduled round, denies foreign company and wrong role

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
