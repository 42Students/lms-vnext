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

## Project-team materialization atomicity

The current DB03 group kernel is safer than the earlier snapshot: PROJECT_TEAM membership joins now mirror active learners into `project_members` inside the same `joinGroup` transaction, and the group/project link validates empty same-college rosters.

However, the complete team-creation workflow is still split across separate public transactions:

- `createGroup`
- `attachProjectTeamGroup`
- `transitionGroup`
- one or more `joinGroup` calls

Legacy team creation has per-team atomicity: workspace + PROJECT_TEAM group + every learner join either commit together or the whole team fails. DB07 must therefore consume a DB03-owned **transaction-aware materialization primitive** (or tx-aware internal variants) that performs create/link/activate/all-member validation and membership mirroring in one transaction. DB07 must not duplicate group membership rules. A failed later learner join must never leave a half-created team/workspace.

## Tenant-scoped Project events

The shared `activity_events` model can carry Project lifecycle events, but its generic string `subject_id` is not a relational Project FK. Correctness therefore requires event creation to derive the Project's college and actor scope **inside the same mutation transaction**.

Required negative evidence includes forged combinations of:

- Project A + college B;
- Project A + membership/actor from college B;
- Project subject id that does not resolve in the persisted Project tenant;
- lifecycle event written after the Project mutation rolled back.

A generic activity row is useful audit output, not a substitute for typed Project history tables when before/after/revision/comment semantics are required.

## Field-level source closure

`docs/planning/database-parity-db07-field-reconciliation.json` now gives every one of the **358/358 current DB07 source fields** an explicit source disposition. This is deliberately stronger than exact-name matching but weaker than certification:

- **0** fields are marked semantically verified;
- **0** fields are marked runtime verified;
- **0** source fields/tables are approved retired;
- missing histories/comments remain target gaps;
- staged task/workspace fields remain staged gaps;
- delivery revision/lock/review provenance remains a history contract;
- private Project files remain security redesign items.

The machine contract test asserts exact 358-field set equality so later edits cannot silently drop a source field.

## Promotion boundary

DB03's broad shared-schema task is now **COMPLETED**, so there is no longer an active Chat 5 schema collision. DB07 still must not bypass the global queue dependencies: DB-001 blocks executable PostgreSQL, DB-002 migration replay depends on DB-001, and DB-017 is the migration-integration task that depends on DB-002.

When those dependencies clear, the Chat 1 migration-integrator review should combine—not blindly copy—the staged:
- `db07-w03-core-project-relationship-integrity-candidate.sql`
- `db07-w03-task-allocation-parity-candidate.sql`
- `db07-w03-task-backlog-and-delivery-state-candidate.sql`
- `db07-w03-workspace-state-parity-candidate.sql`
- `db07-w03-unrepresented-project-history-candidate.sql` / `project-audit-staged.ts`

Promotion requires canonical Drizzle declarations, a non-duplicative numbered migration/snapshot, zero-to-head replay, direct-SQL same-project/same-tenant negative tests, concurrency tests and service regression evidence.

## Staged-candidate integration reconciliation

A second pass found promotion-time collisions between the W03 drafts. Those are now resolved at the source-only layer:

- `db07-w03-workspace-state-parity-candidate.sql` is the canonical workspace-state promotion input; the older admin workspace draft is explicitly superseded and must not be promoted beside it.
- readiness override is tri-state: `TRUE` force-unlocks, `FALSE` force-blocks and `NULL` clears; both non-null values require actor/time provenance. The legacy note is optional and service-capped at 2000 characters.
- legacy restore does not restore a saved previous status. It recalculates `ACTIVE` when an active mentor exists and `BLOCKED` otherwise, so `status_before_delete` is rejected and the target status domain must admit `BLOCKED`.
- `db07-w03-core-project-relationship-integrity-candidate.sql` owns the active task→sprint same-project FK and composite target.
- `db07-w03-task-backlog-and-delivery-state-candidate.sql` owns nullable `sprint_id`, `carried_over_from_sprint_id` and the carry-over same-project FK.
- `db07-w03-task-allocation-parity-candidate.sql` no longer redeclares carry-over DDL.

