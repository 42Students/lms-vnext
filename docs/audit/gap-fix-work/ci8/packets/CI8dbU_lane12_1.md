# CI unit-test packet (round 8db)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/hr-job-activity.test.ts (1 failing)
- HR job activity PG scopes > reads own job publication but denies foreign employer and wrong role

  ```
  ReferenceError: publishPlacementJob is not defined
  ❯ make tests/integration/hr-job-activity.test.ts:29:4
  27|     title,description:"Fixture",employmentType:"FULL_TIME",workMode:"H…
  28|    await seedPublishableJobReadiness(j.id,tpo.user.id);
  29|    await publishPlacementJob(tpo,j.id);return j;
  |    ^
  30|   };
  31|   const own=await make(a.relationship.id,"HR Feed Own "+n);
  ```
