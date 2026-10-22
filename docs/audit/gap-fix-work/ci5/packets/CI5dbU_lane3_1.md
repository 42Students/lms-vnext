# CI unit-test packet (round 5db)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/admin-assignment-directory.test.ts (1 failing)
- Super Admin assignments read fixture PG > finds own assignment, hides foreign college record, rejects wrong role

  ```
  Error: Failed query: select "assessment_id", "title", "course_name_alias", "code", "lesson_name_alias", "id", "offering_id_alias", "status", "due_at", "delivery_id", "max_points", "created_by_user_id", "updated_at", "id" from (select "course_assignments"."id" as "assessment_id", "course_assignments"
  params: 20000000-0000-4000-8000-000000000001,20000000-0000-4000-8000-000000000001,20000000-0000-4000-8000-000000000001,%Admin Assignment bff2cda4-1%,20
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```

## tests/integration/college-faculty-lifecycle.test.ts (3 failing)
- Faculty lifecycle, real PG tenant and active-duty guards > blocks active academic responsibility, then suspends and reactivates with immutable audit

  ```
  Error: Failed query: select distinct "project_instances"."id" from "project_members" inner join "project_instances" on "project_instances"."id" = "project_members"."project_id" where ("project_members"."membership_id" = $1 and "project_members"."role" = $2 and "project_members"."ended_at" is null an
  params: 2e476ba4-9477-4ea3-a9cf-d551651867e7,MENTOR,ARCHIVED
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- Faculty lifecycle, real PG tenant and active-duty guards > COL-people-R01 permits teaching/advising faculty deactivation without mentor projects

  ```
  Error: Failed query: select distinct "project_instances"."id" from "project_members" inner join "project_instances" on "project_instances"."id" = "project_members"."project_id" where ("project_members"."membership_id" = $1 and "project_members"."role" = $2 and "project_members"."ended_at" is null an
  params: 2e476ba4-9477-4ea3-a9cf-d551651867e7,MENTOR,ARCHIVED
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

## tests/integration/db10-notification-pagination.test.ts (2 failing)
- W06 notification keyset history > paginates all 115 rows with no skip/duplicate and never leaks another user

  ```
  AssertionError: expected [ …(122) ] to have a length of 115 but got 122
  - Expected
  + Received
  - 115
  + 122
  ```
- W06 notification keyset history > preserves equal-timestamp UUID tie ordering and unread filter

  ```
  AssertionError: expected 10 to be 3 // Object.is equality
  - Expected
  + Received
  - 3
  + 10
  ```

## tests/integration/hr-offer-export.test.ts (1 failing)
- HR offer CSV exact company read > emits own eligible job export without foreign-company disclosure

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
