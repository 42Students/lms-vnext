# CI unit-test packet (round 5db)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/admin-college-branding-preview-service.test.ts (2 failing)
- Super Admin college branding preview against PostgreSQL > reads only the seeded college's actual stored branding, or honest defaults

  ```
  AuthorizationError: Missing permission: college.read
  ❯ requirePermission src/modules/permissions/policy.ts:308:11
  306| ) {
  307|   if (!can(context, permission, resource)) {
  308|     throw new AuthorizationError(permission);
  |           ^
  309|   }
  310| }
  ```
- Super Admin college branding preview against PostgreSQL > allows an explicitly selected matching college scope

  ```
  AuthorizationError: Missing permission: college.read
  ❯ requirePermission src/modules/permissions/policy.ts:308:11
  306| ) {
  307|   if (!can(context, permission, resource)) {
  308|     throw new AuthorizationError(permission);
  |           ^
  309|   }
  310| }
  ```

## tests/integration/college-group-rule-preview-denial.test.ts (1 failing)
- College group rule preview — isolated PostgreSQL > reads valid rule matches, prevents foreign college and non-admin visibility, and never writes

  ```
  AssertionError: expected [Function] to throw error including 'ROLLBACK_GROUP_RULE_PREVIEW' but got 'Failed query: insert into learner_pro…'
  - Expected
  + Received
  - ROLLBACK_GROUP_RULE_PREVIEW
  + Failed query: insert into learner_program_enrollments
  +         (id,membership_id,program_id,cohort_id,status)
  +         values ($1,$2,
  +           $3,$4,'ACTIVE')
  ```

## tests/integration/db10-notification-read-all.test.ts (2 failing)
- W06 mark-all notification isolation > acknowledges the entire inbox, including rows past the 100-item page

  ```
  AssertionError: expected 111 to be 105 // Object.is equality
  - Expected
  + Received
  - 105
  + 111
  ```
- W06 mark-all notification isolation > multiple simultaneous mark-all calls cannot mutate other users

  ```
  AssertionError: expected 12 to be 6 // Object.is equality
  - Expected
  + Received
  - 6
  + 12
  ```

## tests/integration/hr-offer-selection.test.ts (1 failing)
- HR offer read scope PG > reads only same company/college offers without claiming unbacked LOI

  ```
  PlacementsServiceError: PLACEMENT_JOB_NOT_PUBLISHABLE
  ❯ src/modules/placements/job-service.ts:830:13
  828|     ]);
  829|     if (!rounds.length || !policy.length) {
  830|       throw new PlacementsServiceError("PLACEMENT_JOB_NOT_PUBLISHABLE"…
  |             ^
  831|     }
  832|     const now = new Date();
  ```
