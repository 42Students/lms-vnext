# CI unit-test packet (round 7db)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/hr-drive-overview.test.ts (1 failing)
- HR Drive Overview PG guard > allows own drive summary, masks foreign company/college and wrong-role

  ```
  PlacementsServiceError: PLACEMENT_JOB_NOT_FOUND
  ❯ getRecruiterPlacementWorkspace src/modules/placements/recruiter-workspace-service.ts:126:11
  124|     scope.job.archivedAt !== null
  125|   ) {
  126|     throw new PlacementsServiceError(
  |           ^
  127|       "PLACEMENT_JOB_NOT_FOUND",
  128|     );
  ```

## tests/integration/projects-placements-pg-harness-boundaries.test.ts (2 failing)
- PROJ-HARNESS role/tenancy and concurrent PostgreSQL fixture boundaries > PROJ-HARNESS-TENANCY-17 sibling college in the same org never inherits project or placement rights

  ```
  AssertionError: expected [ Array(1) ] to have a length of +0 but got 1
  - Expected
  + Received
  - 0
  + 1
  ```
- PROJ-HARNESS role/tenancy and concurrent PostgreSQL fixture boundaries > PROJ-HARNESS-35 placements fixture rejects learner-only and suspended TPO initiators

  ```
  AssertionError: expected [ Array(1) ] to have a length of +0 but got 1
  - Expected
  + Received
  - 0
  + 1
  ```
