# CI unit-test packet (round 3)

These INTEGRATION tests (real PostgreSQL in CI, all migrations applied) FAIL on main. Read the CI workflow .github/workflows/ci.yml for the DB setup. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/learner-quiz-history.test.ts (1 failing)
- own learner quiz attempts and results on PostgreSQL > shows a persisted attempt, masks unpublished scores, then reveals only published results

  ```
  AssertionError: expected { …(21) } to match object { score: 6, maxScore: 10, …(1) }
  (18 matching properties omitted from actual)
  - Expected
  + Received
  {
  -   "maxScore": 10,
  -   "resultsVisible": true,
  -   "score": 6,
  ```

## tests/integration/placements-p1-companies.test.ts (4 failing)
- Placements P1 companies and employer relationships > shares canonical employer identity while isolating each college relationship

  ```
  
  ```
- Placements P1 companies and employer relationships > keeps placement management role-aware and cross-college closed

  ```
  
  ```
- Placements P1 companies and employer relationships > lists valid relationship owners and blocks employer archive while jobs still depend on it

  ```
  
  ```
- Placements P1 companies and employer relationships > supports tenant-private trust and owner state without mutating canonical identity

  ```
  error: update or delete on table "placement_jobs" violates foreign key constraint "placement_applications_job_id_placement_jobs_id_fk" on table "placement_applications"
  ❯ node_modules/pg-pool/index.js:45:11
  ❯ cleanup tests/integration/placements-p1-companies.test.ts:90:3
  88|
  89| async function cleanup() {
  90|   await pool.query(
  |   ^
  91|     "delete from placement_jobs",
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

## tests/integration/super-admin-live-classes-directory.test.ts (1 failing)
- Super Admin live classes directory disposable PostgreSQL > returns only live classes, hides other kinds and foreign-college content

  ```
  Error: You tried to reference "hasLegacyRichContent" field from a subquery, which is a raw SQL field, but it doesn't have an alias declared. Please add an alias to the field using ".as('alias')" method.
  ❯ SelectionProxyHandler.get node_modules/src/selection-proxy.ts:95:10
  ❯ node_modules/src/pg-core/query-builders/select.ts:131:16
  ```
