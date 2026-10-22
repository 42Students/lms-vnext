# CI unit-test packet (round 5db)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/learner-offer-pending-request.test.ts (2 failing)
- learner offer extension request pending read > shows exact own pending offer without inferring approval

  ```
  
  ```
- learner offer extension request pending read > denies foreign college, suspended and wrong-role principal

  ```
  error: null value in column "learner_membership_id" of relation "placement_learner_requests" violates not-null constraint
  ❯ node_modules/pg-pool/index.js:45:11
  ❯ tests/integration/learner-offer-pending-request.test.ts:23:3
  21|     [offerId,fixture.applicationId,SEED_IDS.collegeAdminUser,"2030-11-…
  22|   );
  23|   await pool.query(
  |   ^
  24|     "INSERT INTO placement_learner_requests(id,application_id,request_…
  ```

## tests/integration/placements-loi-kind.test.ts (2 failing)
- placement offer kind (letter of intent) > records an LOI distinctly, defaults to OFFER, stays idempotent per kind and notifies the learner

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
- placement offer kind (letter of intent) > defaults an omitted kind to OFFER, rejects unknown kinds and foreign colleges

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

## tests/integration/projects-p5-lifecycle.test.ts (2 failing)
- Projects P5 lifecycle > ships a release only after every sprint completes and completes the project on the last release

  ```
  AssertionError: expected ProjectsServiceError: PROJECT_RELEASE_INV… { code: '…' } to match object { Object (code) }
  (1 matching property omitted from actual)
  - Expected
  + Received
  - {
  -   "code": "PROJECT_RELEASE_HAS_OPEN_SPRINTS",
  + ProjectsServiceError {
  +   "code": "PROJECT_RELEASE_INVALID_STATE",
  ```
- Projects P5 lifecycle > requires un-shipping before reopening a completed sprint

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

## tests/integration/super-admin-videos-directory.test.ts (1 failing)
- Super Admin videos directory disposable PostgreSQL > returns only videos, hides other kinds and foreign-college content

  ```
  Error: You tried to reference "hasLegacyRichContent" field from a subquery, which is a raw SQL field, but it doesn't have an alias declared. Please add an alias to the field using ".as('alias')" method.
  ❯ SelectionProxyHandler.get node_modules/src/selection-proxy.ts:95:10
  ❯ node_modules/src/pg-core/query-builders/select.ts:131:16
  ```
