# CI unit-test packet (round 3)

These INTEGRATION tests (real PostgreSQL in CI, all migrations applied) FAIL on main. Read the CI workflow .github/workflows/ci.yml for the DB setup. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/academics-a2.test.ts (5 failing)
- academics A2 against PostgreSQL > preserves learner roster history across moves and promotions

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: 9b5fc06e-722b-436d-b477-84f79eb4e777,1,2026,d3e4756a-bd29-4f79-966f-65c6cc6c5ff4,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- academics A2 against PostgreSQL > enforces learner role, college, cohort and capacity boundaries

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: 8d1ba334-d966-4102-9ecc-e2652ebb42d5,1,2026,3088185d-8c66-4e86-b3e3-6947f5f42096,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- academics A2 against PostgreSQL > manages section Faculty responsibilities without creating course teaching assignments

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: da1d1676-a87d-43b1-ac05-4d87daabd8a4,1,2026,5effcc7a-c2db-4ea7-b00b-33d397d948f3,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- academics A2 against PostgreSQL > links scheduled classes to an exact Course delivery and exposes only the learner's active Section schedule

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: 492221e9-9af4-478f-9a50-5592313a3ddf,1,2026,65ede902-7385-45c3-808e-c7a9a6a8444b,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- academics A2 against PostgreSQL > keeps section schedule events inside period and faculty tenant boundaries

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: 4228f139-45b2-41d3-941c-fb4e45e042a7,1,2026,1a011dfb-b7b1-431b-af2c-cc74d12b0f78,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```

## tests/integration/college-dashboard-cards-scope.test.ts (2 failing)
- College dashboard cards registered PG > uses actual own-college persisted counts and fixed deep links

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
- College dashboard cards registered PG > uses different scoped counts for another college without leaking fixture

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

## tests/integration/courses-c4b-quizzes.test.ts (7 failing)
- courses C4B quizzes against PostgreSQL > keeps generic quizzes admin-owned, exact quizzes teacher-scoped and learner keys hidden

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: ec5fdcfa-57dd-48c4-b8f6-e08adcf31f3a,1,2026,abbe9d9a-ddcc-4e56-a69f-5449c52a28c7,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- courses C4B quizzes against PostgreSQL > scores exact answers, enforces attempt limits and freezes question changes after attempts

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: 9f679919-c7d0-4562-a447-05dc5a4cb1a2,1,2026,2b3d1a47-37b8-4421-a867-ac574ec36d95,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- courses C4B quizzes against PostgreSQL > requires close before result publication and preserves attempt snapshots

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: 03a83748-48c6-44b9-b319-1f0d66c66c2f,1,2026,f2c59591-015f-49a4-bf12-bb9f3fd875c0,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- courses C4B quizzes against PostgreSQL > allows only one concurrent final attempt and enforces database score bounds

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: 2a6d4df5-23be-4a27-8060-bced2ba242df,1,2026,483fd713-72eb-4777-8b50-d9134fb24461,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- courses C4B quizzes against PostgreSQL > rejects a quiz submission when a faculty close commits during the race

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: b9e80113-29ee-4ffa-b609-b3299d1d52de,1,2026,324f48d4-bc94-4954-be0a-78631da2a3e5,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- courses C4B quizzes against PostgreSQL > allows Faculty to replace draft Quiz questions but freezes structure after publish

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: 95bee0d2-764a-44a4-8efe-f24114696d15,1,2026,8a098c2e-bbd6-4ab8-85f3-026c845e1822,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- Faculty Quiz reordered bank persistence > stores visible question and option ordering with exact Section scoping

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: b6772e48-6f42-4a75-9a42-c42cada642b7,1,2026,ae370830-48fe-4c99-bf4e-ae8339bf84a4,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```

## tests/integration/hr-company-report-outcomes.test.ts (1 failing)
- HR report result privacy > never returns report data for wrong role or a recruiter without company grants

  ```
  AuthorizationError: Missing permission: placements.recruiter.read
  ❯ resolveRecruiterCompanyScope src/modules/placements/recruiter-company-team-service.ts:63:11
  61|   if (!hasActiveRecruiter(context) || !context.recruiter ||
  62|       context.recruiter.userId !== context.user.id) {
  63|     throw new AuthorizationError("placements.recruiter.read");
  |           ^
  64|   }
  65|   const choices = context.recruiter.grants;
  ```
