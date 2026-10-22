# CI unit-test packet (round 5db)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/chat11-college-project-roster-retry.test.ts (6 failing)
- IIT Dharwad College Admin roster retries and concurrent tabs (PostgreSQL) > PROJ-COL-RETRY-01 a repeat request with the original stale token is a harmless no-op

  ```
  
  ```
- IIT Dharwad College Admin roster retries and concurrent tabs (PostgreSQL) > PROJ-COL-STALE-03 a genuinely different stale request is refused, preserving the first write

  ```
  
  ```
- IIT Dharwad College Admin roster retries and concurrent tabs (PostgreSQL) > PROJ-COL-DOUBLE-02 duplicate concurrent admin writes converge on one learner and one audit/notification

  ```
  
  ```
- IIT Dharwad College Admin roster retries and concurrent tabs (PostgreSQL) > PROJ-COL-TENANT-02 refuses revoked and wrong-college actors while retaining platform-wide Super Admin access

  ```
  
  ```
- IIT Dharwad College Admin roster retries and concurrent tabs (PostgreSQL) > PROJ-COL-ARCHIVE-01 makes archived projects read-only for membership and mentor mutations

  ```
  
  ```
- IIT Dharwad College Admin roster retries and concurrent tabs (PostgreSQL) > PROJ-COL-TENANT-01 refuses a wrong-tenant learner without modifying the roster

  ```
  error: operator does not exist: uuid = text
  ❯ node_modules/pg-pool/index.js:45:11
  ❯ cleanup tests/integration/chat11-college-project-roster-retry.test.ts:35:3
  33|   await pool.query("delete from in_app_notifications where event_id in…
  34|   await pool.query("delete from activity_events where metadata->>'proj…
  35|   await pool.query("delete from project_members where project_id in ("…
  |   ^
  36|   await pool.query("delete from project_resources where project_id in …
  ```

## tests/integration/college-section-lifecycle.test.ts (1 failing)
- College class lifecycle disposable PostgreSQL > refuses archive if any scheduled session history exists

  ```
  AssertionError: expected CollegeSectionLifecycleError: CLASS_HAS_S… { code: '…' } to match object { code: 'CLASS_HAS_DEPENDENCIES' }
  (1 matching property omitted from actual)
  - Expected
  + Received
  - {
  -   "code": "CLASS_HAS_DEPENDENCIES",
  + CollegeSectionLifecycleError {
  +   "code": "CLASS_HAS_SCHEDULE",
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
