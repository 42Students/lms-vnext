# DB00 retirement crosswalk — independent source-only evidence

**Phase:** DATABASE · **Owner of DB-003:** Chat 6 (unchanged) · **Verification contribution:** read-only DB-019 tooling follow-up (not claiming DB-003 task completion).

## Important denominator correction

A prior DB-019 report read only `docs/planning/db-pass4-columns-db00_historical_and_engine.json` and described **631 `CLASSIFY_HISTORIC_RETIREMENT` rows as still awaiting decisions**. That raw status exists but was incomplete context. The separately committed, domain-owned `docs/planning/db00-historical-engine-disposition.json` has already classified:

| DB00 disposition | Tables | Fields | Interpretation |
|---|---:|---:|---|
| `RETIRE_GREENFIELD_BACKUP` | **31** | **631** | Source-retired legacy backup/recovery artifacts; no legacy data migration into greenfield vNext |
| `REPLACED_BY_PLATFORM_MIGRATION_METADATA` | **1** | **10** | Legacy Flyway metadata replaced by Drizzle migration metadata |
| `PENDING_PRODUCT_DECISION` | **7** | **91** | Smrithi application/college/keyword/education/template/program/specialization aggregates |
| **Total** | **39** | **732** | 32/39 tables, 641/732 fields have a source-level disposition |

The reconciliation distinguishes **source-level disposition** from **runtime-semantic mapping**. The seven Smrithi entities remain unknown as user-visible product features or external consumers. Do not retire or mark those 91 fields verified without product decision and source producer/consumer evidence.

## Committed independent executable guard

- `scripts/db19-db00-disposition-crosscheck.mjs`
  - Cross-matches all 39 table names, source classes, and 732 row counts between the separate ledgers.
  - Requires matching frozen backend commit SHA.
  - Rejects unexplained/dropped/duplicate tables, wrong counts, unsupported dispositions, false Smrithi retirement, and a changed disposition sum.
  - Emits only `SOURCE_DISPOSITION_ONLY_NOT_POSTGRES_ACCEPTANCE`, `databaseVerified=false` and `smrithiProductDecisionClosed=false`.
  - Run `node scripts/db19-db00-disposition-crosscheck.mjs` from a full repository checkout. Exit 2 on mismatch.
- `tests/db19-db00-disposition-crosscheck.test.mjs`
  - 17 independently executed real Node regression tests, including real CLI subprocess positive and negative fixtures.

## Actual execution evidence

Node v22.16.0, isolated clean local test copy. Both source/test `git hash-object` SHAs match the current main GitHub blobs:

```
scripts/db19-db00-disposition-crosscheck.mjs
f3917429378e8db20d508b5b7f6b0816d26787a4

tests/db19-db00-disposition-crosscheck.test.mjs
a5ec5c5bfbb8ae858600d699494fc140224575df

node --check scripts/db19-db00-disposition-crosscheck.mjs
node --check tests/db19-db00-disposition-crosscheck.test.mjs
# exit 0, both

node --test tests/db19-db00-disposition-crosscheck.test.mjs
# tests 17
# pass 17
# fail 0
# skipped 0
# exit 0
```

The pure function from the **exact committed blob** was also executed in the connected GitHub JavaScript evaluator using the current two real repository JSON blobs:
- Master DB00 source ledger blob: `e6cbb7107b314fa37395660571a15fe507c2aaae`.
- Chat 6 disposition ledger blob: `5809c72b7106e09364efca143f0cc9ee1de91001`.
- **Actual result:** `valid=true`, `errors=[]`, 31 backup tables/631 fields, one migration metadata table/10 fields, seven Smrithi tables/91 fields pending product decision.

That actual input evaluation was **not** a full Node filesystem checkout nor a PostgreSQL migration replay.

## Owner handoff

Keep DB-003 `BLOCKED` pending a real **Smrithi product decision**, source consumer closure, and any required database runtime tests. Preserve 31 historical backup dispositions as already source-classified; do not rereview 631 fields as if all were new requirements. Refresh live backend and vNext schema/replay evidence before eventual global DB-019/020 certification.

No other worker's existing files, claims, completed credit, migration journal, schema barrel, CI, API or UI were changed. GitHub Actions billing remains intentionally unrelated to PostgreSQL acceptance.
