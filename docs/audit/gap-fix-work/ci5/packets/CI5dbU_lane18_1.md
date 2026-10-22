# CI unit-test packet (round 5db)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/college-activity-audit-scope.test.ts (2 failing)
- College Admin Activity Log PG cursor and denial > paginates 27 own events and never reads another college

  ```
  AssertionError: expected [ { event: { …(34) }, …(1) }, …(26) ] to have a length of 25 but got 27
  - Expected
  + Received
  - 25
  + 27
  ```
- College Admin Activity Log PG cursor and denial > filters persisted event module, importance and exact event type before cursor pagination

  ```
  AssertionError: expected [ { event: { …(34) }, …(1) }, …(26) ] to have a length of 25 but got 27
  - Expected
  + Received
  - 25
  + 27
  ```

## tests/integration/courses-c4b-quizzes.test.ts (7 failing)
- courses C4B quizzes against PostgreSQL > keeps generic quizzes admin-owned, exact quizzes teacher-scoped and learner keys hidden

  ```
  AcademicsServiceError: LEARNER_ALREADY_ENROLLED
  ❯ mapEnrollmentConstraint src/modules/academics/enrollment-service.ts:45:14
  43|     case "learner_program_enrollments_membership_program_cohort_uq":
  44|     case "learner_program_enrollments_active_membership_uq":
  45|       return new AcademicsServiceError(
  |              ^
  46|         "LEARNER_ALREADY_ENROLLED",
  47|       );
  ```
- courses C4B quizzes against PostgreSQL > scores exact answers, enforces attempt limits and freezes question changes after attempts

  ```
  AcademicsServiceError: LEARNER_ALREADY_ENROLLED
  ❯ mapEnrollmentConstraint src/modules/academics/enrollment-service.ts:45:14
  43|     case "learner_program_enrollments_membership_program_cohort_uq":
  44|     case "learner_program_enrollments_active_membership_uq":
  45|       return new AcademicsServiceError(
  |              ^
  46|         "LEARNER_ALREADY_ENROLLED",
  47|       );
  ```
- courses C4B quizzes against PostgreSQL > requires close before result publication and preserves attempt snapshots

  ```
  AcademicsServiceError: LEARNER_ALREADY_ENROLLED
  ❯ mapEnrollmentConstraint src/modules/academics/enrollment-service.ts:45:14
  43|     case "learner_program_enrollments_membership_program_cohort_uq":
  44|     case "learner_program_enrollments_active_membership_uq":
  45|       return new AcademicsServiceError(
  |              ^
  46|         "LEARNER_ALREADY_ENROLLED",
  47|       );
  ```
- courses C4B quizzes against PostgreSQL > allows only one concurrent final attempt and enforces database score bounds

  ```
  AcademicsServiceError: LEARNER_ALREADY_ENROLLED
  ❯ mapEnrollmentConstraint src/modules/academics/enrollment-service.ts:45:14
  43|     case "learner_program_enrollments_membership_program_cohort_uq":
  44|     case "learner_program_enrollments_active_membership_uq":
  45|       return new AcademicsServiceError(
  |              ^
  46|         "LEARNER_ALREADY_ENROLLED",
  47|       );
  ```
- courses C4B quizzes against PostgreSQL > rejects a quiz submission when a faculty close commits during the race

  ```
  AcademicsServiceError: LEARNER_ALREADY_ENROLLED
  ❯ mapEnrollmentConstraint src/modules/academics/enrollment-service.ts:45:14
  43|     case "learner_program_enrollments_membership_program_cohort_uq":
  44|     case "learner_program_enrollments_active_membership_uq":
  45|       return new AcademicsServiceError(
  |              ^
  46|         "LEARNER_ALREADY_ENROLLED",
  47|       );
  ```
- courses C4B quizzes against PostgreSQL > allows Faculty to replace draft Quiz questions but freezes structure after publish

  ```
  AcademicsServiceError: LEARNER_ALREADY_ENROLLED
  ❯ mapEnrollmentConstraint src/modules/academics/enrollment-service.ts:45:14
  43|     case "learner_program_enrollments_membership_program_cohort_uq":
  44|     case "learner_program_enrollments_active_membership_uq":
  45|       return new AcademicsServiceError(
  |              ^
  46|         "LEARNER_ALREADY_ENROLLED",
  47|       );
  ```
- Faculty Quiz reordered bank persistence > stores visible question and option ordering with exact Section scoping

  ```
  AcademicsServiceError: LEARNER_ALREADY_ENROLLED
  ❯ mapEnrollmentConstraint src/modules/academics/enrollment-service.ts:45:14
  43|     case "learner_program_enrollments_membership_program_cohort_uq":
  44|     case "learner_program_enrollments_active_membership_uq":
  45|       return new AcademicsServiceError(
  |              ^
  46|         "LEARNER_ALREADY_ENROLLED",
  47|       );
  ```

## tests/integration/hr-drive-overview.test.ts (1 failing)
- HR Drive Overview PG guard > allows own drive summary, masks foreign company/college and wrong-role

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

## tests/integration/learner-interview-withdrawal-request.test.ts (1 failing)
- own interview application withdrawal request > records pending audited request without withdrawing application or closing round

  ```
  Error: Failed query: insert into "placement_learner_requests" ("id", "application_id", "request_type", "round_id", "offer_id", "scope_key", "reason", "effect_payload", "status", "requested_by_user_id", "requested_at", "decided_by_user_id", "decided_at", "decision_note", "updated_at") values (default
  params: 353fa21f-0bb4-4308-a712-39346015085c,APPLICATION_WITHDRAWAL,,,APPLICATION_WITHDRAWAL:353fa21f-0bb4-4308-a712-39346015085c,Exam conflict,{},8f007535-f1b0-44b3-95d5-0b746228ccfb,2026-10-22T07:28:48.198Z
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
