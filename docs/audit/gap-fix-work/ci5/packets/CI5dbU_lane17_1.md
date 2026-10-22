# CI unit-test packet (round 5db)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/chat9-college-project-roster-atomic.test.ts (2 failing)
- COL-projects-15 atomic College Admin roster workflow > COL-projects-15 adds and removes a same-college learner with audit-backed atomic writes

  ```
  
  ```
- COL-projects-15 atomic College Admin roster workflow > COL-projects-15 rejects stale and non-learner roster targets without partial membership changes

  ```
  error: operator does not exist: uuid = text
  ❯ node_modules/pg-pool/index.js:45:11
  ❯ cleanup tests/integration/chat9-college-project-roster-atomic.test.ts:23:2
  21|  await pool.query("delete from in_app_notifications where event_id in …
  22|  await pool.query("delete from activity_events where metadata->>'proje…
  23|  await pool.query("delete from project_members where project_id in ("+…
  |  ^
  24|  await pool.query("delete from project_resources where project_id in (…
  ```

## tests/integration/courses-c4a-assignments.test.ts (5 failing)
- courses C4A assignments against PostgreSQL > keeps generic assignment structure admin-owned and exact delivery assignments teacher-scoped

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
- courses C4A assignments against PostgreSQL > enforces one-shot submission, rejects late or missing-deadline submissions, and checks assignment audience

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
- courses C4A assignments against PostgreSQL > hides unpublished grades and rejects stale concurrent grading

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
- courses C4A assignments against PostgreSQL > enforces grade bounds and database payload constraints

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
- courses C4A assignments against PostgreSQL > rejects submission if a faculty archive commits during the write race

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

## tests/integration/learner-interview-reschedule-summary.test.ts (2 failing)
- L16-015 approved persisted reschedule to own learner summary > reports the approved exception, not the superseded interview date

  ```
  
  ```
- L16-015 approved persisted reschedule to own learner summary > rejects forged college, suspended and wrong-role principals

  ```
  error: null value in column "learner_membership_id" of relation "placement_learner_requests" violates not-null constraint
  ❯ node_modules/pg-pool/index.js:45:11
  ❯ tests/integration/learner-interview-reschedule-summary.test.ts:19:1
  ```
