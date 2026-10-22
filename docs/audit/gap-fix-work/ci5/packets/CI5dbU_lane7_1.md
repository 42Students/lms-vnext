# CI unit-test packet (round 5db)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/admin-quiz-directory.test.ts (1 failing)
- Super Admin quizzes read fixture PG > lists in-test quiz and enforces foreign-college/wrong-role denial

  ```
  Error: Failed query: select "assessment_id", "title", "course_name_alias", "code", "lesson_name_alias", "id", "offering_id_alias", "status", "due_at", "delivery_id", "total_points", "created_by_user_id", "updated_at", "id", "results_published", "created_at" from (select "course_quizzes"."id" as "ass
  params: 20000000-0000-4000-8000-000000000001,20000000-0000-4000-8000-000000000001,20000000-0000-4000-8000-000000000001,%Admin Quiz efdf2488-a%,20
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```

## tests/integration/college-placements-pipeline.test.ts (1 failing)
- College Admin placement pipeline: isolated PostgreSQL > COL-placements-01: invalid transitions, Offered without an issued offer and Hired without joining are rejected per row

  ```
  AssertionError: expected 'Cannot move from APPLIED to HIRED. Al…' to match /Invalid transition/
  - Expected:
  /Invalid transition/
  + Received:
  "Cannot move from APPLIED to HIRED. Allowed next stages: SHORTLISTED, REJECTED."
  ```

## tests/integration/faculty-live-mutation.test.ts (2 failing)
- Faculty live session create, edit, cancel with PostgreSQL > writes once with actor audit, denies collision, foreign and stale scopes

  ```
  ZodError: [
  {
  "code": "custom",
  "path": [
  "startsAt"
  ],
  "message": "Start time must be in the future."
  }
  ```
- Faculty live scheduling persisted revocation > blocks a Faculty actor once the FACULTY role is removed from the database

  ```
  AssertionError: expected ZodError: [
  {
  "code": "custom",
  … { …(2) } to match object { Object (code) }
  (2 matching properties omitted from actual)
  - Expected
  + Received
  - {
  ```

## tests/integration/hr-round-results.test.ts (1 failing)
- HR round table non-enumeration PG > reads only own published job rounds and masks wrong company/college/role

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
