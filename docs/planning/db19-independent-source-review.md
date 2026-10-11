# DB-019 independent cross-domain source-inventory review

**Phase:** DATABASE (ACTIVE) · **Queue task:** DB-019 (READY, prerequisites **not** satisfied) · **Target:** `42Students/lms-vnext/main`.

## Why this exists

This is a separately bounded, non-overlapping verification-infrastructure batch. It does **not** claim DB-019 completion, replace another chat's domain reconciliations, change migrations, or certify a live PostgreSQL schema. Machine output and exact input blob SHAs: [`db19-independent-source-inventory-evidence.json`](./db19-independent-source-inventory-evidence.json).

The audit reads all eleven `db-pass4-columns-db00..db10` files through the committed verifier `scripts/db19-field-disposition-audit.mjs`. A missing domain, wrong field count, duplicate physical table/field identity, missing field provenance, source-oracle mismatch, or unsupported DB-verified status fails closed. Current historical floors are **199 tables and 2,829 fields**; they must not silently decrease when work is reorganized.

## Actual source observations

| Source domain | Tables | Fields | Source-reviewed status rows | Proposed field target rows |
|---|---:|---:|---:|---:|
| DB00 historical / engine | 39 | 732 | 0 | 0 |
| DB01 identity / tenancy | 22 | 312 | 0 | 0 |
| DB02 academics / timetable | 13 | 125 | 0 | 0 |
| DB03 groups / electives | 6 | 79 | 79 | 79 |
| DB04 profiles / verification | 7 | 103 | 0 | 0 |
| DB05 courses / content | 7 | 92 | 0 | 39 |
| DB06 assessments / attendance | 21 | 248 | 0 | 0 |
| DB07 projects | 16 | 358 | 0 | 0 |
| DB08 placement outcomes | 18 | 280 | 280 | 0 |
| DB09 TPO / recruiting | 31 | 279 | 0 | 0 |
| DB10 shared operations | 19 | 221 | 221 | 0 |
| **Total** | **199** | **2,829** | **580** | **118** |

All **199** table names and **2,829** `table.column` keys are distinct across the eleven ledgers; no missing field source-provenance strings or table/ledger count mismatch was identified. All eleven ledgers pin legacy backend `21bad59d4dfaf2fa11fdeaf9353327ce105697d5`. Current legacy `lms/prod-2026` and `lms2-fe/prod-2026` were independently checked and match the frozen backend and frontend reference SHAs at the time of this review.

**Not yet closed:**
- **1,618** fields still have `UNVERIFIED_FIELD_SEMANTICS` in the master ledgers; separate specialist reviews may exist but are not registered as runtime-verified ledger mappings.
- **631** DB00 *raw master-ledger* rows still say `CLASSIFY_HISTORIC_RETIREMENT`, but the separate source-owned `db00-historical-engine-disposition.json` already classifies the matching **31 backup tables / 631 fields** as `RETIRE_GREENFIELD_BACKUP`. **One Flyway metadata table / 10 fields** is source-classified as platform migration metadata, leaving **7 Smrithi tables / 91 fields** awaiting an explicit product decision. Do not count the 631 as a newly undecided product decision; none of these source dispositions proves runtime database acceptance.
- **580** fields have `SOURCE_REVIEWED_*` statuses, but they are **source triage**, not a passed PostgreSQL parity test.
- **118** fields contain candidate target mappings or proposed semantic mapping strings; **zero** fields have a runtime-verified `verifiedMapping` in this evidence set.
- Current DB-019 prerequisites include unresolved DB00/01/02/04/05/09 owners, and database registration/replay is reserved for Chat 1. No source-only inventory check can satisfy those completion/phase gates.

## Executed, not merely authored

```bash
node --check scripts/db19-field-disposition-audit.mjs
node --test tests/db19-field-disposition-audit.test.mjs
# 20 tests; 20 passed; 0 failed; Node v22.16.0
node scripts/db19-field-disposition-audit.mjs
# For a complete repository checkout: JSON source inventory report, exit 0 if inventory structurally consistent, 2 on source-integrity regressions
```

The **20 Node tests executed successfully** in an independent local source copy. `git hash-object` of that local source and test file matched their committed GitHub blob SHAs. Two CLI integration cases exercised a complete *synthetic* 11-domain, 199-table, 2,829-field tree and verified that a 2,828-field regression returns failure code 2. Separately, the exact committed verifier code executed against **all 2,829 actual GitHub ledger rows** in an in-process JavaScript evaluator: `sourceInventoryIntegrity=PASS`, `errors=[]`. That actual-data run was **not** a Node filesystem checkout or PostgreSQL execution.

**PostgreSQL migration replay, negative tenant integrity, concurrency, and runtime producer/consumer parity remain NOT RUN.** An evidence-envelope shape is not proof that a stated command actually ran: every future acceptance record still requires independent review of the real command/output and commit. GitHub Actions intentionally remains unused due billing; it is not the verification gate.

## Handoff / criteria before DB-019 can close

1. Finish DB-003, DB-004, DB-005, DB-007, DB-008, DB-012 and other DB-019 explicit dependencies. Do not claim Chat 1's migration-only paths or overwrite active workers' ledgers.
2. Cross-reference the already source-classified **631 historical backup fields** without deleting their source ledger rows; resolve the distinct **91 Smrithi product-decision fields**, and move the other unverified active fields through evidence-backed semantic crosswalks.
3. Record `verifiedMapping` only against the actual registered schema, executed database acceptance and real consumers; document approved retirements without deleting historical inventory rows.
4. Re-run the full checker and Node tests after each domain-ledger change. Re-fetch both legacy source heads, exact current Drizzle journal, and maintain source-to-live drift checks before phase certification.
5. Keep the queue DB-019 READY until all dependencies and acceptance are actually satisfied. Its source inventory tooling may be `IMPLEMENTED` without the global task becoming `COMPLETED` or `DONE_VERIFIED`.

The global implementation tracker remains **52 / 64 COMPLETED**. The machine-source inventory pass here is a real engineering safety improvement but **does not increase completed-task percentage** because the task's actual semantic and database-verification requirements have not been met.

## DB00 disposition reconciliation addendum

A separate fail-closed reader `scripts/db19-db00-disposition-crosscheck.mjs` and `tests/db19-db00-disposition-crosscheck.test.mjs` compare exact source-ledger table/field inventories against the Chat 6-owned DB00 disposition without editing those records. **17/17 real Node v22 tests passed** against byte-identical GitHub blobs; the actual two GitHub DB00 inputs produced `valid=true`, 39 tables/732 fields, 32 source-dispositioned tables/641 fields and 7 product-decision-pending tables/91 fields. Source-oracle drift, missing/duplicate table dispositions and unapproved Smrithi retirement fail closed. See [DB00 reconciliation evidence](./db19-db00-disposition-crosscheck.md). All evidence remains SOURCE_ONLY; DB003 is still BLOCKED pending product decision and consumer/runtime proof.
