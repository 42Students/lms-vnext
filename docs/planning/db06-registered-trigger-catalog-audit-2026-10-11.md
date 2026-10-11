# DB06 registered trigger-catalog audit — 2026-10-11

**Phase:** DATABASE (global; no API/UI phase change).
**Mode:** Non-invasive independent source audit of already registered DB06 migrations; no six-chat task claimed.
**Repository:** `42Students/lms-vnext@main`.
**Artifacts:** `scripts/db06-registered-trigger-check.mjs` and `tests/db06-registered-trigger-check.test.mjs`.
**Registered migration scope:** `0041_db06_assessment_parent_scope`, `0042_db06_assessment_scope_hardening`.
**Drizzle catalog:** `drizzle/meta/0042_snapshot.json`, `drizzle/meta/_journal.json`.

## Purpose

A migration can be registered but still contain invalid trigger-column references, missing functions, inconsistent trigger replacement or drift from the actual registered table declarations. Those issues could otherwise remain latent until disposable PostgreSQL replay. This guard provides deterministic, CI-independent **source-level** feedback.

The checker:

1. Reads the actual two registered migration SQL files, journal and latest snapshot.
2. Locates the trigger-returning PL/pgSQL function declarations, including `CREATE OR REPLACE` revisions in 0042.
3. Resolves CREATE / DROP trigger order across both registered migrations, detects duplicates without an intervening DROP, and requires eleven final DB06 guard triggers.
4. Validates each trigger's table and UPDATE OF columns against the actual 0042 snapshot.
5. Validates referenced `NEW.<column>` and `OLD.<column>` names against that table, masking SQL string literals/comments.
6. Handles the one intentional branch of shared `db06_guard_assessment_definition`: `max_points` is read only when `TG_TABLE_NAME = 'course_assignments'`, never for `course_quizzes`.
7. Fails nonzero when expected migration journal entries or function definitions are missing. Emits machine-readable status with `--json`.

## Read-only evidence

| Check | Result |
|---|---|
| Registered DB06 files | 2 present: 0041 and 0042 |
| Live triggers after 0042 | 11 tracked |
| Distinct trigger-returning function declarations | 10 |
| Expected replacements of definition/submission guards | 2 registered CREATEs each, with DROP before replacement |
| Invalid NEW/OLD column names detected in current files | 0 |
| Intentional shared-function max_points branch | 1 explained warning, not an error |
| Regression scenarios against GitHub file contents | 9/9 passed in an isolated JavaScript evaluator |

The nine regression tests include: actual registered-source PASS, missing journal entry, missing migration file, missing hardening replacement, unknown NEW/OLD field, unknown UPDATE OF field, duplicate trigger without DROP, undefined function, and strict refusal to call source evidence PostgreSQL verification.

**Execution honesty:** The validator function and nine test bodies were evaluated in-process against **fresh actual GitHub contents** after fetching the two migrations, the 0042 snapshot and journal. This is neither a project checkout `node --test` nor a `psql` replay. PostgreSQL migration syntax, function execution, tenant/concurrency negative tests, and live catalog introspection remain **NOT_EXECUTED**. Do not convert DB-030 or the global DATABASE gate to `DONE_VERIFIED`.

## Commands for any approved local checkout

```bash
node scripts/db06-registered-trigger-check.mjs --json
node --test tests/db06-registered-trigger-check.test.mjs
npm run db:verify:independent
```

The first two commands are pure Node source tests and do not require Docker, network or credentials. The final command requires a disposable PostgreSQL provider; it must not target production data. GitHub Actions is intentionally unused because of billing and is not needed for source progress.

## Explicit limitations and follow-up

- This is **not** a full PostgreSQL or PL/pgSQL parser. It cannot confirm lock ordering, SQL name resolution beyond tracked trigger fields, dynamic SQL, permissions, compiler errors or concurrent correctness.
- The scanner checks only DB06 registered migrations 0041/0042. Other domains require separate structural witnesses; DB-027's broader staging analyzer already exists and should not be duplicated blindly.
- The scanner requires one registered trigger for each of the eleven assessment integrity contracts and tracks the two 0042 replacements, but it does **not** prove that the trigger conditions enforce all business invariants.
- The original DB-030 handoff's PostgreSQL acceptance and DB-035 audit event history integration remain necessary. In particular, immutable grade history must be promoted atomically with the producer that records the true grader/publisher actor.
- Before DB release: rerun at exact merged head, execute the full DB06 PG negative/concurrency suite, reconcile actual `pg_catalog` trigger definitions after replay, then independently record exact runtime evidence.

**Coordination:** The two new files and this report were committed directly to `main` without touching the numbered migration journal, schema barrel, another worker's claimed scope or the global phase. Associate the new source guard with existing DB-030 acceptance; do not count it as a verified database task.
