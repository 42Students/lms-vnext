# CI unit-test packet (round 3)

These INTEGRATION tests (real PostgreSQL in CI, all migrations applied) FAIL on main. Read the CI workflow .github/workflows/ci.yml for the DB setup. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/admin-assignment-directory.test.ts (1 failing)
- Super Admin assignments read fixture PG > finds own assignment, hides foreign college record, rejects wrong role

  ```
  Error: Failed query: select "assessment_id", "title", "course_name_alias", "code", "lesson_name_alias", "id", "offering_id_alias", "status", "due_at", "delivery_id", "max_points", "created_by_user_id", "updated_at", "id" from (select "course_assignments"."id" as "assessment_id", "course_assignments"
  params: 20000000-0000-4000-8000-000000000001,20000000-0000-4000-8000-000000000001,20000000-0000-4000-8000-000000000001,%Admin Assignment 8e1b5d79-3%,20
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```

## tests/integration/college-faculty-detail-scope.test.ts (1 failing)
- College Faculty Detail DB ownership > denies non-admin and forged college context

  ```
  AssertionError: promise resolved "{ person: { …(6) }, …(5) }" instead of rejecting
  - Expected
  + Received
  - Error {
  -   "message": "rejected promise",
  + {
  +   "assignments": [
  +     {
  ```

## tests/integration/courses-ui2a-faculty.test.ts (9 failing)
- courses UI2A faculty read model > discovers only exact active teaching deliveries and composes shared plus Section items

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: 0c74a701-6a7a-4821-b427-f70d6df4ba88,1,2026,0003a687-77c5-48c6-8c32-f7793ab72140,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- courses UI2A faculty read model > builds standalone Faculty All Quizzes and All Assignments from teaching scopes

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: 0dd3104e-54a8-48f4-b5d9-80053ac75e11,1,2026,a973e8b4-0c1f-4180-b07c-9fd0464e0ec2,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- courses UI2A faculty read model > keeps Faculty Class Schedule Section-scoped, includes general events and links exact deliveries

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: 828ce12b-86ad-4b9a-a59a-78ad06bc8b56,1,2026,cb00f34f-c928-45ae-9450-9dde48e609f0,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- courses UI2A faculty read model > round-trips Faculty attendance marking into the learner view and supports correction back to present

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: b974b33c-f90b-4d1b-8198-881e4bcd4d8f,1,2026,677b7c15-6b4d-4f75-a06c-109e670cc02e,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- courses UI2A faculty read model > keeps Faculty attendance scheduling and marking inside exact teaching scope

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: 4984bc6a-1b7b-467e-8842-561db7b6f6ef,1,2026,fdb4ea7f-47b7-4d0b-95f1-8c0eca45a954,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- courses UI2A faculty read model > reports current eligible learners who have not submitted or attempted

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: 7fccd2f9-84af-4a34-8729-10a0cee4729e,1,2026,1effbbdf-6bdf-463c-b34e-2b619a92619f,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- courses UI2A faculty read model > uses the exact delivery roster for Students and keeps Faculty discussion moderation section-scoped

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: c83874e9-ccda-468d-a40d-8a2f6e99708d,1,2026,afcfcdc8-326d-4e79-bcc2-effb805633bd,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- courses UI2A faculty read model > pages a busy Faculty discussion without skipping microsecond-neighbor messages

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: e9c4b902-ec96-438b-a26e-e242bc55c230,1,2026,95409809-ed97-4dfb-bfa3-4044e9e6fd1d,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- courses UI2A faculty read model > gives College Admin a scoped attendance grid and correction path without granting Faculty admin access

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: b9abf708-b896-4aae-8a7e-55099f435cfb,1,2026,df0284d4-c3dc-428b-a21d-f0ad31280e07,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```

## tests/integration/hr-drive-list-structured-filters.test.ts (1 failing)
- HR drive structured filter PG > filters a new own-company job but excludes other company/college and wrong role

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
