# CI unit-test packet (round 3)

These INTEGRATION tests (real PostgreSQL in CI, all migrations applied) FAIL on main. Read the CI workflow .github/workflows/ci.yml for the DB setup. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/learner-manual-content-completion.test.ts (1 failing)
- learner manual completion with fresh PostgreSQL actor and course > marks first completion, preserves timestamp on retry and updates own workspace

  ```
  AssertionError: expected { total: '0', …(2) } to match object { total: '1', …(2) }
  - Expected
  + Received
  {
  -   "actor_membership_id": "c1900577-cf81-4ad5-84d9-5b369944cc4c",
  -   "actor_user_id": "0ccdf5f3-343a-4399-9c8e-5237e604fefb",
  -   "total": "1",
  +   "actor_membership_id": null,
  ```

## tests/integration/placements-drive-day.test.ts (2 failing)
- Placement drive day > turns placement state into an operational progression view

  ```
  
  ```
- Placement drive day > keeps the drive-day command center tenant-scoped

  ```
  error: update or delete on table "placement_applications" violates foreign key constraint "placement_college_application_stages_application_id_placement_a" on table "placement_college_application_stages"
  ❯ node_modules/pg-pool/index.js:45:11
  ❯ cleanup tests/integration/placements-drive-day.test.ts:121:3
  119|     "delete from placement_application_status_history",
  120|   );
  121|   await pool.query(
  |   ^
  122|     "delete from placement_applications",
  ```

## tests/integration/project-notification-r01.test.ts (1 failing)
- COL-projects-R01 / LEARNER-projects-R01 notification persistence (PG) > notifies scoped mentor and learner for creation, join, assignment, comment, meetings, removal and archive

  ```
  ProjectsServiceError: PROJECT_MEETING_STALE_VERSION
  ❯ src/modules/projects/meeting-service.ts:395:14
  393|       (existing && !input.expectedUpdatedAt) ||
  394|       (!existing && !input.expectedProjectUpdatedAt)
  395|     )) throw new ProjectsServiceError("PROJECT_MEETING_STALE_VERSION");
  |              ^
  396|     if (existing && input.expectedUpdatedAt &&
  397|       existing.updatedAt.getTime()!==new Date(input.expectedUpdatedAt)…
  ```

## tests/integration/super-admin-faculty-assignments-read.test.ts (1 failing)
- Super Admin faculty assignment PostgreSQL > resolves only selected-college teaching assignments and denies wrong role

  ```
  Error: Failed query: select "admin_teacher_assignment_id", "membership_id", "id", "id", "role", "started_at", "legacy_was_active", "deleted_at", "start_date", "end_date", "legacy_academic_year", "updated_at", "admin_teacher_assignment_ended_at", "admin_teacher_delivery_ended_at", "admin_teacher_name
  params: 20000000-0000-4000-8000-000000000001,20000000-0000-4000-8000-000000000001,20000000-0000-4000-8000-000000000001,10000000-0000-4000-8000-000000000001,20000000-0000-4000-8000-000000000001,%admin-teach-0f73be31%,%admin-teach-0f73be31%,%admin-teach-0f73be31%,25
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
