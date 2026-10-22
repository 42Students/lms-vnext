# CI unit-test packet (round 3)

These INTEGRATION tests (real PostgreSQL in CI, all migrations applied) FAIL on main. Read the CI workflow .github/workflows/ci.yml for the DB setup. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/learner-recent-course-activity.test.ts (1 failing)
- L2-016 recent course activity, own persisted completion > includes a just-recorded audited learner completion and never invents an update

  ```
  AssertionError: expected '0' to be '1' // Object.is equality
  Expected: "1"
  Received: "0"
  ```

## tests/integration/placements-p3-jobs.test.ts (1 failing)
- Placement jobs > creates a tenant-owned draft and runs the publish/close/archive lifecycle

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

## tests/integration/projects-p6b-final-evaluation.test.ts (4 failing)
- Projects P6B final delivery and evaluation > PROJ-BREAK-submissions-10 supports draft editing, gates readiness and enforces exact saved revision

  ```
  ProjectsServiceError: PROJECT_RELEASE_INVALID_STATE
  ❯ shipProjectRelease src/modules/projects/lifecycle-service.ts:754:47
  752|     );
  753|   const expected=projectReleaseVersionInputSchema.parse(rawInput).expe…
  754|   if(scope.access==="MENTOR"&&!expected)throw new ProjectsServiceError…
  |                                               ^
  755|   const releaseId =
  756|     projectReleaseIdSchema.parse(releaseIdInput);
  ```
- Projects P6B final delivery and evaluation > keeps immutable review history across final submission versions

  ```
  ProjectsServiceError: PROJECT_RELEASE_INVALID_STATE
  ❯ shipProjectRelease src/modules/projects/lifecycle-service.ts:754:47
  752|     );
  753|   const expected=projectReleaseVersionInputSchema.parse(rawInput).expe…
  754|   if(scope.access==="MENTOR"&&!expected)throw new ProjectsServiceError…
  |                                               ^
  755|   const releaseId =
  756|     projectReleaseIdSchema.parse(releaseIdInput);
  ```
- Projects P6B final delivery and evaluation > locks approved delivery, audits mentor reopen, then permits exactly one new draft version

  ```
  ProjectsServiceError: PROJECT_RELEASE_INVALID_STATE
  ❯ shipProjectRelease src/modules/projects/lifecycle-service.ts:754:47
  752|     );
  753|   const expected=projectReleaseVersionInputSchema.parse(rawInput).expe…
  754|   if(scope.access==="MENTOR"&&!expected)throw new ProjectsServiceError…
  |                                               ^
  755|   const releaseId =
  756|     projectReleaseIdSchema.parse(releaseIdInput);
  ```
- Projects P6B final delivery and evaluation > creates one rubric evaluation only for an approved submission and exposes it to participants

  ```
  ProjectsServiceError: PROJECT_RELEASE_INVALID_STATE
  ❯ shipProjectRelease src/modules/projects/lifecycle-service.ts:754:47
  752|     );
  753|   const expected=projectReleaseVersionInputSchema.parse(rawInput).expe…
  754|   if(scope.access==="MENTOR"&&!expected)throw new ProjectsServiceError…
  |                                               ^
  755|   const releaseId =
  756|     projectReleaseIdSchema.parse(releaseIdInput);
  ```

## tests/integration/super-admin-resources-directory.test.ts (1 failing)
- Super Admin resources directory disposable PostgreSQL > returns only resources, hides other kinds and foreign-college content

  ```
  Error: You tried to reference "hasLegacyRichContent" field from a subquery, which is a raw SQL field, but it doesn't have an alias declared. Please add an alias to the field using ".as('alias')" method.
  ❯ SelectionProxyHandler.get node_modules/src/selection-proxy.ts:95:10
  ❯ node_modules/src/pg-core/query-builders/select.ts:131:16
  ```
