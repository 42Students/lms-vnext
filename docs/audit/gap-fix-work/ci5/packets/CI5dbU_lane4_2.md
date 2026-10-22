# CI unit-test packet (round 5db)

These tests FAIL in CI on main. For each failing assertion decide:
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

## tests/integration/projects-p7a-resources-readiness.test.ts (3 failing)
- Projects P7A resources and readiness > keeps template provenance separate from mentor-added resources

  ```
  AssertionError: expected { …(27) } to match object { Object (templateKey, sequence, ...) }
  (24 matching properties omitted from actual)
  - Expected
  + Received
  {
  "sequence": 1,
  "status": "ACTIVE",
  -   "templateKey": null,
  ```
- Projects P7A resources and readiness > derives readiness from normalized lifecycle and final-delivery state

  ```
  
  ```
- Projects P7A resources and readiness > enforces the no-empty-resource rule on create and update

  ```
  error: update or delete on table "project_instances" violates foreign key constraint "project_resource_audit_project_id_fkey" on table "project_resource_audit"
  ❯ node_modules/pg-pool/index.js:45:11
  ❯ cleanup tests/integration/projects-p7a-resources-readiness.test.ts:241:3
  239|      )`,
  240|   );
  241|   await pool.query(
  |   ^
  242|     "delete from project_instances where slug like 'p7a-%'",
  ```

## tests/integration/tpo-no-show-history-denials.test.ts (1 failing)
- TPO learner history and no-show PostgreSQL boundaries > returns no learner history for unknown and cross-college membership

  ```
  AssertionError: promise rejected "AuthorizationError: Missing permission: p…" instead of resolving
  ❯ tests/integration/tpo-no-show-history-denials.test.ts:60:8
  58|     await expect(getTpoStudentPlacementHistory(foreign, {
  59|       membershipId: SEED_IDS.learnerCollegeAMembership,
  60|     })).resolves.toBeNull();
  |        ^
  61|   });
  62|
  ```
