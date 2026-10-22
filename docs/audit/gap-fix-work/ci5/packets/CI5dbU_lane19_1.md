# CI unit-test packet (round 5db)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/college-batch-retire.test.ts (1 failing)
- Planned batch guarded removal PostgreSQL > blocks a child Section and correctly rejects SQL-default microsecond stale timestamp

  ```
  AssertionError: expected +0 to be 1 // Object.is equality
  - Expected
  + Received
  - 1
  + 0
  ```

## tests/integration/courses-ui2a-faculty.test.ts (9 failing)
- courses UI2A faculty read model > discovers only exact active teaching deliveries and composes shared plus Section items

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
- courses UI2A faculty read model > builds standalone Faculty All Quizzes and All Assignments from teaching scopes

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
- courses UI2A faculty read model > keeps Faculty Class Schedule Section-scoped, includes general events and links exact deliveries

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
- courses UI2A faculty read model > round-trips Faculty attendance marking into the learner view and supports correction back to present

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
- courses UI2A faculty read model > keeps Faculty attendance scheduling and marking inside exact teaching scope

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
- courses UI2A faculty read model > reports current eligible learners who have not submitted or attempted

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
- courses UI2A faculty read model > uses the exact delivery roster for Students and keeps Faculty discussion moderation section-scoped

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
- courses UI2A faculty read model > pages a busy Faculty discussion without skipping microsecond-neighbor messages

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
- courses UI2A faculty read model > gives College Admin a scoped attendance grid and correction path without granting Faculty admin access

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

## tests/integration/learner-manual-content-completion.test.ts (1 failing)
- learner manual completion with fresh PostgreSQL actor and course > marks first completion, preserves timestamp on retry and updates own workspace

  ```
  AssertionError: expected { total: '0', …(2) } to match object { total: '1', …(2) }
  - Expected
  + Received
  {
  -   "actor_membership_id": "849ddc22-6770-48bb-89d2-bcf765d56090",
  -   "actor_user_id": "732a3ced-1a48-4076-8e93-cccf3ac0b270",
  -   "total": "1",
  +   "actor_membership_id": null,
  ```
