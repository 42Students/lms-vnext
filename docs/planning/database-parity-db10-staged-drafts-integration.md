# DB-040 — DB10 staged-draft source-map and migration-readiness preflight

**Worker:** Chat 5  
**Global phase:** DATABASE  
**Legacy backend oracle:** `42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5`  
**State:** 75 SOURCE FIELDS TARGETED IN ISOLATED DRAFTS / NOT REGISTERED / POSTGRES NOT RUN

This batch does **not** invent more DB10 tables. It closes the integration-evidence
gap for three families that already have isolated schema/service/test work:

- legacy `announcements`: **13 fields**;
- legacy bug tracker family: **58 fields** across five tables;
- legacy `scheduled_job_lock`: **4 fields**.

Total: **75 legacy fields**.

All 75 remain `UNMAPPED` in the global DB10 ledger until the draft tables are
registered, migrations replay, and runtime witnesses pass. This preflight only
proves that every current proposed target is actually present in the isolated
draft source.

## 1. Announcements — 13 source fields

Existing draft: `src/db/schema/db10-announcements.draft.ts`.

Source mapping is already documented in
`docs/planning/database-parity-db10-announcements.md`:

- id → UUID id;
- receiver_type → receiver_type;
- receiver_value → receiver_id UUID;
- title/message → bounded/plain-text content;
- sender_id/type → canonical user + role snapshot;
- created/updated → timestamptz;
- is_deleted → deleted_at + deleted_by_user_id;
- scheduled_at / expires_at / is_pinned preserved.

Intentional vNext safety additions are **not source-field inflation**:

- `organization_id` + `college_id` explicit tenant scope;
- `deleted_by_user_id` actor-attributed deletion;
- `version` optimistic concurrency.

The plain-text message decision is an intentional safety redesign; legacy HTML
must not become unsanitized rendered HTML.

## 2. Bug tracker — 58 source fields

Existing draft: `src/db/schema/db10-bug-tracker.draft.ts`.

Reviewed source families:

| Legacy family | Fields | Draft target |
| --- | ---: | --- |
| bug_report | 31 | bug_reports |
| bug_report_activity | 8 | bug_report_activities |
| bug_report_attachment | 7 | bug_report_attachments |
| bug_tracker_access | 7 | bug_tracker_access |
| bug_tracker_session | 5 | bug_tracker_sessions |
| **Total** | **58** | five draft tables |

The existing bug-tracker handoff already records deliberate security redesigns:
hashed credentials/sessions, authenticated actor ownership, private attachment
storage, restrictive history deletion, UUID internal IDs and optimistic
concurrency.

Draft-only safety additions include concepts such as:

- report `college_id` tenant scope;
- activity `actor_user_id` / `actor_access_id` provenance;
- session `revoked_at`;
- stronger checks/indexes and restrictive FKs.

Those additions do not satisfy migration/runtime parity by themselves.

## 3. Scheduled job locking — 4 source fields

Existing draft: `src/db/schema/db10-scheduled-job-leases.draft.ts`.

Legacy `scheduled_job_lock` maps:

- name → `scheduled_job_leases.job_name`;
- locked_until → `locked_until timestamptz`;
- locked_by → `locked_by`;
- updated_at → `updated_at timestamptz`.

vNext intentionally adds `fence bigint > 0`. The current Postgres lease store
uses atomic `INSERT ... ON CONFLICT DO UPDATE`, database clock and fence
increments to prevent a stale worker from acting after lease loss. This is a
safety redesign, not an extra legacy field.

## 4. Static source→draft preflight

`tests/db10-staged-drafts-source-map.test.mjs` must:

1. select exactly the seven legacy tables above from the DB10 ledger;
2. assert exactly **75** source rows;
3. assert source counts 13 / 58 / 4;
4. require every row to have a proposed target;
5. resolve each target table/column into the correct isolated draft;
6. support the announcement soft-delete composite target
   `deleted_at + deleted_by_user_id`;
