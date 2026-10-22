# CI unit-test packet (round 3)

These INTEGRATION tests (real PostgreSQL in CI, all migrations applied) FAIL on main. Read the CI workflow .github/workflows/ci.yml for the DB setup. For each failing assertion decide:
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

## tests/integration/college-placements-pipeline.test.ts (1 failing)
- College Admin placement pipeline: isolated PostgreSQL > COL-placements-01: invalid transitions, Offered without an issued offer and Hired without joining are rejected per row

  ```
  AssertionError: expected 'Cannot move from APPLIED to HIRED. Al…' to match /Invalid transition/
  - Expected:
  /Invalid transition/
  + Received:
  "Cannot move from APPLIED to HIRED. Allowed next stages: SHORTLISTED, REJECTED."
  ```

## tests/integration/db10-notification-pagination.test.ts (2 failing)
- W06 notification keyset history > paginates all 115 rows with no skip/duplicate and never leaks another user

  ```
  AssertionError: expected [ …(122) ] to have a length of 115 but got 122
  - Expected
  + Received
  - 115
  + 122
  ```
- W06 notification keyset history > preserves equal-timestamp UUID tie ordering and unread filter

  ```
  AssertionError: expected 10 to be 3 // Object.is equality
  - Expected
  + Received
  - 3
  + 10
  ```

## tests/integration/hr-notifications.test.ts (1 failing)
- HR in-app notification scopes > reads only own recipient's exact company job notification

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
