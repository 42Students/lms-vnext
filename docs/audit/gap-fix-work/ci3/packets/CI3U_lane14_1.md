# CI unit-test packet (round 3)

These INTEGRATION tests (real PostgreSQL in CI, all migrations applied) FAIL on main. Read the CI workflow .github/workflows/ci.yml for the DB setup. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/chat4-college-student-placement-tenant.test.ts (1 failing)
- College Admin class placement tenant and actor guard (PostgreSQL)

  ```
  error: inconsistent types deduced for parameter $3
  ❯ node_modules/pg-pool/index.js:45:11
  ❯ tests/integration/chat4-college-student-placement-tenant.test.ts:43:3
  41|    await pool.query("insert into membership_roles(membership_id,role) …
  42|   }
  43|   await pool.query("insert into academic_periods(id,college_id,name,co…
  |   ^
  44|    [ids.period,SEED_IDS.collegeA,tag]);
  ```

## tests/integration/company-applicant-share-capability-pg.test.ts (1 failing)
- Company applicant share PG capability acceptance > enforces expiry, revocation, tenant ownership and durable audited views

  ```
  error: null value in column "code_hash" of relation "placement_company_applicant_shares" violates not-null constraint
  ❯ node_modules/pg/lib/client.js:694:17
  ❯ tests/integration/company-applicant-share-capability-pg.test.ts:43:4
  41|     [job,SEED_IDS.collegeA,season,relationship,SEED_IDS.collegeAdminUs…
  42|    );
  43|    await client.query(
  |    ^
  44|     "insert into placement_company_applicant_shares(id,college_id,job_…
  ```

## tests/integration/faculty-mentor-positive-courses.test.ts (26 failing)
- Chat4 Faculty SUCCESS paths against disposable PostgreSQL > authors Section quiz questions with stale, wrong-role, and foreign-scope denial

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: b8a757eb-574d-4051-bda2-0f85d251f3e0,1,2026,3ac8f7ba-34ee-4f40-89d0-200d4403e207,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- Chat4 Faculty SUCCESS paths against disposable PostgreSQL > writes a confirmed own-Section assignment draft with row-locked stale and wrong-role denial

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: 73662b81-1521-453f-9a41-2a6d819f622c,1,2026,8828caef-21a3-4293-8d6b-3a709e957d49,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- Chat4 Faculty SUCCESS paths against disposable PostgreSQL > filters actual Faculty reply audit with exact Section and non-leaking denial

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: 054a425e-793c-4232-bdbe-484e0b610b86,1,2026,c72bb2c8-2352-4190-a189-56f15ca239b4,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- Chat4 Faculty SUCCESS paths against disposable PostgreSQL > writes version-checked Faculty reply against locked Section parent, with immutable audit

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: 3736aed6-0e8c-400b-bbba-9b559c011cfa,1,2026,945ce36f-2592-4a51-aee5-e663b9cf5cd0,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- Chat4 Faculty SUCCESS paths against disposable PostgreSQL > pins and deletes own-Section discussion with microsecond CAS, audit and denial

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: cbfbc752-ba2b-451c-9872-e8fd233660a0,1,2026,cab59f63-467c-4767-9f5d-2bb26398df60,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- Chat4 Faculty SUCCESS paths against disposable PostgreSQL > grades a published Section submission, publishes, denies stale/foreign/role, and blocks archive grade

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: 6c8b9412-b349-4836-b41b-c48b7cf7653b,1,2026,4b92aa70-bc80-410b-8dd3-6a86e1aa27db,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- Chat4 Faculty SUCCESS paths against disposable PostgreSQL > filters only persisted Faculty teaching deliveries and invalidates revoked assignments

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: ca258fc6-61c1-4846-8496-e1d70ec7858d,1,2026,04abf5cc-8470-4216-a9ed-839942696fe5,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- Chat4 Faculty SUCCESS paths against disposable PostgreSQL > projects real submission content from an authorized Faculty reader without widening scope

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: f8de3581-5b2c-463c-b7d2-9875cf052cf1,1,2026,6a7ff582-72cb-4318-828b-6e5eb7f41419,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- Chat4 Faculty SUCCESS paths against disposable PostgreSQL > pages actual Faculty grading submissions and rechecks publication and scope

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: feeaae6c-8057-4a79-a68c-8b78c4e0c167,1,2026,5635586d-bec7-480e-9616-7783359a05d0,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- Chat4 Faculty SUCCESS paths against disposable PostgreSQL > reads a real Quiz attempt drill-in from strict search selectors without widening Section scope

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: 887fd846-e729-4a5a-a585-b705bc387477,1,2026,7400847c-1b5c-497e-8760-1aef6e059dce,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- … 16 more in this file

## tests/integration/hr-round-results.test.ts (1 failing)
- HR round table non-enumeration PG > reads only own published job rounds and masks wrong company/college/role

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
