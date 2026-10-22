# CI unit-test packet (round 3)

These INTEGRATION tests (real PostgreSQL in CI, all migrations applied) FAIL on main. Read the CI workflow .github/workflows/ci.yml for the DB setup. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/chat4-college-faculty-schedule-reassignment.test.ts (1 failing)
- College faculty schedule reassignment (disposable PostgreSQL)

  ```
  error: inconsistent types deduced for parameter $3
  ❯ node_modules/pg-pool/index.js:45:11
  ❯ tests/integration/chat4-college-faculty-schedule-reassignment.test.ts:42:3
  40|     [member,role]);
  41|   }
  42|   await pool.query("insert into academic_periods(id,college_id,name,co…
  |   ^
  43|    [ids.period,SEED_IDS.collegeA,tag]);
  ```

## tests/integration/college-setup-checklist.test.ts (1 failing)
- College setup steps backed by real scoped PostgreSQL counts > increments only owning-college departments from a real persisted fixture

  ```
  Error: SETUP_COUNT_UNAVAILABLE:academic-periods
  ❯ src/modules/admin-ui/college-setup-checklist-model.ts:39:15
  37|       const count = counts[step.key];
  38|       if (count === undefined || !Number.isSafeInteger(count) || count…
  39|         throw new Error("SETUP_COUNT_UNAVAILABLE:" + step.key);
  |               ^
  40|       return {
  41|         key: step.key,
  ```

## tests/integration/faculty-live-mutation.test.ts (3 failing)
- Faculty live session create, edit, cancel with PostgreSQL > writes once with actor audit, denies collision, foreign and stale scopes

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: 7bccbced-59be-4e23-974e-02ed97376a47,1,2026,50eea590-41a9-4f1a-927b-f69b71c1a783,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- Faculty live scheduling persisted revocation > blocks a Faculty actor once the FACULTY role is removed from the database

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: 89a20e24-bf43-4c91-aa9b-d2dfdd3b4907,1,2026,1101a90c-bcaa-4b5e-acb3-9d1798bae36f,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- Faculty live class schedule event occupancy > rejects times already occupied by the same Section calendar

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: cdb4713d-c741-4435-9fcd-073886b8ea56,1,2026,c0ae3315-9451-4303-afef-7747b8da12e8,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```

## tests/integration/hr-recruiter-shared-contact-policy.test.ts (1 failing)
- HR round contact disclosure isolation (isolated PG) > authorizes own round, masks foreign company, foreign college and wrong role before any candidates are read

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
