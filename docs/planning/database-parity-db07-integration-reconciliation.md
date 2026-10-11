# DB07 projects — integration reconciliation

**Observed:** 2026-10-11 IST  
**Global phase:** DATABASE · **Queue task:** DB-010 · **Worker:** Chat 1  
**Legacy backend oracle:** `42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5`  
**Legacy frontend oracle:** `42Students/lms2-fe@e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2`

This document reconciles the existing W03 DB07 source-only SQL proposals before any registered Drizzle migration is created. It is not runtime certification. The independent PostgreSQL verification harness is authored but no DB07 replay/negative PostgreSQL result is on record. These drafts remain promotion inputs, not live schema.

## Promotion ownership

| Concern | Canonical staged input | Rule |
| --- | --- | --- |
| Same-project parent/child integrity | `db07-w03-core-project-relationship-integrity-candidate.sql` | Owns composite targets and the active sprint/task FK, plus submission/review/evaluation/meeting same-project FKs. |
| Task allocation and edit metadata | `db07-w03-task-allocation-parity-candidate.sql` | Owns assignee project-member FK, due/estimate/type/approach/blocker/version and actor fields. It must not redeclare carry-over storage. |
| Sprint backlog and carry-over | `db07-w03-task-backlog-and-delivery-state-candidate.sql` | Owns nullable `sprint_id`, `carried_over_from_sprint_id`, carry-over FK and backlog indexes. It relies on the core draft for the active sprint composite FK. |
| Workspace planning/readiness/delete state | `db07-w03-workspace-state-parity-candidate.sql` | Canonical workspace-state proposal. |
| Older admin workspace proposal | `db07-w03-admin-workspace-state-candidate.sql` | **Superseded for promotion**; retained only as design history. |
| Missing project history/comment tables | `db07-w03-unrepresented-project-history-candidate.sql` + `src/db/schema/project-audit-staged.ts` | Source-only append/history candidates; not in the schema barrel or migration journal. |

## Source-backed decisions

### Readiness is tri-state

Legacy `overrideProjectReadiness` persists `TRUE` for force-unlock, `FALSE` for force-block, and `NULL` for clear. Both non-null values carry actor/time provenance; the note is optional and service-capped at 2000 characters. The canonical workspace draft therefore must permit both boolean values and must clear note/actor/time when the override is null.

### Restore recalculates status

Frozen legacy `restoreProject` does not restore a previously saved status. It revives rows tombstoned by the workspace delete and then recalculates the workspace to:

- `ACTIVE` when an active mentor exists;
- `BLOCKED` when no active mentor exists, with an explanatory blocker.

Therefore `status_before_delete` is not a source-backed parity field and must not be promoted. vNext's project status domain must include `BLOCKED` if exact restore parity is retained.

### Sprint completion moves unfinished work to backlog

Legacy `completeSprint` leaves DONE tasks attached to the completed sprint, but moves every unfinished task to backlog and records the source sprint. The target therefore needs nullable `project_tasks.sprint_id` plus `carried_over_from_sprint_id`. This is one semantic contract, so only the backlog draft owns those DDL changes.

## Open decisions — do not silently guess

- Delivery `REQUEST_CHANGES / ACCEPT / LOCK / REOPEN` semantics are not yet fully normalized onto vNext's versioned `project_submissions` and one-review-per-submission model.
- Workspace slug reuse after recoverable deletion needs explicit source/product evidence before replacing the current all-row unique constraint with a partial unique index.
- Cross-tenant actor/member/project integrity still needs direct negative PostgreSQL evidence.
- The 358-field DB07 ledger remains source-derived; field rows are not runtime verified until a disposable PostgreSQL replay and negative tests execute.
- History/event tables still need transactionally wired producer APIs and authorization/redaction review before they can be considered parity-complete.

## Promotion gate

Before any DB07 draft becomes a numbered migration, the migration integrator must combine these ownership rules into one non-duplicative schema change, reconcile Drizzle schema and snapshot, run zero-to-head replay, execute same-project/tenant negative tests, and then update the DB07 field ledger with actual verification evidence. Until then DB-010 may be source-complete, but it cannot be `DONE_VERIFIED`.

## DB07 history/comment retention hardening (2026-10-12)

Source-level hardening was committed directly on `main` without editing
`drizzle/**`, the shared schema barrel, or another chat's active DB09 work.

- SQL staging commit [753387fe](https://github.com/42Students/lms-vnext/commit/753387fe6c10fdc9ced04fb6109deb670c85d09f):
  append-only meeting/resource/delivery histories reject `UPDATE`, `DELETE`,
  **and `TRUNCATE`**. PostgreSQL does not run row-level DELETE triggers for
  `TRUNCATE`; three new statement triggers close that loss path.
- The same draft rejects hard `DELETE` and `TRUNCATE` on `project_task_comments`
  because legacy `is_deleted` is represented as recoverable `deleted_at`.
  Updates may still edit text/progress/deletion state, but cannot reparent
  `id`, `project_id`, `project_task_id`, author identity or creation time.
- Staged Drizzle declaration [97feffdd](https://github.com/42Students/lms-vnext/commit/97feffddd8e51079da2ae22eaff64df21facfb8e)
  mirrors `updated_at >= created_at` and `deleted_at >= created_at`.
  Trigger enforcement itself belongs to the SQL promotion, not Drizzle checks.
- Standalone Node source guards:
  [4edbcf75](https://github.com/42Students/lms-vnext/commit/4edbcf759917a3917fdbced627abb39d895cb2e5),
  `node --test tests/db07-project-history-retention.test.mjs`;
  includes three negative mutant tests and a read-only staging assertion.
- Additional four-table SQL/Drizzle field and composite-FK parity guards:
  [3d94f650](https://github.com/42Students/lms-vnext/commit/3d94f65095cd91a069770dd1093b81f2965a3114),
  `node --test tests/db07-history-schema-parity.test.mjs`;
  includes negative mutation checks for missing JSON snapshots, unmirrored fields and cross-project FK drift.
- PostgreSQL acceptance witness:
  [b88c282d](https://github.com/42Students/lms-vnext/commit/b88c282df85bc1aeba4b116140e8e864a67a078b),
  `docs/planning/sql/db07-w03-history-retention-acceptance-unregistered.sql`.
  It checks nine enabled, correctly attached triggers and directly attempts
  four `TRUNCATE` calls inside a rollback-only transaction; rejection must be
  SQLSTATE `23514`. **Run only against a disposable database after promotion.**

**Evidence boundaries:** Nine in-process source assertions against the fetched
`main` blobs passed; the authored Node test file, a clean Drizzle migration
replay and the PostgreSQL witness have **not been executed** in this work
session. These changes do not close DB-010's runtime requirement, certify its
358 source fields, or authorize moving out of DATABASE. Chat 1's next DB07
migration integration must include the retention triggers and chronology checks
with the four missing tables rather than adopting an older draft version.
