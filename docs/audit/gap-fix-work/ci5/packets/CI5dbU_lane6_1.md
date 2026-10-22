# CI unit-test packet (round 5db)

These tests FAIL in CI on main. For each failing assertion decide:
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

## tests/integration/college-placements-interviews.test.ts (4 failing)
- College Admin interviews: isolated PostgreSQL > COL-placements-04: schedule, edit, complete persist, audit and notify the candidate

  ```
  ZodError: [
  {
  "code": "custom",
  "path": [
  "appointment",
  "interviewType"
  ],
  "message": "Please select interview type"
  ```
- College Admin interviews: isolated PostgreSQL > COL-placements-04: cancel frees the candidate slot and a stale version is refused

  ```
  ZodError: [
  {
  "code": "custom",
  "path": [
  "appointment",
  "interviewType"
  ],
  "message": "Please select interview type"
  ```
- College Admin interviews: isolated PostgreSQL > COL-placements-04: rejects past times, virtual without https, overlapping room, non-shortlisted candidate and closed drive

  ```
  ZodError: [
  {
  "code": "custom",
  "path": [
  "appointment",
  "interviewType"
  ],
  "message": "Please select interview type"
  ```
- College Admin interviews: isolated PostgreSQL > COL-placements-19: directory lists booked interviews with summary, mode/status/company filters and a student overlap conflict

  ```
  ZodError: [
  {
  "code": "custom",
  "path": [
  "appointment",
  "interviewType"
  ],
  "message": "Please select interview type"
  ```

## tests/integration/faculty-c4-reports-audit-contact.test.ts (2 failing)
- Faculty registered report/history positive and scope denials > marks attendance, requires a reason for corrections, rejects stale tokens and retains audit history

  ```
  
  ```
- Faculty registered report/history positive and scope denials > keeps Faculty alternate contacts blocked even for a real authorized Faculty-only profile

  ```
  error: update or delete on table "users" violates foreign key constraint "in_app_notifications_user_id_users_id_fk" on table "in_app_notifications"
  ❯ node_modules/pg-pool/index.js:45:11
  ❯ cleanup tests/integration/faculty-c4-reports-audit-contact.test.ts:77:3
  75|   await pool.query("delete from membership_roles where membership_id=$…
  76|   await pool.query("delete from college_memberships where id=$1",[f.le…
  77|   await pool.query("delete from users where id=$1",[f.learnerUserId]);
  |   ^
  78|  }
  ```

## tests/integration/hr-recruiter-shared-contact-policy.test.ts (1 failing)
- HR round contact disclosure isolation (isolated PG) > authorizes own round, masks foreign company, foreign college and wrong role before any candidates are read

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
