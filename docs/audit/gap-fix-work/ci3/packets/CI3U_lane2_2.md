# CI unit-test packet (round 3)

These INTEGRATION tests (real PostgreSQL in CI, all migrations applied) FAIL on main. Read the CI workflow .github/workflows/ci.yml for the DB setup. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/learner-career-calendar-url.test.ts (1 failing)
- calendar URL filters over persisted own rounds > summarizes own month events by persisted kind

  ```
  AssertionError: expected { total: 1, assessments: +0, …(3) } to deeply equal { total: 1, assessments: +0, …(2) }
  - Expected
  + Received
  {
  "assessments": 0,
  "interviews": 1,
  "other": 0,
  +   "talks": 0,
  ```

## tests/integration/mentor-task-create.test.ts (2 failing)
- Mentor task create — migrated PostgreSQL > reads actual team counts and one registered requested meeting

  ```
  
  ```
- Mentor task create — migrated PostgreSQL > creates a TODO task exactly once, audits and rejects forged/foreign/stale writes

  ```
  error: update or delete on table "project_meetings" violates foreign key constraint "project_meeting_history_project_fk" on table "project_meeting_history"
  ❯ node_modules/pg-pool/index.js:45:11
  ❯ cleanup tests/integration/mentor-task-create.test.ts:52:7
  50|       "project_tasks","project_sprints","project_releases",
  51|     ]){
  52|       await pool.query("delete from "+table+" where project_id=any($1:…
  |       ^
  53|     }
  ```

## tests/integration/placements-role-options.test.ts (1 failing)
- Placement multi-role drives > keeps a primary compatibility role and binds each learner application to an exact role option

  ```
  error: update or delete on table "placement_applications" violates foreign key constraint "placement_college_application_stages_application_id_placement_a" on table "placement_college_application_stages"
  ❯ node_modules/pg-pool/index.js:45:11
  ❯ cleanup tests/integration/placements-role-options.test.ts:114:3
  112|     "delete from placement_application_status_history",
  113|   );
  114|   await pool.query(
  |   ^
  115|     "delete from placement_applications",
  ```

## tests/integration/storage-files-courses-db.test.ts (13 failing)
- assignment submission files against PostgreSQL > runs upload, verification, submit, grants and audit end to end

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: 341fba7d-0eed-4475-9305-f8e2161654ee,1,2026,1ad0ce0e-5f23-4191-8ae9-5589c58beb56,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- assignment submission files against PostgreSQL > quarantines content that does not match its declared type and deletes the object

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: 5f17a1a4-42c9-4e9b-8ac9-2ca8e76ffb77,1,2026,470de514-d593-4c77-b9c7-2fd43f134717,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- assignment submission files against PostgreSQL > fails a tampered upload (wrong size) and an unfinished upload without serving anything

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: 56ececbc-5383-48c3-b6a0-1fd13784d606,1,2026,1b2eae49-41d9-4eb1-a081-3590bab1a344,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- assignment submission files against PostgreSQL > does not serve a READY file whose object was overwritten after attestation

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: 8a661f22-c654-446a-8bac-78808cc17dc8,1,2026,74ab0aa1-1f34-48dd-abd8-e1b0fb5e46e9,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- assignment submission files against PostgreSQL > enforces per-learner staging limits, ownership and non-leaking denials

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: 6a9b0921-37dc-4324-bd88-b0d91cb11504,1,2026,84650810-2ad2-4050-86e5-784dcf7fbdeb,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- assignment submission files against PostgreSQL > lets the learner remove a staged file

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: d26ccac3-0c9a-416e-aec4-44bf7da65502,1,2026,c298a87d-3f47-4376-9149-85b15b1ca5e0,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- database guarantees for submission files > rejects a FILE submission without a READY file at commit and cross-college owner pairs

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: 675d5036-427c-41a1-bd79-ef646d49287a,1,2026,0bc59fd6-fbb8-42d0-8e17-6007f8d9673c,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- database guarantees for submission files > checks sizes, statuses, key scope and the READY invariant

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: 27ece8eb-093a-49b0-8b59-b26638594afb,1,2026,4ddb73a5-5e45-4ff5-932e-e77c90d7b44f,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- lesson videos against PostgreSQL > keeps a verified draft away from learners until it is published and visible

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: 6ae276fa-1966-4fa1-a71e-805954022e8e,1,2026,89442abd-a0f6-474b-b43b-fb1df5d5fa10,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- lesson videos against PostgreSQL > restricts management to admins and faculty teaching that delivery

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: afa44cc0-5f0f-4541-ae22-24727befc791,1,2026,d52fef5c-17c2-41cd-8a44-976930330fc4,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- … 3 more in this file
