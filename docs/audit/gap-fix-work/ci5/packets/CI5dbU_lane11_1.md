# CI unit-test packet (round 5db)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/chat16-inbound-mail-triage-cas-pg.test.ts (2 failing)
- chat-16 PostgreSQL inbound triage authorization and CAS > INBOUND-TRIAGE-PG-16 permits exactly one of two concurrent NEW to TRIAGED writes

  ```
  Error: Failed query: insert into "activity_events" ("id", "organization_id", "college_id", "actor_user_id", "actor_membership_id", "legacy_audit_id", "legacy_action_label", "legacy_target_name", "legacy_source_time_zone", "legacy_occurred_local", "legacy_event_original_code", "legacy_was_deleted", "
  params: 05042553-f57b-4a32-9d4c-34cd1853868e,PLATFORM,platform.inbound_mail.status_changed,NORMAL,INBOUND_MAIL,14fc603d-4230-4bbb-8849-d269f2469dd9,Super Admin updated inbound mail triage,{"from":"NEW","to":"TRIAGED","version":1,"handlerUserId":"05042553-f57b-4a32-9d4c-34cd1853868e","eventKind":"TRI
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- chat-16 PostgreSQL inbound triage authorization and CAS > INBOUND-TRIAGE-PG-17 preserves version across completion, denied shortcut and reopen

  ```
  Error: Failed query: update "inbound_mail_messages" set "handled_at" = $1, "status" = $2, "version" = "inbound_mail_messages"."version"+1 where ("inbound_mail_messages"."id" = $3 and "inbound_mail_messages"."status" = $4 and "inbound_mail_messages"."version" = $5) returning "id", "status", "version"
  params: 2026-10-22T07:28:32.663Z,RESOLVED,52f925e3-c4ae-4c88-9700-d37d80895ed4,NEW,0
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```

## tests/integration/college-setup-checklist.test.ts (1 failing)
- College setup steps backed by real scoped PostgreSQL counts > increments only owning-college departments from a real persisted fixture

  ```
  Error: SETUP_COUNT_UNAVAILABLE:academic-periods
  ❯ src/modules/admin-ui/college-setup-checklist-model.ts:39:15
  37|       const count = counts[step.key];
  38|       if (count === undefined || !Number.isSafeInteger(count) || count…
  39|         throw new Error("SETUP_COUNT_UNAVAILABLE:" + step.key);
  |               ^
  40|       return {
  41|         key: step.key,
  ```

## tests/integration/hr-calendar-results-due.test.ts (1 failing)
- HR results due calendar PostgreSQL > shows own scheduled round due but not foreign-company/foreign-college due

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

## tests/integration/identity-system-roles.test.ts (1 failing)
- identity context and system roles against PostgreSQL > resolves only memberships owned by the authenticated canonical user

  ```
  AssertionError: expected { …(5) } to match object { …(3) }
  (2 matching properties omitted from actual)
  - Expected
  + Received
  {
  "collegeId": "20000000-0000-4000-8000-000000000001",
  "id": "40000000-0000-4000-8000-000000000002",
  "roles": [
  ```
