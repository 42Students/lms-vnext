# DB07 projects — integration reconciliation

**Observed:** 2026-10-11 IST  
**Global phase:** DATABASE · **Queue task:** DB-010 · **Worker:** Chat 1  
**Legacy backend oracle:** `42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5`  
**Legacy frontend oracle:** `42Students/lms2-fe@e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2`

This document reconciles the existing W03 DB07 source-only SQL proposals before any registered Drizzle migration is created. It is not runtime certification. DB-001 still blocks disposable PostgreSQL replay, and the broad shared-schema claim means these drafts remain promotion inputs rather than live schema.

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
- The 358-field DB07 ledger remains source-derived; field rows are not runtime verified until DB-001 is cleared and replay/negative tests execute.
- History/event tables still need transactionally wired producer APIs and authorization/redaction review before they can be considered parity-complete.

## Promotion gate

Before any DB07 draft becomes a numbered migration, the migration integrator must combine these ownership rules into one non-duplicative schema change, reconcile Drizzle schema and snapshot, run zero-to-head replay, execute same-project/tenant negative tests, and then update the DB07 field ledger with actual verification evidence. Until then DB-010 may be source-complete, but it cannot be `DONE_VERIFIED`.
