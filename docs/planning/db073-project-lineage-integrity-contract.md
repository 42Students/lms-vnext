# DB-073: project→release→sprint→task→submission integrity

**Worker:** Chat 2 · **Queue:** DB-073 · **Phase:** DATABASE · **Status:** source implementation complete only after task closure; migration NOT REGISTERED.

## Confirmed DB hole

Source: `42Students/lms-vnext/src/db/schema/projects.ts` on 2026-10-12. The registered Drizzle schema has independent UUID references for the project, release, sprint and task columns. A valid release from project B can therefore be paired with a valid sprint's project A, and the same weakness continues for tasks/sprints and task-submissions/tasks. Authorization services might reject some paths, but a direct SQL write, migration, or race can still persist contradictory project ancestry. The design adds no new domain tables and imports no legacy data.

| Existing child | Existing independently valid parents | Missing integrity constraint |
| --- | --- | --- |
| `project_sprints` | `project_id → project_instances.id`, `release_id → project_releases.id` | `(project_id, release_id) → project_releases(project_id,id)` |
| `project_tasks` | `project_id → project_instances.id`, `sprint_id → project_sprints.id` | `(project_id, sprint_id) → project_sprints(project_id,id)` |
| `project_task_submissions` | `project_id → project_instances.id`, `task_id → project_tasks.id` | `(project_id, task_id) → project_tasks(project_id,id)` |

## Staged implementation (not registered)

`docs/planning/sql/db07-project-lineage-fks-staging.sql` provides:

1. Three read-only mismatch queries with parent IDs for triage;
2. One fail-closed DO block aborting with SQLSTATE `23514` if **any** mismatched existing edges remain;
3. Three unique target indexes `(project_id,id)` with existing UUID primary keys preserved;
4. Three immediate, restrictive composite foreign keys, which block both mismatched inserts and updates;
5. Explicit migration replay / runtime-acceptance prerequisites.

All three child keys are non-null, so composite FK `MATCH SIMPLE` cannot be bypassed through a nullable component. No `ON UPDATE CASCADE`: moving a release/task to a new project should not silently transplant child history. No `NOT VALID` or blanket data rewrite. These constraints preserve materialized project snapshots and deliberately do **not** require template-college assignments to remain active.

This batch is separate from DB-068/070/071's template-version parent, immutable version and current/published pointer work. It also does not solve project-membership college scope, review-to-submission ancestry, or group/team scope; those require separate scoped decisions rather than false DB073 coverage.

## Acceptance matrix

### Source checks (independent of PostgreSQL)

`node --test tests/db073-project-lineage-source.test.mjs` must pass 12 structural assertions including exact unique target/index pairs, exact composite FKs, preflight rejection, restrictions and the fact that the SQL is outside `drizzle/`.

### PostgreSQL checks (opt-in, NOT EXECUTED merely by authorship)

After Chat 1 registers the typed schema and migration and a disposable `*_test` PostgreSQL has been reset, migrated and seeded:

```bash
export TEST_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/lms_vnext_test
export DB073_PROJECT_LINEAGE_ENFORCED=1
npx vitest run --config vitest.db.config.ts \
  tests/integration/db073-project-lineage-fks.test.ts
```

The integration suite must verify all three actual `pg_constraint` entries are validated, and demonstrate same-project positive inserts plus cross-project rejected inserts and updates (error code 23503) for each of the three edges. Each test rolls back its own transaction.

**Safety:** Explicit `TEST_DATABASE_URL`, mandatory disposable `_test` suffix and opt-in gate. No implicit `DATABASE_URL` fallback. Use the repo's shared target-safety policy for any production integration of this suite. The source-stage tests do not replace catalog/SQL/runtime evidence.

## Migration handoff / signoff

Chat 1 owns `drizzle/**`, `src/db/schema/index.ts`, migration generation and replay. Integrator must reconcile the three indexes and composite FKs with full current head, preserve DB068/070/071 and other DB07 table order, reject dirty data before ADD CONSTRAINT, run empty+latest PostgreSQL replay, then run DB073 and project materialization regression. Only then may the task be separately marked `DONE_VERIFIED`. Existing snapshots / migration journals must not be changed on this Chat 2 batch.
