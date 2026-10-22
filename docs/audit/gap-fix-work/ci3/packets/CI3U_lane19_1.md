# CI unit-test packet (round 3)

These INTEGRATION tests (real PostgreSQL in CI, all migrations applied) FAIL on main. Read the CI workflow .github/workflows/ci.yml for the DB setup. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/college-activity-audit-scope.test.ts (2 failing)
- College Admin Activity Log PG cursor and denial > paginates 27 own events and never reads another college

  ```
  AssertionError: expected [ { event: { …(34) }, …(1) }, …(26) ] to have a length of 25 but got 27
  - Expected
  + Received
  - 25
  + 27
  ```
- College Admin Activity Log PG cursor and denial > filters persisted event module, importance and exact event type before cursor pagination

  ```
  AssertionError: expected [ { event: { …(34) }, …(1) }, …(26) ] to have a length of 25 but got 27
  - Expected
  + Received
  - 25
  + 27
  ```

## tests/integration/courses-c3-progress.test.ts (7 failing)
- courses C3 learner progress against PostgreSQL > discovers only the learner's exact delivery and builds a filtered learning workspace

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: 1266b324-e524-4a38-93f3-2f8745911a4d,1,2026,c0838ef7-d62a-4a92-a544-2fbbda4c1d79,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- courses C3 learner progress against PostgreSQL > keeps media progress monotonic and completes only from authored duration

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: 81d12f24-7f48-43ed-a22c-26fc9b843712,1,2026,cd44d7eb-566c-4396-8ab8-a0ce889bf943,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- courses C3 learner progress against PostgreSQL > tracks manual resource completion and recalculates continue-learning summary

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: 3f2711a6-d11b-44df-aca1-1641798729af,1,2026,db85d1fa-f0c9-46e1-9f41-13e1a7b49407,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- courses C3 learner progress against PostgreSQL > keeps scheduled content locked and Course discussions isolated to the learner's delivery

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: b6a88668-555f-476c-b69b-c8f364460449,1,2026,016b6338-e9cd-42f0-b967-cc690c02b04d,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- courses C3 learner progress against PostgreSQL > keeps completed-semester Courses readable but blocks new learner mutations

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: 08678352-379d-4891-b554-01f8f74168b5,1,2026,2d34e600-e5e0-4781-a7a8-eb3907b57b3c,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- courses C3 learner progress against PostgreSQL > rejects progress outside the learner audience and enforces database uniqueness

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: 927a83fe-1b8a-4caf-b350-7c4f1a9f415b,1,2026,eb025b78-28aa-4c73-b6e5-918fe780535a,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- courses C3 learner progress against PostgreSQL > admin retake preserves first attempt, resets only this learner's Section and detects stale confirmation

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: 6aeeff69-a19f-40d8-8da2-1c1b24735ee0,1,2026,d2ac65fa-5b1e-445e-ac19-41499291d432,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```

## tests/integration/hr-company-overview.test.ts (1 failing)
- HR company profile PG isolation > builds employer profile footprint without foreign-company or foreign-college rows

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

## tests/integration/learner-application-withdrawal.test.ts (1 failing)
- Learner application withdrawal on fresh PostgreSQL fixtures > withdraws its own submitted application and atomically records reason + audit exactly once

  ```
  ZodError: [
  {
  "code": "unrecognized_keys",
  "keys": [
  "metadata"
  ],
  "path": [],
  "message": "Unrecognized key: \"metadata\""
  ```
