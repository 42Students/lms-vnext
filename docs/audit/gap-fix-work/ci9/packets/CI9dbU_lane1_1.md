# CI unit-test packet (round 9db)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/college-placements-interviews.test.ts (3 failing)
- College Admin interviews: isolated PostgreSQL > COL-placements-04: schedule, edit, complete persist, audit and notify the candidate

  ```
  Error: Failed query: select "id", exists(
  select 1 from placement_round_candidate_slots other
  join placement_jobs jo on jo.id=other.job_id and jo.college_id=$1
  join placement_applications me on me.id="application_id"
  join placement_applications oa on oa.id=other.application_id
  where other.id<>"id" and other.status='BOOKED'
  and oa.membership_id=me.membership_id
  and other.starts_at < "ends_at" + interval '15 minutes'
  ```
- College Admin interviews: isolated PostgreSQL > COL-placements-04: rejects past times, virtual without https, overlapping room, non-shortlisted candidate and closed drive

  ```
  Error: This candidate already has an interview that overlaps with the requested time. Please choose a different slot.
  ❯ src/modules/placements/college-round-slot-action-service.ts:404:11
  402|       gt(slots.endsAt,new Date(start.getTime()-bufferMs))));
  403|    if(overlapping.some(x=>x.id!==oldId&&x.membershipId===app.membershi…
  404|     throw Error("This candidate already has an interview that overlaps…
  |           ^
  405|    if(overlapping.some(x=>x.id!==oldId&&
  406|       x.room.trim().toLocaleLowerCase("en-IN")===normalizedRoom))
  ```
- College Admin interviews: isolated PostgreSQL > COL-placements-19: directory lists booked interviews with summary, mode/status/company filters and a student overlap conflict

  ```
  Error: This candidate already has an interview that overlaps with the requested time. Please choose a different slot.
  ❯ src/modules/placements/college-round-slot-action-service.ts:404:11
  402|       gt(slots.endsAt,new Date(start.getTime()-bufferMs))));
  403|    if(overlapping.some(x=>x.id!==oldId&&x.membershipId===app.membershi…
  404|     throw Error("This candidate already has an interview that overlaps…
  |           ^
  405|    if(overlapping.some(x=>x.id!==oldId&&
  406|       x.room.trim().toLocaleLowerCase("en-IN")===normalizedRoom))
  ```
