# CI unit-test packet (round 5db)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/mentor-calendar-filters.test.ts (1 failing)
- Mentor global calendar filters — migrated PostgreSQL > shows current same-college meetings, literal search and denied actors

  ```
  error: update or delete on table "project_meetings" violates foreign key constraint "project_meeting_history_project_fk" on table "project_meeting_history"
  ❯ node_modules/pg-pool/index.js:45:11
  ❯ cleanup tests/integration/mentor-calendar-filters.test.ts:43:7
  41|       "project_meetings","project_members","project_resources","projec…
  42|       "project_sprints","project_releases"]){
  43|       await pool.query("delete from "+table+" where project_id=any($1:…
  |       ^
  44|     }
  ```

## tests/integration/placements-p7-recruiters.test.ts (2 failing)
- Placement P7 recruiter identity and grants > hydrates exact employer grants without creating college memberships

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
- Placement P7 recruiter identity and grants > allows recruiter result staging but keeps final application with TPO

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

## tests/integration/sa-tenants-modules-27-academic-placements.test.ts (1 failing)
- SA-tenants-modules-27 academic policy Postgres scope > rejects mutation to foreign academic node before any write

  ```
  AssertionError: promise rejected "ZodError: [
  {
  "code": "custom",
  … { …(2) }" instead of resolving
  ```
