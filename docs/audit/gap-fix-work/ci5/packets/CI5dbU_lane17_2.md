# CI unit-test packet (round 5db)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/people-memberships.test.ts (1 failing)
- people and memberships against PostgreSQL > lets the same canonical user join a second college and isolates lifecycle state

  ```
  Error: Failed query: select distinct "project_instances"."id" from "project_members" inner join "project_instances" on "project_instances"."id" = "project_members"."project_id" where ("project_members"."membership_id" = $1 and "project_members"."role" = $2 and "project_members"."ended_at" is null an
  params: 6bfa4110-9f2a-4bf8-9aad-4e6e8333a8a2,MENTOR,ARCHIVED
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```

## tests/integration/project-notification-r01.test.ts (1 failing)
- COL-projects-R01 / LEARNER-projects-R01 notification persistence (PG) > notifies scoped mentor and learner for creation, join, assignment, comment, meetings, removal and archive

  ```
  AssertionError: expected [] to include 'Active blocker'
  ❯ tests/integration/project-notification-r01.test.ts:63:30
  61|   });
  62|   const risky=risk.items.find(row=>row.id===project.id);
  63|   expect(risky?.riskReasons).toContain("Active blocker");
  |                              ^
  64|   expect(risky?.blockerReason).toBe("Awaiting API review");
  65|   const updated=(await getProjectInstanceWorkspace(mentor,project.id))…
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
