# CI unit-test packet (round 8db)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/hr-inline-round-results.test.ts (1 failing)
- HR inline result read auth (isolated PG) > reads own rounds but masks foreign employer / college / wrong role before projection

  ```
  ReferenceError: publishPlacementJob is not defined
  ❯ tests/integration/hr-inline-round-results.test.ts:30:3
  28|   const round=await createPlacementRound(tpo,job.id,{kind:"TEST",name:…
  29|   await upsertJobEligibilityPolicy(tpo,job.id,{});
  30|   await publishPlacementJob(tpo,job.id);
  |   ^
  31|   const id=randomUUID();
  32|   const hr=(companyId:string,relationshipId:string,collegeId:string):R…
  ```
