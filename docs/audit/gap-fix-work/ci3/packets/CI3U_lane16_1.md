# CI unit-test packet (round 3)

These INTEGRATION tests (real PostgreSQL in CI, all migrations applied) FAIL on main. Read the CI workflow .github/workflows/ci.yml for the DB setup. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/chat7-learner-project-team.test.ts (1 failing)
- L21-010 exact learner final delivery tab > loads the own project final-delivery read behind canonical tab

  ```
  ProjectsServiceError: PROJECT_ACCESS_DENIED
  ❯ listProjectEvaluations src/modules/projects/evaluation-service.ts:386:11
  384|   // Approval of a delivery is not publication of its evaluation.
  385|   if (scope.access !== "ADMIN" && scope.access !== "MENTOR") {
  386|     throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  |           ^
  387|   }
  388|
  ```

## tests/integration/core-platform-acceptance.test.ts (1 failing)
- core platform pre-browser acceptance flow > runs the tenant, people, role, membership and isolation story against PostgreSQL

  ```
  AssertionError: expected [ { …(14) } ] to deeply equal [ ObjectContaining{…} ]
  - Expected
  + Received
  [
  {
  -     "code": "ACCEPT-CORE",
  +     "addressLine1": null,
  +     "addressLine2": null,
  ```

## tests/integration/hr-applicant-drawer.test.ts (1 failing)
- HR applicant drawer PG guard > authorizes own company drive, denies foreign employer and wrong-role before any detail projection

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

## tests/integration/hr-today-results-due.test.ts (1 failing)
- HR today results due PostgreSQL > reads own result due, not foreign-employer, foreign college or wrong role

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
