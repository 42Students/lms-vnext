# CI unit-test packet (round 9)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/tpo-recruiters-13-invite-readiness.test.ts (1 failing)
- TPO-recruiters-13 PUB-auth-public-40 cannot issue dead-end invitations > requires a linked company before token rotation and avoids claiming delivery without a verified work email

  ```
  AssertionError: expected -1 to be greater than -1
  ❯ tests/unit/tpo-recruiters-13-invite-readiness.test.ts:7:17
  5|   const service=readFileSync("src/modules/placements/tpo-recruiter-inv…
  6|   const pivot=service.indexOf("if(!lead.companyRelationshipId)");
  7|   expect(pivot).toBeGreaterThan(-1);
  |                 ^
  8|   expect(pivot).toBeLessThan(service.indexOf("let credential;",pivot));
  9|   // The invite link can be shared manually; emailing is a separate ac…
  ```
