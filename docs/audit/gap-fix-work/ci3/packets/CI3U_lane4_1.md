# CI unit-test packet (round 3)

These INTEGRATION tests (real PostgreSQL in CI, all migrations applied) FAIL on main. Read the CI workflow .github/workflows/ci.yml for the DB setup. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/admin-college-branding-preview-service.test.ts (2 failing)
- Super Admin college branding preview against PostgreSQL > reads only the seeded college's actual stored branding, or honest defaults

  ```
  AuthorizationError: Missing permission: college.read
  ❯ requirePermission src/modules/permissions/policy.ts:308:11
  306| ) {
  307|   if (!can(context, permission, resource)) {
  308|     throw new AuthorizationError(permission);
  |           ^
  309|   }
  310| }
  ```
- Super Admin college branding preview against PostgreSQL > allows an explicitly selected matching college scope

  ```
  AuthorizationError: Missing permission: college.read
  ❯ requirePermission src/modules/permissions/policy.ts:308:11
  306| ) {
  307|   if (!can(context, permission, resource)) {
  308|     throw new AuthorizationError(permission);
  |           ^
  309|   }
  310| }
  ```

## tests/integration/college-faculty-lifecycle.test.ts (3 failing)
- Faculty lifecycle, real PG tenant and active-duty guards > blocks active academic responsibility, then suspends and reactivates with immutable audit

  ```
  Error: Failed query: select distinct "project_instances"."id" from "project_members" inner join "project_instances" on "project_instances"."id" = "project_members"."project_id" where ("project_members"."membership_id" = $1 and "project_members"."role" = $2 and "project_members"."ended_at" is null an
  params: df8ae779-2152-48f0-8d6b-3599529d63fd,MENTOR,ARCHIVED
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- Faculty lifecycle, real PG tenant and active-duty guards > COL-people-R01 permits teaching/advising faculty deactivation without mentor projects

  ```
  Error: Failed query: select distinct "project_instances"."id" from "project_members" inner join "project_instances" on "project_instances"."id" = "project_members"."project_id" where ("project_members"."membership_id" = $1 and "project_members"."role" = $2 and "project_members"."ended_at" is null an
  params: df8ae779-2152-48f0-8d6b-3599529d63fd,MENTOR,ARCHIVED
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- Faculty lifecycle, real PG tenant and active-duty guards > denies foreign college, non-admin and extra caller scope fields

  ```
  AssertionError: expected AuthorizationError: Missing permission: m… to match object { Object (code) }
  (1 matching property omitted from actual)
  - Expected
  + Received
  - {
  -   "code": StringMatching /^FACULTY_NOT_/,
  + AuthorizationError {
  +   "message": "Missing permission: membership.lifecycle.manage",
  ```

## tests/integration/db01-tenant-routing-lifecycle.test.ts (2 failing)
- DB01 tenant host lifecycle — real repository SQL > stops routing immediately after the owning admin removes a hostname

  ```
  Error: Failed query: select "platform_status" from "users" where "users"."id" = $1 limit $2 for share
  params: isolated-test-superadmin,1
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- DB01 tenant host lifecycle — real repository SQL > stops routing immediately after the owning admin removes a hostname

  ```
  Error: Failed query: select "platform_status" from "users" where "users"."id" = $1 limit $2 for share
  params: isolated-test-superadmin,1
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```

## tests/integration/hr-drive-list.test.ts (1 failing)
- HR drive list scope (isolated PG) > lists own published job but hides another company and refuses wrong role

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
