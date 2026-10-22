# CI unit-test packet (round 3)

These INTEGRATION tests (real PostgreSQL in CI, all migrations applied) FAIL on main. Read the CI workflow .github/workflows/ci.yml for the DB setup. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/admin-quiz-directory.test.ts (1 failing)
- Super Admin quizzes read fixture PG > lists in-test quiz and enforces foreign-college/wrong-role denial

  ```
  Error: Failed query: select "assessment_id", "title", "course_name_alias", "code", "lesson_name_alias", "id", "offering_id_alias", "status", "due_at", "delivery_id", "total_points", "created_by_user_id", "updated_at", "id", "results_published", "created_at" from (select "course_quizzes"."id" as "ass
  params: 20000000-0000-4000-8000-000000000001,20000000-0000-4000-8000-000000000001,20000000-0000-4000-8000-000000000001,%Admin Quiz d891284f-c%,20
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
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

## tests/integration/db09-tpo-crm.test.ts (23 failing)
- DB09 recruiter CRM isolated PostgreSQL integrity > preserves immutable lead history against direct TRUNCATE

  ```
  
  ```
- DB09 recruiter CRM isolated PostgreSQL integrity > atomically creates an audited lead and records idempotent Not Now changes

  ```
  
  ```
- DB09 recruiter CRM isolated PostgreSQL integrity > rolls back lead creation when the persisted audit actor is unauthorized

  ```
  
  ```
- DB09 recruiter CRM isolated PostgreSQL integrity > denies a foreign-college and nonstaff Not Now update without audit rows

  ```
  
  ```
- DB09 recruiter CRM isolated PostgreSQL integrity > creates tenant-scoped lead, lists it, and transitions NEW to CONTACTED on real activity

  ```
  
  ```
- DB09 recruiter CRM isolated PostgreSQL integrity > never returns a hashed invite token in TPO lead APIs

  ```
  
  ```
- DB09 recruiter CRM isolated PostgreSQL integrity > deduplicates competing lead creation by normalized email

  ```
  
  ```
- DB09 recruiter CRM isolated PostgreSQL integrity > rejects malformed invite hashes and forged activity actors at the database boundary

  ```
  
  ```
- DB09 recruiter CRM isolated PostgreSQL integrity > tracks follow-up due, move and completion; refuses moving done follow-ups

  ```
  
  ```
- DB09 recruiter CRM isolated PostgreSQL integrity > denies learner access and forged college on service layer

  ```
  
  ```
- … 13 more in this file

## tests/integration/hr-job-activity.test.ts (1 failing)
- HR job activity PG scopes > reads own job publication but denies foreign employer and wrong role

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
