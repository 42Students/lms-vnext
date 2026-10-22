# CI unit-test packet (round 5db)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/mentor-meeting-notes.test.ts (2 failing)
- Mentor completed-meeting notes on migrated PostgreSQL > writes the authorized outcome once with audit and rejects stale/role/foreign writes

  ```
  ProjectsServiceError: PROJECT_MEETING_INVALID_STATE
  ❯ src/modules/projects/mentor-meeting-notes-service.ts:66:13
  64|     if(!project||!meetingNotesEditable(project.status,meeting.status)||
  65|       meeting.outcome?.trim()===input.outcome)
  66|       throw new ProjectsServiceError("PROJECT_MEETING_INVALID_STATE");
  |             ^
  67|     const now=new Date(Math.max(Date.now(),meeting.updatedAt.getTime()…
  68|     const [updated]=await tx.update(projectMeetings).set({
  ```
- Mentor completed-meeting notes on migrated PostgreSQL > writes the authorized outcome once with audit and rejects stale/role/foreign writes

  ```
  error: update or delete on table "project_meetings" violates foreign key constraint "project_meeting_history_project_fk" on table "project_meeting_history"
  ❯ node_modules/pg-pool/index.js:45:11
  ❯ cleanup tests/integration/mentor-meeting-notes.test.ts:38:7
  36|       "project_meetings","project_members","project_resources","projec…
  37|       "project_sprints","project_releases"]){
  38|       await pool.query("delete from "+table+" where project_id=any($1:…
  |       ^
  39|     }
  ```

## tests/integration/placements-p8-offers.test.ts (30 failing)
- Placement P8 offers and joining > PLACEMENTS-EXPIRY-NOTIFY-31 DB records expiry without alerting learner who disabled application notices

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
- Placement P8 offers and joining > PLACEMENTS-EXPIRY-NOTIFY-30 DB records and notifies exactly once after offer deadline, never from a GET

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
- Placement P8 offers and joining > PLACEMENTS-EXPIRY-RACE-05 DB serializes sweep versus same-offer learner acceptance into one terminal outcome

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
- Placement P8 offers and joining > TPO-2ND-PAGE-OFFERS-DB-01 protects live register and export against a foreign-college actor

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
- Placement P8 offers and joining > TPO-2ND-PAGE-OFFER-EVIDENCE-DB-02 rejects a real offer ID paired with a different drive

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
- Placement P8 offers and joining > PLACEMENTS-IDOR-01 refuses a wrong-college TPO, learner issuing an offer and TPO self-acceptance

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
- Placement P8 offers and joining > PLACEMENTS-TPO-ESCALATE-21 DB escalates a future round only once, with a real college TPO recipient

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
- Placement P8 offers and joining > PLACEMENTS-TPO-NOTICE-19 DB preference opt-out suppresses TPO notice without dropping audited decision

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
- Placement P8 offers and joining > PLACEMENTS-TPO-NOTICE-18 DB issues exactly one preference-scoped learner notice per durable TPO decision

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
- Placement P8 offers and joining > TPO-JOIN-TRACKER-DB-35 projects only accepted offers and never interprets pending joining as JOINED

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
- … 20 more in this file

## tests/integration/storage-files-courses-db.test.ts (13 failing)
- assignment submission files against PostgreSQL > runs upload, verification, submit, grants and audit end to end

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
- assignment submission files against PostgreSQL > quarantines content that does not match its declared type and deletes the object

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
- assignment submission files against PostgreSQL > fails a tampered upload (wrong size) and an unfinished upload without serving anything

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
- assignment submission files against PostgreSQL > does not serve a READY file whose object was overwritten after attestation

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
- assignment submission files against PostgreSQL > enforces per-learner staging limits, ownership and non-leaking denials

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
- assignment submission files against PostgreSQL > lets the learner remove a staged file

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
- database guarantees for submission files > rejects a FILE submission without a READY file at commit and cross-college owner pairs

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
- database guarantees for submission files > checks sizes, statuses, key scope and the READY invariant

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
- lesson videos against PostgreSQL > keeps a verified draft away from learners until it is published and visible

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
- lesson videos against PostgreSQL > restricts management to admins and faculty teaching that delivery

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
- … 3 more in this file
