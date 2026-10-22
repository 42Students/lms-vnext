# CI unit-test packet (round 3)

These INTEGRATION tests (real PostgreSQL in CI, all migrations applied) FAIL on main. Read the CI workflow .github/workflows/ci.yml for the DB setup. For each failing assertion decide:
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

## tests/integration/placements-learner-journey.test.ts (2 failing)
- Learner placement journey > hides internal screening state while exposing confirmed learner-facing decisions and applied results

  ```
  
  ```
- Learner placement journey > is learner-only rather than a generic same-college read model

  ```
  error: update or delete on table "placement_applications" violates foreign key constraint "placement_college_application_stages_application_id_placement_a" on table "placement_college_application_stages"
  ❯ node_modules/pg-pool/index.js:45:11
  ❯ cleanup tests/integration/placements-learner-journey.test.ts:106:3
  104|     "delete from placement_application_status_history",
  105|   );
  106|   await pool.query(
  |   ^
  107|     "delete from placement_applications",
  ```

## tests/integration/projects-p3-materialization.test.ts (3 failing)
- Projects P3 deterministic materialization > requires exact college authority and an active assigned template

  ```
  
  ```
- Projects P3 deterministic materialization > rejects an invalid primary mentor without leaving a workspace behind

  ```
  
  ```
- Projects P3 deterministic materialization > enforces stable project slugs per college

  ```
  error: update or delete on table "project_instances" violates foreign key constraint "project_resource_audit_project_id_fkey" on table "project_resource_audit"
  ❯ node_modules/pg-pool/index.js:45:11
  ❯ cleanup tests/integration/projects-p3-materialization.test.ts:156:3
  154|      )`,
  155|   );
  156|   await pool.query(
  |   ^
  157|     "delete from project_instances where slug like 'p3-%'",
  ```

## tests/integration/super-admin-feature-matrix-scope.test.ts (1 failing)
- Super Admin feature matrix strict scoped PostgreSQL filters > counts and pages the same exact college/module rule, including explicit absence and CSV

  ```
  AuthorizationError: Missing permission: admin-scope.select
  ❯ requirePermission src/modules/permissions/policy.ts:308:11
  306| ) {
  307|   if (!can(context, permission, resource)) {
  308|     throw new AuthorizationError(permission);
  |           ^
  309|   }
  310| }
  ```
