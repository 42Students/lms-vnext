# CI unit-test packet (round 3)

These INTEGRATION tests (real PostgreSQL in CI, all migrations applied) FAIL on main. Read the CI workflow .github/workflows/ci.yml for the DB setup. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/chat4-college-academic-cross-tenant-pg.test.ts (1 failing)
- COL-academics-scope-tenant-PG-01 forged but FK-valid tenant relationships

  ```
  error: inconsistent types deduced for parameter $3
  ❯ node_modules/pg-pool/index.js:45:11
  ❯ tests/integration/chat4-college-academic-cross-tenant-pg.test.ts:47:4
  45|    [ids.periodA,SEED_IDS.collegeA,"a"],[ids.periodB,SEED_IDS.collegeB,…
  46|   ]){
  47|    await pool.query(
  |    ^
  48|     "insert into academic_periods(id,college_id,name,code,start_date,e…
  ```

## tests/integration/college-section-lifecycle.test.ts (1 failing)
- College class lifecycle disposable PostgreSQL > refuses archive if any scheduled session history exists

  ```
  AssertionError: expected CollegeSectionLifecycleError: CLASS_HAS_S… { code: '…' } to match object { code: 'CLASS_HAS_DEPENDENCIES' }
  (1 matching property omitted from actual)
  - Expected
  + Received
  - {
  -   "code": "CLASS_HAS_DEPENDENCIES",
  + CollegeSectionLifecycleError {
  +   "code": "CLASS_HAS_SCHEDULE",
  ```

## tests/integration/faculty-c4-reports-audit-contact.test.ts (5 failing)
- Faculty registered report/history positive and scope denials > reads exact Section moderation history with real persisted pin/deletion audit

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: abfa5b24-fa2a-4cad-8e4f-1fbec9f79cab,1,2026,9610879c-397d-46d6-a49e-a529b3f1d555,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- Faculty registered report/history positive and scope denials > loads a real current teaching Section Overview with accurate no-mark/no-assessment signals

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: 56ad0892-8586-4575-b545-0382d6bc25a0,1,2026,5241c80c-dd44-483f-9e97-fdfff10a3afc,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- Faculty registered report/history positive and scope denials > reports persisted current Section roster and unknown attendance without invented scores

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: 446a2347-23cc-48cb-afa6-37b4e0ddc8b1,1,2026,5a763864-f029-44f0-996b-abd21aa61f84,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- Faculty registered report/history positive and scope denials > reads exactly one enrolled Section learner and denies out-of-roster, stale and foreign scopes

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: 0c630e59-8ade-4a0b-a59a-8a454c8eecba,1,2026,a485cc27-23dc-459d-ae9e-176d78d2a79e,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- Faculty registered report/history positive and scope denials > marks attendance, requires a reason for corrections, rejects stale tokens and retains audit history

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: 32dc5215-3076-48c7-97b9-f01205e888d2,1,2026,e1fa1f34-9181-4683-8005-0dd28b6abdee,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```

## tests/integration/hr-own-company-policy.test.ts (1 failing)
- HR forged cross-company grant is non-leaking > returns own job but not a different company's job even with both relationship grants

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