The detailed promotion ownership and open decisions are recorded in `docs/planning/database-parity-db07-integration-reconciliation.md`, with a static contract guard in `tests/unit/w03-db07-integration-reconciliation.test.ts`. That test is authored but not claimed executed while DB-001 remains blocked.

## Tenant and project-team integrity

The existing services already perform same-college checks, but direct SQL can bypass them through globally valid UUIDs. The staged `db07-w03-tenant-project-integrity-candidate.sql` adds promotion inputs for:

- project→team-group same-college composite FK plus `COLLEGE / PROJECT_TEAM / non-deleted` shape validation;
- same-college membership guards for project members, task submissions, final submissions, evaluations and meetings;
- same-college actor guards for the staged project history/comment tables, with canonical `SUPER_ADMIN` role as the cross-college exception rather than trusting a caller-provided actor type;
- deferred project-team roster equality between ACTIVE `lms_group_members` and active LEARNER `project_members`.

The deferred mirror is source-backed by current `src/modules/groups/service.ts`: `attachProjectTeamGroup` permits only an empty same-college `PROJECT_TEAM`, and `mirrorProjectTeamMember` writes group membership and the corresponding learner project-member state inside the same transaction. `src/modules/projects/member-service.ts` separately rejects direct learner add/end while a project is team-group managed. The staged constraints therefore validate final transaction state without imposing write order.

Static contract coverage is authored in `tests/unit/w03-db07-tenant-integrity-draft.test.ts`; execution is still not claimed while DB-001 blocks the runner/PostgreSQL gate.

## Runtime gates still open

- DB-001 blocks executable PostgreSQL/CI evidence.
- The 358 DB07 fields remain runtime-unverified.
- Four missing target history/comment concepts need final target design.
- Direct SQL same-project/same-college violations have not been executed.
- Concurrency witnesses for task versioning, delivery revision, workspace delete/restore and readiness override have not executed.

Therefore DB-010 remains **IN_PROGRESS** after this source batch.

## 2026-10-30 — DB-010 transactional tombstone hardening (source-only checkpoint)

A distinct L06 source batch hardened **18 project mutation entry points across 15
project service files**. Every newly covered mutation re-checks the live
`project_instances.deleted_at IS NULL` predicate **under a project-row
`FOR UPDATE` lock**, rather than relying on the authorization snapshot taken
before the transaction. The affected paths include learner task status and
reordering, learner backlog pulls, mentor task/sprint transitions and deletes,
task assignment, mentor overview, readiness overrides, resource create/update/
archive/reorder and full-library save, College Admin task/sprint plans and
task creation, and primary-mentor reassignment.

Children used by these mutations are separately checked for soft deletion
where a tombstoned task/sprint must not be edited or brought back into an
active workflow. Crucially, **soft-deleted task rows still reserve
`(sprint_id, sequence)`** under the *unconditional* registered
`project_tasks_sprint_sequence_uq` index. Learner reorder therefore locks
all sibling sequence rows, edits only active siblings and obtains the
temporary sequence above all reserved positions (with a 32-bit overflow
guard). Learner backlog pulls likewise include historical rows when finding
the next free destination sequence. Filtering those history rows would cause
unique collisions and is intentionally prohibited.

Source commits:

- `96aa39b151b35ba89e08c57125915512261469df` — first 10 write paths plus contract registration
- `67914b296558a448e53b0651a1b4454918fd393c` — eight further paths, including child ancestry guards
- `216d9a1aed98bb985914ce667f25a242e536c966` — backlog history-aware sequence allocation
- `13ff34d3f0449771d62f137b9360cc04a9b2dafa` — reorder history-aware sequence allocation
- `ba8662439e9ce1524aafc271f2ea76871099afcf` — source regression for unconditional reserved sequence slots

`tests/db07-project-tombstone-guards.test.mjs` is imported by the existing
`tests/db07-reconciliation-contract.test.mjs` parity suite. Isolated
source-contract evaluations passed for the first and second code batches
and 12 additional sequence/correctness checks against the committed source.
These are **not** proof of the committed Node test suite, typecheck,
disposable PostgreSQL integration or two-session deletion races.
DB-010 is still **OPEN**: execute the registered PG17 negative/race and
producer→consumer suites at a pinned SHA, finish 358-field semantic
disposition and independently verify the remaining global DB07 gate.
