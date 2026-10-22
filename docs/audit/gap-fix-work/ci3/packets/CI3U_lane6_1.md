# CI unit-test packet (round 3)

These INTEGRATION tests (real PostgreSQL in CI, all migrations applied) FAIL on main. Read the CI workflow .github/workflows/ci.yml for the DB setup. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/admin-module-access-read-service.test.ts (4 failing)
- module access admin read against PostgreSQL > lists the college matrix

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
- module access admin read against PostgreSQL > executes the descendant override union against the real schema

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
- module access admin read against PostgreSQL > filters descendant override totals and rows by module in PostgreSQL

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
- module access admin read against PostgreSQL > filters persisted descendant scope and module in the same scoped query

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

## tests/integration/college-lecture-hall-directory-scope.test.ts (1 failing)
- College Admin lecture hall directory scoped PostgreSQL tests > denies foreign-college reads, foreign edits and learner access

  ```
  AssertionError: promise resolved "{ …(4) }" instead of rejecting
  - Expected
  + Received
  - Error {
  -   "message": "rejected promise",
  + {
  +   "collegeId": "20000000-0000-4000-8000-000000000001",
  +   "collegeName": "Seed College A",
  ```

## tests/integration/db06-assessment-parent-scope.test.ts (28 failing)
- DB06 assessment parent-scope PostgreSQL acceptance > PG01 and PG02 deny cross-offering fixed quiz and assignment definitions

  ```
  
  ```
- DB06 assessment parent-scope PostgreSQL acceptance > PG03 denies attempt through delivery from another offering

  ```
  
  ```
- DB06 assessment parent-scope PostgreSQL acceptance > PG04 denies a fixed-delivery quiz in another section delivery

  ```
  
  ```
- DB06 assessment parent-scope PostgreSQL acceptance > PG05 denies an active learner membership from another college

  ```
  
  ```
- DB06 assessment parent-scope PostgreSQL acceptance > PG06 denies same-college learner outside the target section

  ```
  
  ```
- DB06 assessment parent-scope PostgreSQL acceptance > PG07 denies revoked LEARNER role and disabled platform user

  ```
  
  ```
- DB06 assessment parent-scope PostgreSQL acceptance > PG08 denies assignment submission through wrong delivery

  ```
  
  ```
- DB06 assessment parent-scope PostgreSQL acceptance > PG09 denies grade above assignment maximum

  ```
  
  ```
- DB06 assessment parent-scope PostgreSQL acceptance > PG09B denies lowering assignment max points below an awarded historical grade

  ```
  
  ```
- DB06 assessment parent-scope PostgreSQL acceptance > PG10 denies answer question from a different quiz

  ```
  
  ```
- … 18 more in this file

## tests/integration/hr-inline-round-results.test.ts (1 failing)
- HR inline result read auth (isolated PG) > reads own rounds but masks foreign employer / college / wrong role before projection

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
