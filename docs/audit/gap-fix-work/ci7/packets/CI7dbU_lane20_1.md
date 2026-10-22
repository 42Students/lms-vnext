# CI unit-test packet (round 7db)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/identity-system-roles.test.ts (1 failing)
- identity context and system roles against PostgreSQL > resolves only memberships owned by the authenticated canonical user

  ```
  AssertionError: expected { …(5) } to match object { …(3) }
  (2 matching properties omitted from actual)
  - Expected
  + Received
  {
  "collegeId": "20000000-0000-4000-8000-000000000001",
  "id": "40000000-0000-4000-8000-000000000002",
  "roles": [
  ```

## tests/integration/super-admin-videos-directory.test.ts (1 failing)
- Super Admin videos directory disposable PostgreSQL > returns only videos, hides other kinds and foreign-college content

  ```
  Error: Failed query: select "admin_content_id", "admin_content_title", "notes", "points", "hasLegacyRichContent", "content_type", "admin_content_status", "sequence", "visible_to_students", "external_url", "duration_seconds", "starts_at", "ends_at", "admin_lesson_name", "admin_lesson_status", "admin_
  params: 20000000-0000-4000-8000-000000000001,20000000-0000-4000-8000-000000000001,20000000-0000-4000-8000-000000000001,VIDEO,YOUTUBE,%admin-video-0fd3a346%,%admin-video-0fd3a346%,%admin-video-0fd3a346%,%admin-video-0fd3a346%,10
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
