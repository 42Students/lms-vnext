# CI unit-test packet (round 10db)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/college-placements-interviews.test.ts (2 failing)
- College Admin interviews: isolated PostgreSQL > COL-placements-04: rejects past times, virtual without https, overlapping room, non-shortlisted candidate and closed drive

  ```
  AssertionError: expected [Function] to throw error matching /overlapping/ but got 'Cannot schedule a new round while a p…'
  - Expected:
  /overlapping/
  + Received:
  "Cannot schedule a new round while a previous round is still active (status: SCHEDULED). Please mark the current round as Completed or Cancel it first."
  ```
- College Admin interviews: isolated PostgreSQL > COL-placements-19: directory lists booked interviews with summary, mode/status/company filters and a student overlap conflict

  ```
  Error: Failed query: select count(*), count(*) filter(where "interview_status" in
  ('SCHEDULED','CONFIRMED','RESCHEDULE_REQUESTED'))::int, count(*) filter(where ("starts_at" at time zone 'Asia/Kolkata')::date=(now() at time zone 'Asia/Kolkata')::date)::int, count(distinct "id")::int from (select "id", "job_id", "round_id", "application_id", "id", "display_name", "name", "id", "dep
  join programs p on p.id=e.program_id join departments d on d.id=p.department_id
  where e.membership_id="college_memberships"."id" and e.status='ACTIVE'
  and d.college_id=$1
  order by e.admitted_at desc,e.id desc limit 1) as "department_name", "placement_jobs"."title", "placement_job_rounds"."name", coalesce(nullif(trim("placement_round_candidate_slots"."legacy_interviewer_name"),''),nullif(trim("placement_round_candidate_slots"."panel"),'')) as "interviewer_name", "plac
  ('SCHEDULED','CONFIRMED','RESCHEDULE_REQUESTED','COMPLETED','CANCELLED','NO_SHOW')
  then "placement_round_candidate_slots"."legacy_interview_status"
  ```
