# CI unit-test packet (round 9)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat4-super-admin-tenants-modules-gap-closure.test.ts (1 failing)
- chat-4 Super Admin Tenants and Modules verified source contracts > SA-tenants-modules-61 preserves the audited admin workflow

  ```
  AssertionError: expected 'import {z} from "zod";\nexport const …' to contain '.max(60)'
  - Expected
  + Received
  - .max(60)
  + import {z} from "zod";
  + export const superAdminCollegeBroadcastSchema=z.strictObject({
  +  audienceMode:z.enum(["ALL_COLLEGES","SELECTED_COLLEGES"]),
  +  collegeIds:z.array(z.uuid()).max(500),
  ```
