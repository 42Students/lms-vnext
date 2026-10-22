# CI unit-test packet (round 5db)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/learner-recent-course-activity.test.ts (1 failing)
- L2-016 recent course activity, own persisted completion > includes a just-recorded audited learner completion and never invents an update

  ```
  AssertionError: expected '0' to be '1' // Object.is equality
  Expected: "1"
  Received: "0"
  ```

## tests/integration/placements-p4-eligibility.test.ts (5 failing)
- Placement P4 eligibility > distinguishes missing evidence, hard failure and verified eligibility

  ```
  
  ```
- Placement P4 eligibility > lets managers read normalized candidate evidence only inside their placement tenant

  ```
  
  ```
- Placement P4 eligibility > supports explicit reasoned overrides without deleting underlying evidence

  ```
  
  ```
- Placement P4 eligibility > rejects cross-college learner substitution

  ```
  
  ```
- Placement P4 eligibility > rejects unknown and foreign-college academic policy scopes before persisting

  ```
  error: update or delete on table "placement_jobs" violates foreign key constraint "placement_applications_job_id_placement_jobs_id_fk" on table "placement_applications"
  ❯ node_modules/pg-pool/index.js:45:11
  ❯ cleanup tests/integration/placements-p4-eligibility.test.ts:88:3
  86|     "delete from placement_candidate_academic_evidence",
  87|   );
  88|   await pool.query("delete from placement_jobs");
  |   ^
  89|   await pool.query(
  ```

## tests/integration/projects-p7b-meetings.test.ts (7 failing)
- Projects P7B meetings > lets a learner request and a mentor schedule then complete a meeting

  ```
  ProjectsServiceError: PROJECT_MEETING_STALE_VERSION
  ❯ src/modules/projects/meeting-service.ts:395:14
  393|       (existing && !input.expectedUpdatedAt) ||
  394|       (!existing && !input.expectedProjectUpdatedAt)
  395|     )) throw new ProjectsServiceError("PROJECT_MEETING_STALE_VERSION");
  |              ^
  396|     if (existing && input.expectedUpdatedAt &&
  397|       existing.updatedAt.getTime()!==new Date(input.expectedUpdatedAt)…
  ```
- Projects P7B meetings > lets a learner cancel only their own pending request

  ```
  
  ```
- Projects P7B meetings > supports direct mentor/admin scheduling with validated project links

  ```
  
  ```
- Projects P7B meetings > rejects invalid windows in validation and PostgreSQL

  ```
  
  ```
- Projects P7B meetings > aggregates only active mentor assignments into the personal calendar

  ```
  
  ```
- Projects P7B meetings > cannot revive a cancelled or completed meeting through a stale schedule

  ```
  
  ```
- Projects P7B meetings > denies disabled platform accounts in both project list and direct workspace reads

  ```
  error: update or delete on table "project_meetings" violates foreign key constraint "project_meeting_history_project_fk" on table "project_meeting_history"
  ❯ node_modules/pg-pool/index.js:45:11
  ❯ cleanup tests/integration/projects-p7b-meetings.test.ts:150:3
  148|
  149| async function cleanup() {
  150|   await pool.query(
  |   ^
  151|     `delete from project_meetings
  ```

## tests/integration/tpo-participation-service.test.ts (1 failing)
- TPO participation read against PostgreSQL > denies a learner without exactly one active enrollment (seed has none)

  ```
  AssertionError: promise resolved "{ …(4) }" instead of rejecting
  - Expected
  + Received
  - Error {
  -   "message": "rejected promise",
  + {
  +   "direct": {
  +     "note": null,
  ```
