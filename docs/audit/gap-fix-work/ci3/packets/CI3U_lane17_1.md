# CI unit-test packet (round 3)

These INTEGRATION tests (real PostgreSQL in CI, all migrations applied) FAIL on main. Read the CI workflow .github/workflows/ci.yml for the DB setup. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/chat7-mentor-meeting-facilitation.test.ts (3 failing)
- MEN-projects-meetings-27 persisted facilitator lifecycle > MEN-projects-meetings-27 keeps saved and cancelled private drafts hidden from learners

  ```
  AssertionError: expected 1 to be +0 // Object.is equality
  - Expected
  + Received
  - 0
  + 1
  ```
- MEN-projects-meetings-27 persisted facilitator lifecycle > MEN-projects-meetings-27 keeps saved and cancelled private drafts hidden from learners

  ```
  
  ```
- MEN-projects-meetings-27 persisted facilitator lifecycle > MEN-projects-meetings-27 persists facilitator notes without leaking them into learner workspace

  ```
  error: update or delete on table "project_meetings" violates foreign key constraint "project_meeting_history_project_fk" on table "project_meeting_history"
  ❯ node_modules/pg-pool/index.js:45:11
  ❯ cleanup tests/integration/chat7-mentor-meeting-facilitation.test.ts:47:4
  45|    "project_meetings","project_members","project_resources","project_t…
  46|    "project_sprints","project_releases"]){
  47|    await pool.query("delete from "+table+" where project_id=any($1::uu…
  |    ^
  48|   }
  ```

## tests/integration/courses-c1.test.ts (3 failing)
- courses C1 against PostgreSQL > runs catalog -> offering -> section delivery -> teaching assignment lifecycle

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: b107b0c4-f6ac-4632-83e3-69cd46b66f40,1,2026,dfc3a184-91cc-4f9b-84b5-d3624494c22e,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- courses C1 against PostgreSQL > enforces structural admin authority and exact tenant/cohort/period scope

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: ca6c8ed0-2502-43cc-baec-91a71760b440,1,2026,49939aeb-69fc-4b1a-8e06-2ec456ed6f43,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- courses C1 against PostgreSQL > uses database constraints for duplicate and concurrent-looking writes

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: 0c0914b1-00cf-4a6b-9d61-d3710b3eeac7,1,2026,01078b2e-4576-4a27-8a7c-f8f08278aebf,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```

## tests/integration/hr-applicant-export.test.ts (1 failing)
- recruiter CSV exact company scope > authorizes own job and masks a different employer and wrong role

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

## tests/integration/hr-today.test.ts (1 failing)
- HR Today PG scope > surfaces authorized employer job only; foreign relationship, college and roles denied

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
