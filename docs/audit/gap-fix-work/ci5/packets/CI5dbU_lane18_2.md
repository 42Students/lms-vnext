# CI unit-test packet (round 5db)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/placements-draft-edit.test.ts (2 failing)
- Placement draft edit reads > returns normalized policy values for the tenant-scoped draft editor

  ```
  
  ```
- Placement draft edit reads > denies cross-college draft and policy reads

  ```
  error: update or delete on table "placement_jobs" violates foreign key constraint "placement_job_rounds_job_id_placement_jobs_id_fk" on table "placement_job_rounds"
  ❯ node_modules/pg-pool/index.js:45:11
  ❯ cleanup tests/integration/placements-draft-edit.test.ts:73:3
  71|     "delete from placement_job_eligibility_policies",
  72|   );
  73|   await pool.query("delete from placement_jobs");
  |   ^
  74|   await pool.query(
  ```

## tests/integration/projects-adversarial.test.ts (11 failing)
- Projects adversarial isolation > reassigns the primary mentor atomically and rechecks the target role

  ```
  ProjectsServiceError: PROJECT_MEETING_INVALID_STATE
  ❯ scheduleProjectMeeting src/modules/projects/meeting-service.ts:370:11
  368|   const endsAt = new Date(input.endsAt);
  369|   if (!isFutureProjectMeetingWindow(startsAt, endsAt, Date.now())) {
  370|     throw new ProjectsServiceError("PROJECT_MEETING_INVALID_STATE");
  |           ^
  371|   }
  372|   const links = await validateMeetingLinks(scope.project.id,input.link…
  ```
- Projects adversarial isolation > rejects valid IDs borrowed from a different project

  ```
  AssertionError: expected ProjectsServiceError: PROJECT_MEETING_INV… { code: '…' } to match object { Object (code) }
  (1 matching property omitted from actual)
  - Expected
  + Received
  - {
  -   "code": "PROJECT_MEETING_LINK_INVALID",
  + ProjectsServiceError {
  +   "code": "PROJECT_MEETING_INVALID_STATE",
  ```
- Projects adversarial isolation > prevents learners from escalating into lifecycle, resource, review or evaluation actions

  ```
  
  ```
- Projects adversarial isolation > keeps final review bound to the exact project submission

  ```
  
  ```
- Projects adversarial isolation > does not let unsafe URL schemes cross submission or resource validation boundaries

  ```
  
  ```
- Projects adversarial isolation > keeps stale task state from bypassing submission review gates

  ```
  
  ```
- Projects adversarial isolation > serializes concurrent resource sequence allocation

  ```
  
  ```
- Projects adversarial isolation > allows only one concurrent task submission to win

  ```
  
  ```
- Projects adversarial isolation > serializes final delivery draft and evaluation creation

  ```
  
  ```
- Projects adversarial isolation > does not flag a project stalled when nested project activity is recent

  ```
  
  ```
- … 1 more in this file

## tests/integration/super-admin-feature-mobile-card.test.ts (1 failing)
- Super Admin feature controls mobile card facts (PG) > reads in-test college only in authorized scope, excludes foreign scope and denies wrong role

  ```
  AssertionError: expected [ { module: 'projects', …(7) }, …(1) ] to have a length of 3 but got 2
  - Expected
  + Received
  - 3
  + 2
  ```
