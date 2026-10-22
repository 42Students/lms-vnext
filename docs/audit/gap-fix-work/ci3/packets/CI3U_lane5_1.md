# CI unit-test packet (round 3)

These INTEGRATION tests (real PostgreSQL in CI, all migrations applied) FAIL on main. Read the CI workflow .github/workflows/ci.yml for the DB setup. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/admin-college-rule-lifecycle.test.ts (1 failing)
- Super Admin audited college module write transaction in isolated PostgreSQL > supports SET, LOCK, idempotence, optimistic conflict, INHERIT and exact scoped audit

  ```
  AuthorizationError: Missing permission: college.manage
  ❯ requirePermission src/modules/permissions/policy.ts:308:11
  306| ) {
  307|   if (!can(context, permission, resource)) {
  308|     throw new AuthorizationError(permission);
  |           ^
  309|   }
  310| }
  ```

## tests/integration/college-group-rule-preview-denial.test.ts (1 failing)
- College group rule preview — isolated PostgreSQL > reads valid rule matches, prevents foreign college and non-admin visibility, and never writes

  ```
  AssertionError: expected [Function] to throw error including 'ROLLBACK_GROUP_RULE_PREVIEW' but got 'Failed query: insert into learner_pro…'
  - Expected
  + Received
  - ROLLBACK_GROUP_RULE_PREVIEW
  + Failed query: insert into learner_program_enrollments
  +         (id,membership_id,program_id,cohort_id,status)
  +         values ($1,$2,
  +           $3,$4,'ACTIVE')
  ```

## tests/integration/db05-course-authorization-races.test.ts (3 failing)
- DB05 transactional authoring authorization against PostgreSQL > rejects an offering after its chosen academic period closes

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: eeecdfb4-6ba9-47b8-baca-99cf1cd0590a,1,2026,254bbebf-64e3-42e4-b854-7fb360553961,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- DB05 transactional authoring authorization against PostgreSQL > rejects a delivery after its authorized section archives

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: 8e18cf0a-fb15-4a99-bdcf-dd998b2ca65a,1,2026,6249e5b5-e44e-48c4-bda9-e7602e7020c6,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- DB05 transactional authoring authorization against PostgreSQL > rejects a teacher assignment after FACULTY role is revoked

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: 397e9b8a-d34a-4b19-9d45-7c116513ad94,1,2026,7415c1bb-fb54-442c-b0ea-a9a7055e3aa8,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```

## tests/integration/hr-drive-overview.test.ts (1 failing)
- HR Drive Overview PG guard > allows own drive summary, masks foreign company/college and wrong-role

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
