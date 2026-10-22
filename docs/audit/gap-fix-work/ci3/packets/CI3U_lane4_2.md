# CI unit-test packet (round 3)

These INTEGRATION tests (real PostgreSQL in CI, all migrations applied) FAIL on main. Read the CI workflow .github/workflows/ci.yml for the DB setup. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/learner-interview-reschedule-summary.test.ts (2 failing)
- L16-015 approved persisted reschedule to own learner summary > reports the approved exception, not the superseded interview date

  ```
  
  ```
- L16-015 approved persisted reschedule to own learner summary > rejects forged college, suspended and wrong-role principals

  ```
  error: null value in column "learner_membership_id" of relation "placement_learner_requests" violates not-null constraint
  ❯ node_modules/pg-pool/index.js:45:11
  ❯ tests/integration/learner-interview-reschedule-summary.test.ts:19:1
  ```

## tests/integration/people-memberships.test.ts (1 failing)
- people and memberships against PostgreSQL > lets the same canonical user join a second college and isolates lifecycle state

  ```
  Error: Failed query: select distinct "project_instances"."id" from "project_members" inner join "project_instances" on "project_instances"."id" = "project_members"."project_id" where ("project_members"."membership_id" = $1 and "project_members"."role" = $2 and "project_members"."ended_at" is null an
  params: 646a1157-f01a-4f86-ad5b-80a40836d9a9,MENTOR,ARCHIVED
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```

## tests/integration/placements-w04-company-drive-facts.test.ts (1 failing)
- W04 college-scoped derived CRM Drive execution facts > counts only published drives, not drafts, without exposing applicant data

  ```
  PlacementsServiceError: PLACEMENT_JOB_NOT_PUBLISHABLE
  ❯ publishPlacementJob src/modules/placements/job-service.ts:799:11
  797|     (current.minimumAnnualCtcInr===null&&current.maximumAnnualCtcInr==…
  798|       current.stipendPerMonthInr===null&&activeRole.minCtc===null&&act…
  ```

## tests/integration/super-admin-db10-announcements-lifecycle.test.ts (1 failing)
- DB10 announcements registered schema lifecycle (disposable PostgreSQL) > persists, edits, resolves version conflicts, soft-deletes and restores within Super Admin scope

  ```
  Error: Failed query: insert into "announcements" ("id", "broadcast_group_id", "legacy_announcement_id", "legacy_receiver_value", "legacy_sender_id", "legacy_sender_type", "legacy_receiver_type", "legacy_receiver_label", "legacy_original_title", "legacy_original_message", "legacy_source_created_local
  params: 10000000-0000-4000-8000-000000000001,20000000-0000-4000-8000-000000000001,COLLEGE,20000000-0000-4000-8000-000000000001,DB10 integration notice,Scoped test notice,30000000-0000-4000-8000-000000000002,SUPER_ADMIN,,,false
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
