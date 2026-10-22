# CI unit-test packet (round 5db)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/chat4-college-faculty-schedule-reassignment.test.ts (1 failing)
- College faculty schedule reassignment (disposable PostgreSQL)

  ```
  error: inconsistent types deduced for parameter $3
  ❯ node_modules/pg-pool/index.js:45:11
  ❯ tests/integration/chat4-college-faculty-schedule-reassignment.test.ts:42:3
  40|     [member,role]);
  41|   }
  42|   await pool.query("insert into academic_periods(id,college_id,name,co…
  |   ^
  43|    [ids.period,SEED_IDS.collegeA,tag]);
  ```

## tests/integration/core-admin-domains.test.ts (1 failing)
- core admin domains against PostgreSQL > persists the superadmin organization -> college -> department flow

  ```
  AssertionError: expected [ { …(14) } ] to deeply equal ArrayContaining{…}
  - Expected
  + Received
  - ArrayContaining [
  -   ObjectContaining {
  -     "code": "ITEST-CORE",
  + [
  +   {
  ```

## tests/integration/hr-company-report-export.test.ts (1 failing)
- HR company report export PostgreSQL > exports own company's drives but not another company's in the same college

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

## tests/integration/learner-applications-mobile.test.ts (1 failing)
- L14-024 own persisted application on small screen > shows authorized application with active bookmarked filters

  ```
  AssertionError: expected 'Show application filters (1 active)' to contain '2 active'
  Expected: "2 active"
  Received: "Show application filters (1 active)"
  ```
