# CI unit-test packet (round 7db)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/college-placements-interviews.test.ts (4 failing)
- College Admin interviews: isolated PostgreSQL > COL-placements-04: schedule, edit, complete persist, audit and notify the candidate

  ```
  Error: Failed query: select "id" from "placement_round_candidate_slots" where ("placement_round_candidate_slots"."application_id" = $1 and "placement_round_candidate_slots"."status" = $2 and not exists (select "id" from "activity_events" where ("activity_events"."subject_id" = "placement_round_candi
  params: 887cb6f8-39c0-4bcc-a558-4c1cf969534c,BOOKED,placement_round_candidate_slot,PLACEMENTS_COLLEGE_INTERVIEW_COMPLETED,PLACEMENTS_COLLEGE_INTERVIEW_NO_SHOW,1
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- College Admin interviews: isolated PostgreSQL > COL-placements-04: cancel frees the candidate slot and a stale version is refused

  ```
  Error: Failed query: select "id" from "placement_round_candidate_slots" where ("placement_round_candidate_slots"."application_id" = $1 and "placement_round_candidate_slots"."status" = $2 and not exists (select "id" from "activity_events" where ("activity_events"."subject_id" = "placement_round_candi
  params: 4c9633f0-84c6-4f13-8adb-dccce6ad3457,BOOKED,placement_round_candidate_slot,PLACEMENTS_COLLEGE_INTERVIEW_COMPLETED,PLACEMENTS_COLLEGE_INTERVIEW_NO_SHOW,1
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- College Admin interviews: isolated PostgreSQL > COL-placements-04: rejects past times, virtual without https, overlapping room, non-shortlisted candidate and closed drive

  ```
  Error: Failed query: select "id" from "placement_round_candidate_slots" where ("placement_round_candidate_slots"."application_id" = $1 and "placement_round_candidate_slots"."status" = $2 and not exists (select "id" from "activity_events" where ("activity_events"."subject_id" = "placement_round_candi
  params: 96ec8c4a-1e03-443a-a37d-848e0dea60ec,BOOKED,placement_round_candidate_slot,PLACEMENTS_COLLEGE_INTERVIEW_COMPLETED,PLACEMENTS_COLLEGE_INTERVIEW_NO_SHOW,1
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- College Admin interviews: isolated PostgreSQL > COL-placements-19: directory lists booked interviews with summary, mode/status/company filters and a student overlap conflict

  ```
  Error: Failed query: select "id" from "placement_round_candidate_slots" where ("placement_round_candidate_slots"."application_id" = $1 and "placement_round_candidate_slots"."status" = $2 and not exists (select "id" from "activity_events" where ("activity_events"."subject_id" = "placement_round_candi
  params: 02f2c22c-3edf-4b60-9aad-2d4f6b8b64bb,BOOKED,placement_round_candidate_slot,PLACEMENTS_COLLEGE_INTERVIEW_COMPLETED,PLACEMENTS_COLLEGE_INTERVIEW_NO_SHOW,1
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```

## tests/integration/placements-learner-journey.test.ts (2 failing)
- Learner placement journey > hides internal screening state while exposing confirmed learner-facing decisions and applied results

  ```
  
  ```
- Learner placement journey > is learner-only rather than a generic same-college read model

  ```
  error: update or delete on table "placement_applications" violates foreign key constraint "placement_college_application_stages_application_id_placement_a" on table "placement_college_application_stages"
  ❯ node_modules/pg-pool/index.js:45:11
  ❯ cleanup tests/integration/placements-learner-journey.test.ts:104:3
  102|     "delete from placement_application_status_history",
  103|   );
  104|   await pool.query(
  |   ^
  105|     "delete from placement_applications",
  ```
