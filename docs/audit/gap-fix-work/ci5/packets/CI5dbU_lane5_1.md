# CI unit-test packet (round 5db)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/admin-college-rule-lifecycle.test.ts (1 failing)
- Super Admin audited college module write transaction in isolated PostgreSQL > supports SET, LOCK, idempotence, optimistic conflict, INHERIT and exact scoped audit

  ```
  AuthorizationError: Missing permission: college.manage
  ❯ requirePermission src/modules/permissions/policy.ts:308:11
  306| ) {
  307|   if (!can(context, permission, resource)) {
  308|     throw new AuthorizationError(permission);
  |           ^
  309|   }
  310| }
  ```

## tests/integration/college-lesson-reorder-scope.test.ts (1 failing)
- College Admin lesson create/edit/move PostgreSQL > creates, edits, moves with immutable audit, and rejects foreign college

  ```
  ZodError: [
  {
  "expected": "string",
  "code": "invalid_type",
  "path": [
  "expectedUpdatedAt"
  ],
  "message": "Invalid input: expected string, received undefined"
  ```

## tests/integration/faculty-attendance-schedule-mutation.test.ts (1 failing)
- Faculty attendance session scheduling on disposable PostgreSQL > creates scoped attendance events, prevents collisions and audits each actual change

  ```
  CoursesServiceError: SCHEDULE_EVENT_CONFLICT
  ❯ commandFacultyAttendanceSchedule src/modules/attendance/faculty-schedule-mutation-service.ts:47:11
  45|     throw new CoursesServiceError("SCHEDULE_EVENT_CONFLICT");
  46|   if(startsAt.getTime()<Date.now()-bookingGraceMs())
  47|     throw new CoursesServiceError("SCHEDULE_EVENT_CONFLICT");
  |           ^
  48|   return getDb().transaction(async tx=>{
  49|     // Match the College Admin schedule writer's tenant lock. This is …
  ```

## tests/integration/hr-own-company-policy.test.ts (1 failing)
- HR forged cross-company grant is non-leaking > returns own job but not a different company's job even with both relationship grants

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
