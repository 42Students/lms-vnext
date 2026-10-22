# CI unit-test packet (round 8db)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/college-placements-interviews.test.ts (4 failing)
- College Admin interviews: isolated PostgreSQL > COL-placements-04: schedule, edit, complete persist, audit and notify the candidate

  ```
  Error: Failed query: select "id" from "placement_round_candidate_slots" where ("placement_round_candidate_slots"."application_id" = $1 and "placement_round_candidate_slots"."status" = $2 and not exists (select "id" from "activity_events" where ("activity_events"."subject_id" = "placement_round_candi
  params: f2398d07-83fd-4752-9961-bc25fb307706,BOOKED,placement_round_candidate_slot,PLACEMENTS_COLLEGE_INTERVIEW_COMPLETED,PLACEMENTS_COLLEGE_INTERVIEW_NO_SHOW,1
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- College Admin interviews: isolated PostgreSQL > COL-placements-04: cancel frees the candidate slot and a stale version is refused

  ```
  Error: Failed query: select "id" from "placement_round_candidate_slots" where ("placement_round_candidate_slots"."application_id" = $1 and "placement_round_candidate_slots"."status" = $2 and not exists (select "id" from "activity_events" where ("activity_events"."subject_id" = "placement_round_candi
  params: 44b894c6-d203-4389-81b9-38422a47fa56,BOOKED,placement_round_candidate_slot,PLACEMENTS_COLLEGE_INTERVIEW_COMPLETED,PLACEMENTS_COLLEGE_INTERVIEW_NO_SHOW,1
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- College Admin interviews: isolated PostgreSQL > COL-placements-04: rejects past times, virtual without https, overlapping room, non-shortlisted candidate and closed drive

  ```
  Error: Failed query: select "id" from "placement_round_candidate_slots" where ("placement_round_candidate_slots"."application_id" = $1 and "placement_round_candidate_slots"."status" = $2 and not exists (select "id" from "activity_events" where ("activity_events"."subject_id" = "placement_round_candi
  params: d7d97149-3454-4431-b3b0-f0894fe56e52,BOOKED,placement_round_candidate_slot,PLACEMENTS_COLLEGE_INTERVIEW_COMPLETED,PLACEMENTS_COLLEGE_INTERVIEW_NO_SHOW,1
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- College Admin interviews: isolated PostgreSQL > COL-placements-19: directory lists booked interviews with summary, mode/status/company filters and a student overlap conflict

  ```
  Error: Failed query: select "id" from "placement_round_candidate_slots" where ("placement_round_candidate_slots"."application_id" = $1 and "placement_round_candidate_slots"."status" = $2 and not exists (select "id" from "activity_events" where ("activity_events"."subject_id" = "placement_round_candi
  params: ed0a1fe5-942d-42d0-9bfa-a1e389462067,BOOKED,placement_round_candidate_slot,PLACEMENTS_COLLEGE_INTERVIEW_COMPLETED,PLACEMENTS_COLLEGE_INTERVIEW_NO_SHOW,1
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
