# CI unit-test packet (round 5db)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

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

## tests/integration/placements-tpo-operations.test.ts (1 failing)
- Placement TPO operations > prioritizes cross-job work into one deterministic queue

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

## tests/integration/super-admin-faculty-assignments-read.test.ts (1 failing)
- Super Admin faculty assignment PostgreSQL > resolves only selected-college teaching assignments and denies wrong role

  ```
  Error: Failed query: select "admin_teacher_assignment_id", "membership_id", "id", "id", "role", "started_at", "legacy_was_active", "deleted_at", "start_date", "end_date", "legacy_academic_year", "updated_at", "admin_teacher_assignment_ended_at", "admin_teacher_delivery_ended_at", "admin_teacher_name
  params: 20000000-0000-4000-8000-000000000001,20000000-0000-4000-8000-000000000001,20000000-0000-4000-8000-000000000001,10000000-0000-4000-8000-000000000001,20000000-0000-4000-8000-000000000001,%admin-teach-d037dc05%,%admin-teach-d037dc05%,%admin-teach-d037dc05%,25
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
