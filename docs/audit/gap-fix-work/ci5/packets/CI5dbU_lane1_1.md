# CI unit-test packet (round 5db)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/academics-a2.test.ts (3 failing)
- academics A2 against PostgreSQL > preserves learner roster history across moves and promotions

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
- academics A2 against PostgreSQL > enforces learner role, college, cohort and capacity boundaries

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
- academics A2 against PostgreSQL > links scheduled classes to an exact Course delivery and exposes only the learner's active Section schedule

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

## tests/integration/college-drive-views-scope.test.ts (2 failing)
- College Admin drive read views: isolated PostgreSQL > resolves the drive, keeps selected null, and does not leak a foreign job

  ```
  AssertionError: expected { applications: 1, …(5) } to deeply equal { applications: 1, …(3) }
  - Expected
  + Received
  {
  "applications": 1,
  +   "external": 0,
  "offered": 0,
  -   "selected": null,
  ```
- College Admin drive read views: isolated PostgreSQL > lists persisted own-college interview round with unknown individual slots and denies foreign job

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```

## tests/integration/db06-assessment-parent-scope.test.ts (28 failing)
- DB06 assessment parent-scope PostgreSQL acceptance > PG01 and PG02 deny cross-offering fixed quiz and assignment definitions

  ```
  
  ```
- DB06 assessment parent-scope PostgreSQL acceptance > PG03 denies attempt through delivery from another offering

  ```
  
  ```
- DB06 assessment parent-scope PostgreSQL acceptance > PG04 denies a fixed-delivery quiz in another section delivery

  ```
  
  ```
- DB06 assessment parent-scope PostgreSQL acceptance > PG05 denies an active learner membership from another college

  ```
  
  ```
- DB06 assessment parent-scope PostgreSQL acceptance > PG06 denies same-college learner outside the target section

  ```
  
  ```
- DB06 assessment parent-scope PostgreSQL acceptance > PG07 denies revoked LEARNER role and disabled platform user

  ```
  
  ```
- DB06 assessment parent-scope PostgreSQL acceptance > PG08 denies assignment submission through wrong delivery

  ```
  
  ```
- DB06 assessment parent-scope PostgreSQL acceptance > PG09 denies grade above assignment maximum

  ```
  
  ```
- DB06 assessment parent-scope PostgreSQL acceptance > PG09B denies lowering assignment max points below an awarded historical grade

  ```
  
  ```
- DB06 assessment parent-scope PostgreSQL acceptance > PG10 denies answer question from a different quiz

  ```
  
  ```
- … 18 more in this file

## tests/integration/hr-notification-read.test.ts (1 failing)
- HR notification acknowledgement PG > marks only own exact-company notification, denies foreign and stale token

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
