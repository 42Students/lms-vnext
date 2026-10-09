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

### Main-lineage continuation (2026-10-10)

- Added `src/modules/placements/tpo-share-projection.ts` and `tests/unit/tpo-share-projection.test.ts` directly to `main` after PR #16 merge. This is a pure, deliberately not-yet-routed projection for legacy recruiter-visible candidate columns.
- Source oracle: legacy `TpoShareService.rowsFor`: allowlisted columns, phone after SHORTLISTED, verified academic percentages only, 5-point UG bands, stage cap, 90-day closed-drive retention for non-hired learners, 12th-or-Diploma fallback.
- Two privacy improvements are intentional and must remain documented: **unknown applicant stages fail closed** and **screening score respects showAssessmentScores**, whereas the inspected legacy rendering path reads this setting but does not enforce it when emitting `skillMatch`.
- The helper accepts prepared data, not raw DB records. It **does not authorize share links, verify recruiter identity, enforce cross-college scope, sign/download resumes or run any request**. These responsibilities must be implemented before it is used in runtime.
- Tests authored but **not executed in this chat**. Static repository inventory checks only verified ledger structure, not runtime functionality.
- Status is `PURE_PROJECTION_AUTHORED`, not `DB_TESTED` or `WORKFLOW_VERIFIED`; **0/279** source field mappings verified remains accurate.

## Mainline source synchronization (2026-10-10)

All 16 remaining DB09 files from the original draft PR #11 are integrated into the main-lineage source tree: 2 schema modules, 2 services, 9 API routes, 1 API-error adapter and 2 integration suites. Main's schema registry exports those 5 table models, and package.json exposes the DB09 audit/opt-in database commands.

**Critical rollout safeguard:** all 9 routes, across GET/POST/PATCH/PUT handlers, default to HTTP 503 `DB09_MIGRATIONS_PENDING` unless the server process has `DB09_TPO_API_READY=DB09_VERIFIED`. Do not set this value until the tables are registered in the Drizzle journal, deployed and verified with live Postgres integration tests. The staged SQL drafts are **not registered migrations**, so the API remains unavailable.

The unit/static tests are part of the codebase; database integration tests are deliberately gated on `TEST_DATABASE_URL` + `DB09_ISOLATED_TEST_DATABASE=1`. No runtime tests or database replay have been executed during this chat. The 279-field legacy ledger remains 0/279 verified. GitHub Actions has a known runner-start failure; a green check cannot be inferred from missing job steps.

Do not merge original PR #11 after this synchronization; all its DB09-owned source content has been brought to main without bringing unrelated DB03/04/08 commits.
