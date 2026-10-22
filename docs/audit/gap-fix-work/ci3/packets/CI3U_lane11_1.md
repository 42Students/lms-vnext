# CI unit-test packet (round 3)

These INTEGRATION tests (real PostgreSQL in CI, all migrations applied) FAIL on main. Read the CI workflow .github/workflows/ci.yml for the DB setup. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/chat16-inbound-mail-triage-cas-pg.test.ts (2 failing)
- chat-16 PostgreSQL inbound triage authorization and CAS > INBOUND-TRIAGE-PG-16 permits exactly one of two concurrent NEW to TRIAGED writes

  ```
  Error: Failed query: insert into "activity_events" ("id", "organization_id", "college_id", "actor_user_id", "actor_membership_id", "legacy_audit_id", "legacy_action_label", "legacy_target_name", "legacy_source_time_zone", "legacy_occurred_local", "legacy_event_original_code", "legacy_was_deleted", "
  params: 5f7853bd-a801-41a7-9f8c-1b79bedd77b2,PLATFORM,platform.inbound_mail.status_changed,NORMAL,INBOUND_MAIL,0653e709-d3f2-408a-a046-c8969cc4402a,Super Admin updated inbound mail triage,{"from":"NEW","to":"TRIAGED","version":1,"handlerUserId":"5f7853bd-a801-41a7-9f8c-1b79bedd77b2","eventKind":"TRI
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- chat-16 PostgreSQL inbound triage authorization and CAS > INBOUND-TRIAGE-PG-17 preserves version across completion, denied shortcut and reopen

  ```
  Error: Failed query: update "inbound_mail_messages" set "handled_at" = $1, "status" = $2, "version" = "inbound_mail_messages"."version"+1 where ("inbound_mail_messages"."id" = $3 and "inbound_mail_messages"."status" = $4 and "inbound_mail_messages"."version" = $5) returning "id", "status", "version"
  params: 2026-10-22T05:40:28.341Z,RESOLVED,11bc4fd7-9937-4f25-a6d4-bba1f8639ea8,NEW,0
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
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

## tests/integration/faculty-attendance-schedule-mutation.test.ts (2 failing)
- Faculty attendance session scheduling on disposable PostgreSQL > reads created persisted session in the precise IST date grid and rejects foreign month scope

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: 6b72248f-0c13-4376-9949-294ac2452199,1,2026,330442fc-478b-40d7-8dba-3ffe7a44cc30,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- Faculty attendance session scheduling on disposable PostgreSQL > creates scoped attendance events, prevents collisions and audits each actual change

  ```
  Error: Failed query: insert into "cohort_progression_state" ("cohort_id", "current_term_number", "current_academic_year_start", "current_period_id", "version", "updated_by_user_id", "updated_at") values ($1, $2, $3, $4, $5, $6, default)
  params: c1d89bdc-d975-4bee-896b-2acc393153dd,1,2026,3c59e617-f0d0-47c7-b335-001b8e79ab1c,0,30000000-0000-4000-8000-000000000002
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
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
