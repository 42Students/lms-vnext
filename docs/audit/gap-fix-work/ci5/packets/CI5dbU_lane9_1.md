# CI unit-test packet (round 5db)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/auth-send-caps.test.ts (2 failing)
- database-enforced send caps > applies per-requester, per-contact and per-address caps

  ```
  Error: Failed query:
  UPDATE identity_auth_attempts
  SET used_at = now(), sms_code_mac = NULL,
  sms_code_expires_at = NULL, email_code_mac = NULL,
  email_code_expires_at = NULL, version = version + 1
  WHERE user_id = $1
  AND contact_fingerprint = $2
  AND used_at IS NULL AND expires_at > now()
  ```
- database-enforced send caps > holds the cap under concurrent starts

  ```
  Error: Failed query:
  UPDATE identity_auth_attempts
  SET used_at = now(), sms_code_mac = NULL,
  sms_code_expires_at = NULL, email_code_mac = NULL,
  email_code_expires_at = NULL, version = version + 1
  WHERE user_id = $1
  AND contact_fingerprint = $2
  AND used_at IS NULL AND expires_at > now()
  ```

## tests/integration/college-readiness-service.test.ts (1 failing)
- college readiness against PostgreSQL > evaluates all ten checks for a seeded college

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

## tests/integration/hr-applicant-drawer.test.ts (1 failing)
- HR applicant drawer PG guard > authorizes own company drive, denies foreign employer and wrong-role before any detail projection

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

## tests/integration/hr-today-results-due.test.ts (1 failing)
- HR today results due PostgreSQL > reads own result due, not foreign-employer, foreign college or wrong role

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
