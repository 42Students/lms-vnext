# DB07 Projects — shared-phase persistence reconciliation

**Observed:** 2026-10-11 IST  
**Legacy backend:** `42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5`  
**Legacy frontend:** `42Students/lms2-fe@e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2`  
**Queue task:** DB-010 · **Worker:** Chat 1

This document reconciles the existing W03 DB07 field ledger and staged SQL into the current shared DATABASE phase. It is source evidence only; no PostgreSQL replay or negative DB test is claimed.

## Source scope

`docs/planning/db07-w03-field-review.json` contains **16 current Project JPA tables / 358 source fields**. All sixteen have current entity evidence in the frozen production backend, so none is a safe retirement candidate merely because vNext uses a normalized target.

Current source tables: project_activity_event, project_delivery, project_delivery_event, project_meeting, project_meeting_history, project_member, project_release, project_resource, project_resource_audit, project_sprint, project_task, project_task_comment, project_template, project_template_college, project_template_version, project_workspace.

The existing DB07 ledger correctly keeps **verified = 0** and **approvedRetired = 0**.

## Missing target concepts

The W03 ledger already identifies four current source concepts without a dedicated target table:

1. `project_delivery_event`
2. `project_meeting_history`
3. `project_resource_audit`
4. `project_task_comment`

Do not close those fields by pointing at generic JSON or the activity feed without proving query, history, actor and retention behavior.

## Same-project integrity

The staged `db07-w03-core-project-relationship-integrity-candidate.sql` addresses a real gap. Current single-column foreign keys allow privileged/direct SQL to pair IDs from different projects.

Required same-project invariants include sprint→release, task→sprint, task submission→task, final review/evaluation→submission, and meeting→linked sprint/task. Composite `(project_id,id)` unique targets plus composite FKs should be promoted after the shared schema collision clears.

Additional scope checks still need database or trigger/service-backed proof:
- project member membership belongs to the project's college;
- project instance team group belongs to the same college/project context;
- template college assignment version belongs to the assigned template;
- reviewer/submitter memberships are same-college and authorized for the project.

## Task allocation persistence

Current `project_tasks` covers title/status/priority/sequence but not the active legacy allocation/planning contract. The W03 task draft correctly stages assignee via `project_members`, due date/label, estimate points, task type, approach, blocker reason, carry-over sprint, removed-from-template, optimistic version and created/updated actor attribution.

Legacy task submission columns should stay normalized in `project_task_submissions`; do not duplicate them back onto `project_tasks`.

## Workspace lifecycle

Legacy `project_workspace` contains planning and lifecycle state not equivalent to current `project_instances.status` + `archived_at`.

The staged workspace draft correctly separates section scope, phase/blocker/next action, dates, sprint length/estimation unit, readiness override attribution, optimistic version and recoverable delete/restore.

**Archive and Delete are distinct.** Recoverable deletion must not be represented by `status='ARCHIVED'`. Delete/restore needs actor/time and immutable event evidence, while ordinary Learner/Mentor/admin reads must exclude deleted workspaces except an explicit Deleted Workspaces surface.

## History / audit contracts

A generic `activity_events` feed is not automatically equivalent to typed Project history.

Current source-backed gaps:
- `project_delivery_event`: delivery revision/review lifecycle history;
- `project_meeting_history`: before/after meeting mutations;
- `project_resource_audit`: before/after resource mutations;
- `project_task_comment`: persistent collaboration/progress comments.

If a generic immutable event model is chosen, it must preserve project scope, typed parent relation, actor, time, order and before/after payload where the source job needs it.

## Delivery and resource persistence

`project_submissions` covers normalized final delivery, but legacy `project_delivery` also carries draft-save provenance, revision count, review/lock actors and timestamps, file/storage metadata, review state and optimistic version. Do not flatten those into one mutable row if it destroys revision/history semantics.

Uploaded project resources and delivery files must coordinate with DB-016/private-object safety; a public URL must not be the trust anchor for tenant-private files.

## Promotion boundary

Chat 5 currently holds a broad `src/db/schema/**` claim for DB03. DB-010 therefore does **not** modify Project schema or numbered Drizzle migrations in this batch.

After that claim clears, the migration-integrator review should combine—not blindly copy—the staged:
- `db07-w03-core-project-relationship-integrity-candidate.sql`
- `db07-w03-task-allocation-parity-candidate.sql`
- `db07-w03-workspace-state-parity-candidate.sql`

Promotion requires canonical Drizzle declarations, numbered migration/snapshot, zero-to-head replay, direct-SQL negative tests and service regression evidence.

## Staged-candidate integration reconciliation

A second pass found promotion-time collisions between the W03 drafts. Those are now resolved at the source-only layer:

- `db07-w03-workspace-state-parity-candidate.sql` is the canonical workspace-state promotion input; the older admin workspace draft is explicitly superseded and must not be promoted beside it.
- readiness override is tri-state: `TRUE` force-unlocks, `FALSE` force-blocks and `NULL` clears; both non-null values require actor/time provenance. The legacy note is optional and service-capped at 2000 characters.
- legacy restore does not restore a saved previous status. It recalculates `ACTIVE` when an active mentor exists and `BLOCKED` otherwise, so `status_before_delete` is rejected and the target status domain must admit `BLOCKED`.
- `db07-w03-core-project-relationship-integrity-candidate.sql` owns the active task→sprint same-project FK and composite target.
- `db07-w03-task-backlog-and-delivery-state-candidate.sql` owns nullable `sprint_id`, `carried_over_from_sprint_id` and the carry-over same-project FK.
- `db07-w03-task-allocation-parity-candidate.sql` no longer redeclares carry-over DDL.

The detailed promotion ownership and open decisions are recorded in `docs/planning/database-parity-db07-integration-reconciliation.md`, with a static contract guard in `tests/unit/w03-db07-integration-reconciliation.test.ts`. That test is authored but not claimed executed while DB-001 remains blocked.

## Runtime gates still open

- DB-001 blocks executable PostgreSQL/CI evidence.
- The 358 DB07 fields remain runtime-unverified.
- Four missing target history/comment concepts need final target design.
- Direct SQL same-project/same-college violations have not been executed.
- Concurrency witnesses for task versioning, delivery revision, workspace delete/restore and readiness override have not executed.

Therefore DB-010 remains **IN_PROGRESS** after this source batch.
