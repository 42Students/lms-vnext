# CI unit-test packet (round 5db)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/mentor-resource-directory.test.ts (4 failing)
- Mentor scoped resource metadata and links — PostgreSQL > denies Learner/foreign Resource edits without persisting audit or changing content

  ```
  
  ```
- Mentor scoped resource metadata and links — PostgreSQL > writes all three Resource event types atomically and exposes only redacted Mentor labels

  ```
  
  ```
- Mentor scoped resource metadata and links — PostgreSQL > reads only assigned project resource metadata and denies forged/foreign scope

  ```
  error: update or delete on table "project_instances" violates foreign key constraint "project_resource_audit_project_id_fkey" on table "project_resource_audit"
  ❯ node_modules/pg-pool/index.js:45:11
  ❯ cleanup tests/integration/mentor-resource-directory.test.ts:42:5
  40|       await pool.query("delete from "+table+" where project_id=any($1:…
  41|     }
  42|     await pool.query("delete from project_instances where id=any($1::u…
  |     ^
  43|   }
  ```
- Mentor scoped resource metadata and links — PostgreSQL > writes all three Resource event types atomically and exposes only redacted Mentor labels

  ```
  AssertionError: expected { afterJson: { …(11) }, …(9) } to deeply equal { …(2) }
  - Expected
  + Received
  {
  +   "actionType": "CREATE",
  +   "afterJson": {
  +     "accessNotes": null,
  +     "description": "[redacted resource description]",
  ```

## tests/integration/placements-requests.test.ts (3 failing)
- Placement learner requests and exceptions > approves withdrawal atomically, scopes managers, and rejects conflicting duplicate payloads

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
- Placement learner requests and exceptions > allows reschedule only for an actual progressed participant and preserves the shared round schedule

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
- Placement learner requests and exceptions > extends an issued offer only through approval and blocks application withdrawal while the offer is active

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

## tests/integration/super-admin-db10-announcements-lifecycle.test.ts (1 failing)
- DB10 announcements registered schema lifecycle (disposable PostgreSQL) > persists, edits, resolves version conflicts, soft-deletes and restores within Super Admin scope

  ```
  Error: Failed query: insert into "announcements" ("id", "broadcast_group_id", "legacy_announcement_id", "legacy_receiver_value", "legacy_sender_id", "legacy_sender_type", "legacy_receiver_type", "legacy_receiver_label", "legacy_original_title", "legacy_original_message", "legacy_source_created_local
  params: 10000000-0000-4000-8000-000000000001,20000000-0000-4000-8000-000000000001,COLLEGE,20000000-0000-4000-8000-000000000001,DB10 integration notice,Scoped test notice,30000000-0000-4000-8000-000000000002,SUPER_ADMIN,,,false
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