7. prove all draft files remain absent from `src/db/schema/index.ts`;
8. prove the global ledger still reports `verified=0` and the 75 rows remain
   `UNMAPPED`.

Passing this test is source-shape evidence only.

## 5. Migration dependency order

The migration integrator may use one reviewed DB10 migration batch or multiple
forward-only migrations, but parent order must be preserved.

### Scheduled job leases

Independent except for PostgreSQL itself:

1. `scheduled_job_leases`.

### Announcements

After registered core parents:

1. organizations;
2. colleges;
3. users;
4. announcements.

Recipient target is polymorphic, so `receiver_id` cannot be one direct FK.
Runtime service must continue resolving target type/id to persisted tenant scope.

### Bug tracker

After users/colleges:

1. bug_tracker_access;
2. bug_tracker_sessions → access;
3. bug_reports → access + optional college;
4. bug_report_activities → report + actor user/access;
5. bug_report_attachments → report.

Private object storage remains an application/storage authorization concern; do
not create public object URLs in the migration.

## 6. Registration invariants

For each draft family:

- schema declaration and numbered migration must land together;
- shared schema barrel export must not precede the migration;
- Drizzle journal/snapshot must be generated/reconciled by Chat 1;
- runtime readiness flag must stay fail-closed until disposable PostgreSQL
  replay and the family integration tests pass;
- no source row moves to IMPLEMENTED/DB_TESTED because a draft file exists.

## 7. Cross-family collision review

These drafts are semantically separate:

- announcements are pull-based shared communication;
- bug tracker is operational issue/evidence persistence;
- scheduled-job leases coordinate background workers.

They should not share a generic "operations JSON" table.

Common parent references (`users`, `colleges`, `organizations`) must use
registered canonical UUID parents and restrictive tenant-safe behavior.

## 8. Required acceptance — ALL NOT_RUN

- **DB40-01:** static preflight sees exactly 75 ledger rows.
- **DB40-02:** announcements contributes exactly 13 rows.
- **DB40-03:** bug tracker contributes exactly 58 rows across five tables.
- **DB40-04:** scheduled_job_lock contributes exactly 4 rows.
- **DB40-05:** every proposed target column exists in its isolated draft.
- **DB40-06:** announcement soft-delete composite resolves both target columns.
- **DB40-07:** all three draft modules remain outside the shared schema barrel before integration.
- **DB40-08:** ledger remains 0 verified and all 75 rows remain UNMAPPED before migration.
- **DB40-09:** announcement tenant parents reference registered organization/college/user tables.
- **DB40-10:** bug tracker internal parent order is migration-safe.
- **DB40-11:** bug tracker attachment storage remains private-key metadata, not public URL persistence.
- **DB40-12:** scheduled lease fence is positive and stale-worker writes require the current fence.
- **DB40-13:** announcement version/CAS and soft-delete/restore witnesses pass on PostgreSQL.
- **DB40-14:** bug tracker CAS/history/session/attachment authorization witnesses pass on PostgreSQL.
- **DB40-15:** scheduled-job acquisition/renewal/loss concurrency witnesses pass on PostgreSQL.
- **DB40-16:** empty-database migration replay succeeds.
- **DB40-17:** latest-to-new migration replay succeeds.
- **DB40-18:** Drizzle schema/snapshot/catalog diff reports no drift.
- **DB40-19:** runtime readiness flags remain off until exact integrated SHA tests pass.
- **DB40-20:** DB19 final field audit advances rows only from executed evidence, not this source preflight.

## Completion boundary

DB-040 can be **COMPLETED, unverified** when the static preflight, this manifest
and the 75-row ledger source-disposition annotations are committed.

It cannot be DONE_VERIFIED until Chat 1 registers the schemas/migrations and the
family-specific PostgreSQL/runtime witnesses execute on the integrated SHA.
