# DB-027 — cross-domain staged SQL preflight and DB04 consolidation

**Date:** 2026-10-11 IST · **Owner:** Chat 3 · **Phase:** DATABASE · **Task:** DB-027  
**Repository:** `42Students/lms-vnext@main`. All commits below go directly to main; no PR or migration-journal edits.

## Why this batch exists

DB-012/DB09 was already closed for source/design review at **279/279 historical fields** before this turn, and its queue status is BLOCKED on Chat 1 migration registration, independent PostgreSQL execution and producer/consumer cutover. Rather than redo that completed audit or modify another worker's files, Chat 3 claimed a narrow global integration-safety task. The shared queue originally had no eligible unclaimed DATABASE task at this point. DB-027 owns its read-only analyzer, tests, report, and two narrowly reserved DB04 duplicate-draft files.

## New executable tooling

- `scripts/db27-stage-sql-preflight.mjs` — pure source analyzer + checkout CLI:
  `node scripts/db27-stage-sql-preflight.mjs --json` (exit **2** if it finds candidate integration hazards).
- `tests/db27-stage-sql-preflight.test.mjs` — 13 Node `node:test` definitions:
  `node --test tests/db27-stage-sql-preflight.test.mjs`.
- The CLI inventories `docs/planning/sql/**/*.sql`, `scripts/sql/**/*.sql` (excluding read-only/witness/acceptance artifacts) plus `docs/planning/db04-proposed-migration.sql`; consults only the **actually registered** `drizzle/meta/_journal.json` SQL, with vNext Drizzle `pgTable` declarations as explanatory context.
- It masks SQL comments, regular string literals and PostgreSQL dollar-quoted bodies before identifying `CREATE TABLE`, `ALTER TABLE`, FK `REFERENCES` and destructive `DROP TABLE`/`TRUNCATE TABLE`/`DELETE FROM` tokens.
- Reports multiple CREATE targets, attempts to recreate already registered tables, executable code in SUPERSEDED/REFERENCE_ONLY files, unresolved parent tables, dependencies between staged files, cycles and destructive draft SQL. It suggests a **source dependency order**, NOT a runnable or approved migration order.
- **Never sets `safeForAutomaticPromotion=true`**, even when structural warnings are empty. PostgreSQL constraints, original DDL validity, extension availability and concurrency still require actual migration replay.

The source lexer is intentionally a bounded static-analysis tool, **not a complete SQL parser**. It treats PL/pgSQL function bodies as opaque. SQL inside triggers/procedures, statement splitting, PostgreSQL privilege/RLS and dynamic SQL need PostgreSQL tests and domain guards. A `NO_KNOWN_SQL_CREATOR` warning from a partial scan must never be reported as a definitive missing table without reading all registered migrations.

## Actual execution evidence (not CI or database)

| Evidence | Outcome |
| --- | --- |
| Imported the committed analyzer's pure helpers in an isolated V8 evaluator at source blob SHA `8083fe1e92e133c4d524cb7e6584d29e95397dde`; ran 12 synthetic cases | **12/12 passed** in the V8 source evaluator, no filesystem/Node test runner |
| Read fresh GitHub DB04 canonical SQL + both tombstones, executed real source integrity comparisons | **PASS**: 9 canonical tables found; expected private receipt and education/image FK/constraint names present; both tombstones have zero executable CREATE/ALTER |
| Read real 11-file DB09 subsection, running the analyzer against this **partial subset only** | 11 files, 9 staged + 2 SUPERSEDED; 15 CREATE table names; 0 duplicate creators/0 cycles in subset |
| DB09 subset references with no parent CREATE included *in that subset* | 43 apparent parents; not classified as real missing because registered migrations and other domains were omitted from this partial scan |
| Full checkout `node --test` / `npm run db:verify:independent` / disposable PostgreSQL | **NOT EXECUTED** in this ChatGPT runtime. Node available but repo cannot be cloned due disabled direct network; GitHub connector supplied the read-only source content |

**Do not** convert any of these source checks into `DONE_VERIFIED` for DB migration/replay. GitHub Actions is intentionally unused due billing, but is **not** an engineering blocker. The proper independently executed database command is `npm run db:verify:independent` from an approved environment with Docker or disposable PostgreSQL.

## Concrete integration defect prevented: duplicate DB04 drafts

The current canonical `docs/planning/db04-proposed-migration.sql` already defines:
- `profile_private_document_receipts`, including `profile_private_doc_id_owner_uq`, `profile_private_doc_key_ck`, `profile_private_doc_generation_ck`, `profile_private_doc_sha256_ck` and `profile_private_doc_mimetype_ck`;
- `learner_profile_education_entries`, `learner_profile_education_documents` and `learner_profile_images`, including **same-owner AND PURPOSE-scoped receipt FKs**.

Two older SQL files contained separately executable **weaker duplicate concepts**:
- `docs/planning/sql/db04-education-media-candidate.sql` added another (id, owning_membership_id) UNIQUE on receipts, introduced competing `profile_education_entries` and `profile_image_entries`, and provided only two-column receipt FKs without explicitly enforcing receipt PURPOSE.
- `docs/planning/sql/db04-private-receipt-hardening-candidate.sql` added another set of key/hash/generation/MIME checks already present in canonical DB04 (some with different names).

**Implemented safeguard:** both older files now start with `-- SUPERSEDED DB04 CANDIDATE`, contain no executable SQL, and preserve their full previous text as disabled comment lines. Canonical DB04 is unchanged. A dedicated 13th Node regression test guards against reintroducing these conflicting draft CREATE/ALTER operations.

No user data is migrated: vNext is greenfield. The canonical DB04 design still requires explicit decisions on per-entry optimistic revision and legacy image-gallery external image ID compatibility. Supersession is a **source integration deduplication**, not a claim that those user-facing behaviors were verified or intentionally retired.

## Migration-integrator handoff / next gates

1. **Chat 1:** Run `node --test tests/db27-stage-sql-preflight.test.mjs` then `node scripts/db27-stage-sql-preflight.mjs --json` from fresh `main` and triage every actual duplicate, registered overlap, order cycle and unresolved parent **against the complete registered journal**, not a partial source subset.
2. Confirm DB04 canonical SQL is the one source for education/media/receipt creation. Exclude both SUPERSEDED DB04 files; preserve the tests.
3. Order DB01/02 parents before dependent DB04/05/06/08/09 constraints. In DB09, shared parent composite constraints belong to `db09-parent-composite-keys-candidate.sql`; do not duplicate them in child drafts.
4. Reconcile all stage-only SQL with Drizzle table models, PostgreSQL migration journal/snapshots and accepted domain semantics; avoid automatically concatenating every `*.sql` draft.
5. Execute an **independent disposable PostgreSQL** migration replay and negative tenant, race, receipt-purpose, disclosure and rollback witnesses. Record the exact SHA, command, PostgreSQL version, exit code and redacted output.

DB-027 can be **implementation-completed** based on committed preflight tooling and tombstones, but is **not database-verified**. Global DATABASE stays active.
