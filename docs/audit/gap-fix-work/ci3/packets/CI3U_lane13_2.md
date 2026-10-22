# CI unit-test packet (round 3)

These INTEGRATION tests (real PostgreSQL in CI, all migrations applied) FAIL on main. Read the CI workflow .github/workflows/ci.yml for the DB setup. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/learner-support-cancel.test.ts (2 failing)
- learner pending request cancellation, own isolated audit > cancels once with recorded status/audit and denies stale replay

  ```
  
  ```
- learner pending request cancellation, own isolated audit > denies foreign college, suspended and wrong-role cancellation

  ```
  error: null value in column "learner_membership_id" of relation "placement_learner_requests" violates not-null constraint
  ❯ node_modules/pg-pool/index.js:45:11
  ❯ tests/integration/learner-support-cancel.test.ts:17:3
  15|   f=newLearnerCareerCalendarFixture();await seedLearnerCareerCalendarF…
  16|   requestId=randomUUID();
  17|   await pool.query("INSERT INTO placement_learner_requests(id,applicat…
  |   ^
  18|     [requestId,f.applicationId,"APPLICATION_WITHDRAWAL:"+f.application…
  ```

## tests/integration/placements-p4-eligibility.test.ts (5 failing)
- Placement P4 eligibility > distinguishes missing evidence, hard failure and verified eligibility

  ```
  
  ```
- Placement P4 eligibility > lets managers read normalized candidate evidence only inside their placement tenant

  ```
  
  ```
- Placement P4 eligibility > supports explicit reasoned overrides without deleting underlying evidence

  ```
  
  ```
- Placement P4 eligibility > rejects cross-college learner substitution

  ```
  
  ```
- Placement P4 eligibility > rejects unknown and foreign-college academic policy scopes before persisting

  ```
  error: update or delete on table "placement_jobs" violates foreign key constraint "placement_applications_job_id_placement_jobs_id_fk" on table "placement_applications"
  ❯ node_modules/pg-pool/index.js:45:11
  ❯ cleanup tests/integration/placements-p4-eligibility.test.ts:88:3
  86|     "delete from placement_candidate_academic_evidence",
  87|   );
  88|   await pool.query("delete from placement_jobs");
  |   ^
  89|   await pool.query(
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

## tests/integration/super-admin-template-college-availability.test.ts (1 failing)
- Template college availability in PostgreSQL > retains in-test own assignment and hides it from foreign scoped college and wrong-role

  ```
  AssertionError: expected [ { …(7) } ] to have a length of +0 but got 1
  - Expected
  + Received
  - 0
  + 1
  ```
