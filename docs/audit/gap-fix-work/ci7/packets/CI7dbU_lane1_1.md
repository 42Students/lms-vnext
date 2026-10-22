# CI unit-test packet (round 7db)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/chat11-college-project-roster-retry.test.ts (1 failing)
- IIT Dharwad College Admin roster retries and concurrent tabs (PostgreSQL) > PROJ-COL-STALE-03 a genuinely different stale request is refused, preserving the first write

  ```
  AssertionError: promise resolved "{ added: +0, removed: +0, …(1) }" instead of rejecting
  - Expected
  + Received
  - Error {
  -   "message": "rejected promise",
  + {
  +   "added": 0,
  +   "removed": 0,
  ```

## tests/integration/learner-application-withdrawal.test.ts (1 failing)
- Learner application withdrawal on fresh PostgreSQL fixtures > withdraws its own submitted application and atomically records reason + audit exactly once

  ```
  error: update or delete on table "activity_events" violates foreign key constraint "in_app_notifications_event_id_activity_events_id_fk" on table "in_app_notifications"
  ❯ node_modules/pg-pool/index.js:45:11
  ❯ tests/integration/learner-application-withdrawal.test.ts:38:5
  36|   // before deleting the test-owned application and membership.
  37|   try {
  38|     await pool.query("DELETE FROM activity_events WHERE dedupe_key=$1"…
  |     ^
  39|       "placement-application:" + current.ids.application + ":withdrawn…
  ```
