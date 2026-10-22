# CI unit-test packet (round 3)

These INTEGRATION tests (real PostgreSQL in CI, all migrations applied) FAIL on main. Read the CI workflow .github/workflows/ci.yml for the DB setup. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/academics-core.test.ts (3 failing)
- academics A1 against PostgreSQL > builds the Program -> Period -> Cohort -> Section hierarchy

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: 0208258a-3a5d-4e9f-9623-21d5329f6367,1,2026,60985ede-627e-4de1-9521-79325cf4c115,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- academics A1 against PostgreSQL > rejects cross-college academic relationships and unauthorized mutation

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: 9eb76eee-36ea-4a78-9eb9-9c06d170fb03,1,2026,d7665c73-84ef-4fcc-be60-3ea6b22b262d,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- academics A1 against PostgreSQL > rejects invalid lifecycle transitions, duplicates and database-invalid values

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: 4d50f9a6-0513-412d-ac30-1862980c4430,1,2026,3f4a6220-15ba-49cd-8c96-a90767775148,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```

## tests/integration/college-drive-views-scope.test.ts (2 failing)
- College Admin drive read views: isolated PostgreSQL > resolves the drive, keeps selected null, and does not leak a foreign job

  ```
  AssertionError: expected { applications: 1, …(5) } to deeply equal { applications: 1, …(3) }
  - Expected
  + Received
  {
  "applications": 1,
  +   "external": 0,
  "offered": 0,
  -   "selected": null,
  ```
- College Admin drive read views: isolated PostgreSQL > lists persisted own-college interview round with unknown individual slots and denies foreign job

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```

## tests/integration/courses-c4c-assessment-progress.test.ts (2 failing)
- courses C4C assessment aggregation > moves Continue Learning across content, assignment and quiz in deterministic order

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: 8f7ac3c1-76b8-4595-a672-b0bc938f0d71,1,2026,6236bacf-eba1-4fe3-8ae1-08826e931976,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- courses C4C assessment aggregation > keeps overdue assignments actionable while expired quizzes are MISSED

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: af3cae7e-7afa-4f87-92da-134acf0f9efe,1,2026,a4528dc8-cc9b-465e-94a7-532c6fa065f1,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```

## tests/integration/hr-drive-draft.test.ts (1 failing)
- Recruiter authorized Hire Again preview > copies a company-owned job while hiding the same job from foreign company, college and wrong role

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
