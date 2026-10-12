# DB-027 — cross-domain staged SQL preflight and DB04 consolidation

**Date:** 2026-10-11 IST · **Owner:** Chat 3 · **Phase:** DATABASE · **Task:** DB-027  
**Repository:** `42Students/lms-vnext@main`. All commits below go directly to main; no PR or migration-journal edits.

## Why this batch exists

DB-012/DB09 was already closed for source/design review at **279/279 historical fields** before this turn, and its queue status is BLOCKED on Chat 1 migration registration, independent PostgreSQL execution and producer/consumer cutover. Rather than redo that completed audit or modify another worker's files, Chat 3 claimed a narrow global integration-safety task. The shared queue originally had no eligible unclaimed DATABASE task at this point. DB-027 owns its read-only analyzer, tests, report, and two narrowly reserved DB04 duplicate-draft files.

## New executable tooling

- `scripts/db27-stage-sql-preflight.mjs` — pure source analyzer + checkout CLI:
  `node scripts/db27-stage-sql-preflight.mjs --json` (exit **2** if it finds candidate integration hazards).
- `tests/db27-stage-sql-preflight.test.mjs` — 14 Node `node:test` definitions:
  `node --test tests/db27-stage-sql-preflight.test.mjs`.
- The CLI inventories `docs/planning/sql/**/*.sql`, `scripts/sql/**/*.sql` (excluding read-only/witness/acceptance artifacts) plus `docs/planning/db04-proposed-migration.sql`; consults only the **actually registered** `drizzle/meta/_journal.json` SQL, with vNext Drizzle `pgTable` declarations as explanatory context.
- It masks SQL comments, regular string literals and PostgreSQL dollar-quoted bodies before identifying `CREATE TABLE`, `ALTER TABLE`, FK `REFERENCES` and destructive `DROP TABLE`/`TRUNCATE TABLE`/`DELETE FROM` tokens.
- Reports multiple CREATE targets (including repeated statements **within one file**), attempts to recreate already registered tables, executable code in SUPERSEDED/REFERENCE_ONLY files, unresolved parent tables, dependencies between staged files, cycles and destructive draft SQL. It suggests a **source dependency order**, NOT a runnable or approved migration order.
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

**Implemented safeguard:** both older files now start with `-- SUPERSEDED DB04 CANDIDATE`, contain no executable SQL, and preserve their full previous text as disabled comment lines. Canonical DB04 is unchanged. Dedicated Node regression tests guard against reintroducing these conflicting draft CREATE/ALTER operations.

No user data is migrated: vNext is greenfield. The canonical DB04 design still requires explicit decisions on per-entry optimistic revision and legacy image-gallery external image ID compatibility. Supersession is a **source integration deduplication**, not a claim that those user-facing behaviors were verified or intentionally retired.

## Migration-integrator handoff / next gates

1. **Chat 1:** Run `node --test tests/db27-stage-sql-preflight.test.mjs` then `node scripts/db27-stage-sql-preflight.mjs --json` from fresh `main` and triage every actual duplicate, registered overlap, order cycle and unresolved parent **against the complete registered journal**, not a partial source subset.
2. Confirm DB04 canonical SQL is the one source for education/media/receipt creation. Exclude both SUPERSEDED DB04 files; preserve the tests.
3. Order DB01/02 parents before dependent DB04/05/06/08/09 constraints. In DB09, shared parent composite constraints belong to `db09-parent-composite-keys-candidate.sql`; do not duplicate them in child drafts.
4. Reconcile all stage-only SQL with Drizzle table models, PostgreSQL migration journal/snapshots and accepted domain semantics; avoid automatically concatenating every `*.sql` draft.
5. Execute an **independent disposable PostgreSQL** migration replay and negative tenant, race, receipt-purpose, disclosure and rollback witnesses. Record the exact SHA, command, PostgreSQL version, exit code and redacted output.

DB-027 can be **implementation-completed** based on committed preflight tooling and tombstones, but is **not database-verified**. Global DATABASE stays active.

## Follow-up: intra-file CREATE duplicate regression

The first version de-duplicated table names *inside each file* before checking duplicates across files. Chat 3 closed that false-negative: `inspect()` now preserves `createDuplicates` and the analyzer emits `repeatedWithinFile` as a promotion hazard. Added regression test #14. Executed the **committed** pure analyzer code again in an isolated V8 evaluator at blob `4d67e0d3ffd67879eed8267681e7eafb6b8a4497`; the duplicate case was detected and parent-before-child ordering remained correct. This check is not Node `node:test` or a database acceptance run.


## Independent DB-027 follow-up: partition and ancestry source preflight (2026-10-11)

**Scope:** Unclaimed source-integrity hardening of previously implementation-completed DB-027; no change of Chat 3's original ownership/credit. No Drizzle migration, schema barrel, CI or database modified.

