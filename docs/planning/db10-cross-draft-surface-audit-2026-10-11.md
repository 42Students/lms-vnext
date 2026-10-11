# DB10 SQL ⇄ Drizzle staged draft integrity audit

**Date:** 2026-10-11 IST  
**Phase:** DATABASE (ACTIVE)  
**Mode:** Independent source verification batch, not a task claim or phase certification  
**Harness:** `tests/db10-cross-draft-surface-parity.test.mjs`  
**Status:** committed source guard / full repository Node run NOT EXECUTED / disposable PostgreSQL NOT EXECUTED.

## Why this exists

Several DB10 data families have a typed Drizzle draft and a separate SQL stage pending Chat 1's registered migration journal. Previously individual tests checked selected names; a drift in the complete table/column inventory, varchar width, bigint-versus-integer type, timestamp timezone, SQL nullability, FK target/on-delete policy, uniqueness or index column order could silently bypass the named assertions.

The new single-file Node `node:test` suite compares three explicitly source-reviewed pairs:

| Draft | SQL staging file | Tables | Columns | Named CHECKs | Indexes | Foreign keys |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| `db10-general-notices.draft.ts` | `db10-general-notices-staging.sql` | 1 | 26 | 13 | 6 | 5 |
| `db10-log-alerts.draft.ts` | `db10-log-alerts-staging.sql` | 3 | 24 | 7 | 5 | 1 |
| `db10-skills-catalog.draft.ts` | `db10-skills-catalog-staging.sql` | 3 | 16 | 7 | 5 | 1 |
| **Total** | | **7** | **66** | **27** | **16** | **7** |

The inspection re-fetched all six source files from live GitHub `main` and compared names/primitive types/nullability, named checks, index uniqueness, FK target and ON DELETE semantics, and index table/field order. **No differences were detected in these bounded, lexer-like comparisons.** This does not imply PostgreSQL accepts or enforces every staged statement.

## Implemented direct-to-main commits

- [f6206d06](https://github.com/42Students/lms-vnext/commit/f6206d06ae19be618dfcad96b248e260be4d2624) — initial named table, check and unique-vs-nonunique index drift checks; positive/negative adversarial fixtures.
- [98f930a8](https://github.com/42Students/lms-vnext/commit/98f930a859a26d5e04b0441d964e0625359679c1) — physical column set, primitive type, varchar length, integer/bigint and timestamptz shape checks.
- [5a83e46b](https://github.com/42Students/lms-vnext/commit/5a83e46b254e503fe443f2a139ddc7dd35a6e49a) — NOT NULL and primary-key-requiredness parity.
- [fc515b16](https://github.com/42Students/lms-vnext/commit/fc515b16f9f410f3b420b6ccd6ac8d9dcb6bff66) — FK column, target table/column and ON DELETE parity.
- [d20f0f5c](https://github.com/42Students/lms-vnext/commit/d20f0f5cd2c73e2355bab3a0f30b19f17e2eee21) — index owning table, ordered indexed fields and supported functional lower(column) expressions.

## Verification performed versus verification pending

**Performed:**
- Four local isolated Node 22 fixture tests (name/check/index mismatch and duplicates): `node --test --test-name-pattern='fixture:' /mnt/data/db10-staged-constraint-drift.test.mjs`; **4/4 passed**. This is a separately reconstructed fixture harness, **not** the new repository test.
- GitHub-linked JS source analysis of the six current staging/draft file blobs: 7 tables, 66 field name/type/nullability comparisons, 27 named checks, 16 named indexes (including uniqueness/table/order), and 7 FKs found no drift.
- Re-fetched the newly committed repository test from main and checked that all five guard functions and fixtures are present.

**NOT performed:**
- Executing `node --test tests/db10-cross-draft-surface-parity.test.mjs` in a complete repository checkout.
- `npm run lint`, `npm run typecheck`, `npm run build`, full repository unit/integration suite.
- Running staged SQL or replaying a numbered Drizzle journal on disposable PostgreSQL.
- Race, tenant scope, provider, API, browser or production verification.

Run the full committed test in an independent checkout before relying on it as executable acceptance. GitHub Actions is intentionally unused because of billing, not a reason to stop source-level development.

## Explicit scope limitations

This is a conservative source-pair drift check, **not a SQL parser**. It does not prove that SQL CHECK *expressions* equal Drizzle tagged SQL expressions, compare every default, enforce composite uniqueness beyond the enumerated index fields, verify cross-tenant FK conditions, test trigger side effects, or validate runtime producer access. SQL statements outside the three explicit pairs are excluded. If a new SQL/TypeScript syntax is introduced, update the extractor and demonstrate a negative fixture instead of treating silently omitted objects as verified.

**Integrator handoff (Chat 1):** Retain these three draft/SQL pair checks during journal integration; then run the actual Node test, Drizzle generation diff, fresh PostgreSQL replay, constraints/catalog diff, negative tenant/race witnesses and product scenario checks. No queue status has been changed to `DONE_VERIFIED` and the global DATABASE gate remains open.
