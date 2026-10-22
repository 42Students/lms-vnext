# CI unit-test packet (round 3)

These INTEGRATION tests (real PostgreSQL in CI, all migrations applied) FAIL on main. Read the CI workflow .github/workflows/ci.yml for the DB setup. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/learner-attendance-calendar.test.ts (1 failing)
- Learner attendance month calendar against disposable PostgreSQL > distinguishes future scheduled, missing months and a status filter

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```

## tests/integration/mentor-risk-readiness.test.ts (1 failing)
- Mentor exact-project risk and readiness drill-ins — PostgreSQL > uses registered status evidence with role, tenant and strict-query denial

  ```
  error: update or delete on table "project_meetings" violates foreign key constraint "project_meeting_history_project_fk" on table "project_meeting_history"
  ❯ node_modules/pg-pool/index.js:45:11
  ❯ cleanup tests/integration/mentor-risk-readiness.test.ts:37:7
  35|       "project_meetings","project_members","project_resources","projec…
  36|       "project_sprints","project_releases"]){
  37|       await pool.query("delete from "+table+" where project_id=any($1:…
  |       ^
  38|     }
  ```

## tests/integration/placements-requests.test.ts (3 failing)
- Placement learner requests and exceptions > approves withdrawal atomically, scopes managers, and rejects conflicting duplicate payloads

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
- Placement learner requests and exceptions > allows reschedule only for an actual progressed participant and preserves the shared round schedule

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
- Placement learner requests and exceptions > extends an issued offer only through approval and blocks application withdrawal while the offer is active

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
