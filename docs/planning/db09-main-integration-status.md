# DB09 selective main integration — 2026-10-10

## Decision

Original DB09 draft: [PR #11](https://github.com/42Students/lms-vnext/pull/11), based on `db-parity-2026`, which also contains unmerged DB03 Groups/Electives and additional database-first audit commits. It must **not** be retargeted or merged into `main` wholesale: that would bring unrelated, unverified work from other chats.

This isolated main-lineage integration includes only **source audit, field-by-field tracker, unregistered SQL proposals, strict Zod input validators and dependency-free unit/static tests**. No new Drizzle tables are imported, no production API routes exist, no migration journal changes and no feature is claimed operational.

### Included

- `docs/planning/database-parity-db09-parallel-audit.md`
- `docs/planning/database-parity-db09-parallel-tracker.json`
- `docs/planning/db-pass4-columns-db09_tpo_and_recruiter_operations.json`
- `docs/planning/sql/db09-policy-visibility-premerge.sql`
- `docs/planning/sql/db09-tpo-crm-premerge.sql`
- `src/modules/placements/tpo-policy-validation.ts`
- `src/modules/placements/tpo-crm-validation.ts`
- `tests/unit/tpo-policy-validation.test.ts`
- `tests/unit/tpo-crm-validation.test.ts`
- `tests/db-parity-db09-tracker.test.mjs`

Static ledger comparison via GitHub-sourced JSON confirmed 31 candidates and every one of 279 source fields is represented. This is **not** an executed `npm test`, a database test, or semantic parity.

### Deliberately not merged

- `src/db/schema/tpo-policy.ts` and `src/db/schema/tpo-crm.ts`
- Database-backed policy / CRM services, route handlers and their integration tests
- All Drizzle migrations, snapshots and `drizzle/meta/_journal.json` modifications

These currently require a unique migration number after active DB03/DB04/DB08 branches reconcile, database replay, TS/build checks, and negative authorization/browser verification. Merely defining a table without registering its migration makes production routes fail.

### Working on main after this merge

1. Continue read-only DB09 source/consumer parity and independent validators/tests on latest `main`, checking its current SHA before every write.
2. Coordinate the migration queue with DB03/DB04/DB08; never reuse their numbered migrations or merge another branch wholesale.
3. Reintroduce app schema/services/routes only in a coherent, tested database migration batch.
4. Keep `database-parity-db09-parallel-tracker.json` statuses unverified until real PostgreSQL/runtime evidence exists.

**Do not claim DB09 is complete.** 52/279 source field candidates have schema drafts in PR #11, but **0/279 fields are runtime-/workflow-verified**; 31 candidate table source census is not a live database count.