- [`f8a6207`](https://github.com/42Students/lms-vnext/commit/f8a6207acfdadd0911a6d3261ad0fc42754e8427) makes the source preflight track `ALTER TABLE ONLY`, `CREATE TABLE ... PARTITION OF`, `ALTER TABLE ... ATTACH PARTITION`, `CREATE TABLE ... INHERITS`, `ALTER TABLE ... INHERIT`, and `CREATE TABLE ... LIKE` dependencies. It flags `DETACH PARTITION`, `NO INHERIT`, `SET UNLOGGED` and `DISABLE RULE` as potentially destructive draft operations.
- [`4cedae6`](https://github.com/42Students/lms-vnext/commit/4cedae60112a71cbb66397a030f36e7b049815ff) prevents a false dependency when a SQL `CHECK` expression contains `column LIKE other_column`. Unsupported complex quoted DDL names and malformed ancestry clauses are lexical-review hazards, not silently accepted.
- [`8ee135a`](https://github.com/42Students/lms-vnext/commit/8ee135acce31869bc7d42475ce12ec4611b27a5c) adds six executable `node:test` regression definitions covering dependency order, malformed ancestry, false positives and security-sensitive DDL.

**Actually executed:** An in-process JavaScript V8 evaluator ran 15/15 synthetic targeted cases before the source write, 3/3 targeted false-positive checks before the follow-up write, and 24/24 source-only callbacks from the exact committed DB-027 test/scanner blobs after the test commit. Three filesystem-dependent tests were intentionally skipped in that evaluator. **These are not Node `node --test` runs.** An independent hosted shell has Node v22.16.0 but cannot resolve `github.com` to clone the repository; no PostgreSQL instance or migration replay was exercised. GitHub Actions was intentionally unused because of billing, not an engineering blocker.

**Remaining review risk:** This source scanner is not a complete PostgreSQL grammar or migration executor. Particularly, qualified/quoted complex table names, actual partition attachment feasibility, inherited constraint semantics, and transaction ordering still require migration-integrator review and independently executed PostgreSQL acceptance. Source-only DB-027 remains `COMPLETED`, not `DONE_VERIFIED`. Global DATABASE is still ACTIVE.


## Independent migration-source safety sweep — 2026-10-12 (read-only, DB-027 follow-up)

**Direct-main commits:** [`b59aebd`](https://github.com/42Students/lms-vnext/commit/b59aebd5ee3038a9e1b68211abb2d0535745fd53) hardens the existing staged-SQL preflight; [`facc4b2`](https://github.com/42Students/lms-vnext/commit/facc4b237947d5ef4e699bd506e585a64a3f1b54) adds seven adversarial source test cases. Both are on `main`. This does **not** reopen DB-027 or mark original core DB tasks verified.

### Concrete fail-open defects repaired

1. `CREATE TEMP/TEMPORARY/GLOBAL TEMPORARY/LOCAL TEMP TABLE`, `CREATE FOREIGN TABLE` and top-level `SELECT ... INTO [TEMP] TABLE` were previously silently absent from the creation inventory. They now generate explicit `UNSUPPORTED_*_DDL` lexical hazards and cannot appear to be a clean migration candidate.
2. `CREATE TABLE public."odd table"` previously invented a table named `public`; `CREATE TABLE U&"unicode escaped"` invented a table named `U`. Proper boundary detection avoids those phantom creators and flags unsupported quoted DDL for manual review. Valid `public."parent"`, `ALTER TABLE public."child"` and ordinary `REFERENCES public."parent"` remain visible.
3. Masked SQL strings, comments and dollar-quoted routine bodies must not trigger those hazards. The added tests cover these false-positive boundaries.

**Execution honesty:** 31 of 34 committed source-test callbacks passed in an isolated V8 evaluator using exact fetched GitHub source blobs (`afb3b0cdf8e653409d1c0d5cab32924588a045db` for the scanner; `70f7a85718073d8c19474d20c49778dc46afd747` for tests). Three fixture/filesystem callbacks could not run in that evaluator. This is **NOT** native `node --test`, full checkout CLI, TypeScript, or PostgreSQL acceptance.

### Partial-batch review of the actual candidate corpus

The independent evaluator fetched and inspected **113 current-at-read SQL candidates** in `docs/planning/sql`, `scripts/sql` and the extra DB04 canonical SQL, partitioned into separate batches (GitHub `main` continued receiving peer commits during the sweep). Totals are **100 active staged** and **13 ignored/superseded/reference-only** under the classifier. No unclosed SQL literal/comment/dollar quote hazards or duplicate `CREATE TABLE` within *each evaluated batch* were observed. The following review-required cases were surfaced:

| Source finding | Affected staged files |
| --- | --- |
| Destructive DDL tokens requiring intentional migration review | `docs/planning/sql/db06-assignment-private-files-candidate.sql` (`DROP CONSTRAINT IF EXISTS`), `docs/planning/sql/db07-w03-task-backlog-and-delivery-state-candidate.sql`, `docs/planning/sql/db08-recruiter-round-result-code-candidate.sql`, `scripts/sql/db02-academic-progression-and-rooms-staging.sql`, `scripts/sql/db05-version-progress-attempts.draft.sql`, `scripts/sql/db08-offer-lifecycle-staging.sql` |
| Ignored/reference candidates with executable DDL/ALTER (manual exclusion, not auto-install) | `docs/planning/sql/db07-w03-admin-workspace-state-candidate.sql`; `docs/planning/sql/db07-w03-workspace-state-parity-candidate.sql` |

**Limitations:** Batches were analyzed separately, so **cross-batch duplicate creators, FK dependencies and ordering cycles are not cleared by this sweep**. The per-batch unresolved parent counts are not actual missing-table findings because the registered journal and the full staged set were not supplied to the same run. Changed concurrent source blobs require revalidation. PostgreSQL SQL validity, transactional semantics, deadlock freedom, migration replay and data safety remain entirely unverified.

**Chat 1 action:** From a clean, freshly fetched checkout execute:
```bash
node --test tests/db27-stage-sql-preflight.test.mjs
node scripts/db27-stage-sql-preflight.mjs --json
npm run db:journal:verify
```
Reconcile the **complete** source inventory against registered migrations, exclude superseded drafts, examine the destructive operations in dependency order, and only after an approved isolated PostgreSQL target is prepared execute `npm run db:verify:independent`. Do not equate a scanner pass with database acceptance. The global DATABASE phase remains ACTIVE; original eleven task status is unchanged.
