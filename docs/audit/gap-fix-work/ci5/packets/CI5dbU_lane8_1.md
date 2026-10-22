# CI unit-test packet (round 5db)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/admin-student-rule-write.test.ts (1 failing)
- Super Admin student rule write boundaries > round-trips Set, Lock and Inherit with persisted audit and stale-write denial

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

## tests/integration/college-program-mutations.test.ts (1 failing)
- College Admin program create/edit/archive transactions (isolated PostgreSQL) > rejects duplicate department-local names/codes and protects cohort, enrollment, curriculum

  ```
  error: duplicate key value violates unique constraint "learner_program_enrollments_active_membership_uq"
  ❯ node_modules/pg-pool/index.js:45:11
  ❯ tests/integration/college-program-mutations.test.ts:239:5
  237|       [ids.cohort, first.id, label + "Cohort", label + "Cohort", ids.p…
  238|     );
  239|     await pool!.query(
  |     ^
  240|       "INSERT INTO learner_program_enrollments(id,membership_id,progra…
  ```

## tests/integration/faculty-mentor-positive-courses.test.ts (3 failing)
- Chat4 Faculty SUCCESS paths against disposable PostgreSQL > writes a confirmed own-Section assignment draft with row-locked stale and wrong-role denial

  ```
  CoursesServiceError: INVALID_ASSIGNMENT_TRANSITION
  ❯ src/modules/courses/faculty-assignment-authoring-service.ts:114:19
  112|         }else if(input.action==="PUBLISH"){
  113|           if(current.status!=="DRAFT"||!current.dueAt||current.dueAt.g…
  114|             throw new CoursesServiceError("INVALID_ASSIGNMENT_TRANSITI…
  |                   ^
  115|           changedFields=["status"];eventType=ACTIVITY_EVENT_TYPES.COUR…
  116|         }else{
  ```
- Chat4 Faculty SUCCESS paths against disposable PostgreSQL > persists IST Faculty schedule inputs and reschedules with microsecond-safe tokens

  ```
  Error: Cannot schedule a class in the past
  ❯ facultyScheduleInstants src/modules/attendance/faculty-schedule-editor-model.ts:27:11
  25|   // separate correction authority, never by relaxing create validatio…
  26|   if(!original&&new Date(startsAt).getTime()<Date.now())
  27|     throw new Error("Cannot schedule a class in the past");
  |           ^
  28|   if(new Date(endsAt).getTime()-new Date(startsAt).getTime()>12*60*60*…
  29|     throw new Error("A single class session cannot exceed 12 hours");
  ```
- Chat4 Faculty SUCCESS paths against disposable PostgreSQL > fences Faculty from old Quiz results endpoint and audits the Admin path

  ```
  AssertionError: expected CoursesServiceError: INVALID_QUIZ_TRANSIT… { code: '…' } to match object { code: 'QUIZ_RESULTS_ADMIN_ONLY' }
  (1 matching property omitted from actual)
  - Expected
  + Received
  - {
  -   "code": "QUIZ_RESULTS_ADMIN_ONLY",
  + CoursesServiceError {
  +   "code": "INVALID_QUIZ_TRANSITION",
  ```

## tests/integration/hr-round-schedule.test.ts (1 failing)
- HR round schedule scoped PG > shows own scheduled round, denies foreign company and wrong role

  ```
  PlacementsServiceError: PLACEMENT_JOB_NOT_FOUND
  ❯ getRecruiterPlacementWorkspace src/modules/placements/recruiter-workspace-service.ts:126:11
  124|     scope.job.archivedAt !== null
  125|   ) {
  126|     throw new PlacementsServiceError(
  |           ^
  127|       "PLACEMENT_JOB_NOT_FOUND",
  128|     );
  ```
