# CI unit-test packet (round 5db)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/lecture-halls.test.ts (1 failing)
- lecture halls: authorization > denies another college's admin and a learner, for every operation

  ```
  AssertionError: promise rejected "AuthorizationError: Missing permission: a…" instead of resolving
  ❯ tests/integration/lecture-halls.test.ts:289:6
  287|     await expect(
  288|       listLectureHalls(learnerA.context, {collegeId:SEED_IDS.collegeA}…
  289|     ).resolves.toMatchObject({collegeId:SEED_IDS.collegeA});
  |      ^
  290|     for (const denied of [adminB, learnerA]) {
  291|       await expect(
  ```

## tests/integration/placements-p6b-rounds.test.ts (2 failing)
- Placement P6B rounds > retains cancelled history without consuming the active sequence

  ```
  AssertionError: expected 2 to be 1 // Object.is equality
  - Expected
  + Received
  - 1
  + 2
  ```
- Placement P6B rounds > makes closed jobs read-only for round operations

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

## tests/integration/recruiter-job-non-enumeration.test.ts (1 failing)
- HR employer job non-enumeration (isolated PG) > shows own job, but masks foreign-company, foreign-college and wrong-role access as not found

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
