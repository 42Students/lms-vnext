# CI unit-test packet (round 3)

These INTEGRATION tests (real PostgreSQL in CI, all migrations applied) FAIL on main. Read the CI workflow .github/workflows/ci.yml for the DB setup. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/chat9-college-project-roster-atomic.test.ts (2 failing)
- COL-projects-15 atomic College Admin roster workflow > COL-projects-15 adds and removes a same-college learner with audit-backed atomic writes

  ```
  
  ```
- COL-projects-15 atomic College Admin roster workflow > COL-projects-15 rejects stale and non-learner roster targets without partial membership changes

  ```
  error: operator does not exist: uuid = text
  ❯ node_modules/pg-pool/index.js:45:11
  ❯ cleanup tests/integration/chat9-college-project-roster-atomic.test.ts:23:2
  21|  await pool.query("delete from in_app_notifications where event_id in …
  22|  await pool.query("delete from activity_events where metadata->>'proje…
  23|  await pool.query("delete from project_members where project_id in ("+…
  |  ^
  24|  await pool.query("delete from project_resources where project_id in (…
  ```

## tests/integration/courses-c2-learning.test.ts (3 failing)
- courses C2 learning structure against PostgreSQL > combines generic and exact-section content without leaking another delivery

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: 1dde3a34-d7e5-4788-9ea5-7218b81e43bf,1,2026,5aa3640c-2bec-4059-ab1f-6aacfeb99b7c,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- courses C2 learning structure against PostgreSQL > protects shared structure with admin authority and database uniqueness

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: 64b2beda-da6a-4d37-ae0a-305201ff17a7,1,2026,97575768-cd87-4d01-83aa-9ef78ee705b4,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- courses C2 learning structure against PostgreSQL > rejects caller-selected content scope that does not belong to the lesson offering

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: 729134ca-f5f0-4968-9700-35ce407804f4,1,2026,0edd3301-e3f7-4f72-9b9e-66ddc92d40fb,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```

## tests/integration/hr-calendar-results-due.test.ts (1 failing)
- HR results due calendar PostgreSQL > shows own scheduled round due but not foreign-company/foreign-college due

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

## tests/integration/identity-system-roles.test.ts (1 failing)
- identity context and system roles against PostgreSQL > resolves only memberships owned by the authenticated canonical user

  ```
  AssertionError: expected { …(5) } to match object { …(3) }
  (2 matching properties omitted from actual)
  - Expected
  + Received
  {
  "collegeId": "20000000-0000-4000-8000-000000000001",
  "id": "40000000-0000-4000-8000-000000000002",
  "roles": [
  ```
