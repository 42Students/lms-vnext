# CI unit-test packet (round 9db)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/courses-ui2a-faculty.test.ts (6 failing)
- courses UI2A faculty read model > keeps Faculty attendance scheduling and marking inside exact teaching scope

  ```
  
  ```
- courses UI2A faculty read model > reports current eligible learners who have not submitted or attempted

  ```
  
  ```
- courses UI2A faculty read model > uses the exact delivery roster for Students and keeps Faculty discussion moderation section-scoped

  ```
  
  ```
- courses UI2A faculty read model > pages a busy Faculty discussion without skipping microsecond-neighbor messages

  ```
  
  ```
- courses UI2A faculty read model > keeps Faculty Contacts same-college and role-filtered

  ```
  
  ```
- courses UI2A faculty read model > gives College Admin a scoped attendance grid and correction path without granting Faculty admin access

  ```
  error: update or delete on table "activity_events" violates foreign key constraint "in_app_notifications_event_id_activity_events_id_fk" on table "in_app_notifications"
  ❯ node_modules/pg-pool/index.js:45:11
  ❯ cleanupUI2A tests/integration/courses-ui2a-faculty.test.ts:134:3
  132|   // This suite writes immutable attendance audit rows which otherwise…
  133|   // its disposable class sessions; remove only events belonging to th…
  134|   await pool.query(`delete from activity_events
  |   ^
  135|     where event_type = 'courses.attendance.marked'
  ```
