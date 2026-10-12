# Independent DB-004 / DB-005 acceptance review — 2026-10-12

**Source evaluated:** `42Students/lms-vnext@1a625e03a27f38ef7b85deacecf5efefb6770628` (main).  
**Global phase:** DATABASE ACTIVE; API, UI, RELEASE LOCKED.  
**Decision:** both retain `COMPLETED` (source/implementation handoff). **Neither is `DONE_VERIFIED`.** This report records independently observed positive execution evidence and the concrete failures; it does not change the shared queue.

## Evidence hierarchy and independently verified CI execution

The latest commit's GitHub Actions [run 38274277458](https://github.com/42Students/lms-vnext/actions/runs/38274277458), [database job 114896160249](https://github.com/42Students/lms-vnext/actions/runs/38274277458/job/114896160249), actually allocated PostgreSQL **17.11** and successfully executed:
- clean disposable PostgreSQL 17 journal reset/replay and seed;
- migration rerun/idempotence;
- registered schema read-only catalog witness;
- DB017 relationship-scoped disclosure default negatives.

This is proof of the **registered baseline only**, not the unregistered DB01/DB02 staging proposals. In the same run, the wider PostgreSQL integration job **FAILED** (23 failed / 358 passed / 106 skipped individual tests, 17 failed / 62 passed / 14 skipped test files). Schema-drift and DB00 safety jobs passed; source parity, lint, typecheck, production build, unit and browser DB preparation failed. Never promote a task based on a green replay step inside a failing wider job.

### DB-004 — DB01 identity and tenancy

**Actually executed and passing at exact SHA in PostgreSQL CI (46 tests total):**

| Test file under `tests/integration/` | Executed passing |
| --- | ---: |
| `db01-membership-role-parent-lock.test.ts` | 10 |
| `db01-concurrent-integrity.test.ts` | 6 |
| `db01-core-structure-invariants.test.ts` | 12 |
| `db01-tenant-routing-lifecycle.test.ts` | 4 |
| `db01-tenant-identity-invariants.test.ts` | 5 |
| `db01-identity-fk-invariants.test.ts` | 9 |
| **Total** | **46** |

**Independent source-level check:** 11/11 current GitHub source-function V8 assertions passed, evaluating exact-source `inspectDb004` from blob `9c1651c903cb7f8608c9da257e4c81f6e488f997` and `auditDb01FinalDisposition` from blob `fa1155022c2ee7ae493029415a089d8f5513332e`, against current 312-field source `efedb62f8738798e757186c7143836345405d33a`, proposal `38df0e1e4b3826da4bb4800d0b6528ac988ea5fd` and authoritative final disposition `2376d0530a0180769aeee970ad101c5524df88db`. Verified 312 unique decisions, 137 original no-target gaps accounted for as 123 source-only proposed targets and 14 candidate non-persistence decisions, 70 distinct formerly unaccounted active source-usage rows, provider external-identity authority, and negative mutations rejecting missing/duplicated fields, persisted raw credentials, lost token revocation, and fabricated execution flags. **This was V8, not a native Node invocation or PG execution.**

**Unmet acceptance:** The DB01 [staging manifest](../../planning/db01-chat02-migration-integration-manifest.json) explicitly contains unregistered tenant/auth/role/OTP/handoff/device sidecars. Their provider, exact membership/domain scope, revocation, atomic handoff/expiry, cross-host and security race contracts have **not** been demonstrated in PostgreSQL/Identity Platform against fully registered final schema. Fourteen source-level non-persistence decisions are **not approved retirements**. The [provider policy](../../planning/db01-chat05-provider-persistence-decision.json) explicitly states `activeMigrationRegistered=false`, `disposablePostgresVerified=false`, `providerEndToEndVerified=false`, `doneVerified=false`. Source field mappings still have **0 accepted runtime mappings**. Source completeness is not full feature acceptance.

**Next accepted proof:** Chat 1 registers only approved DB01 migrations/barrel changes, confirms no duplicative auth authority or unsafe raw tokens, executes isolated replay/catalog and the staged provider/DB negatives including multi-session role/domain/OTP/handoff races, then owner/product approves remaining retirements. Record command, checkout SHA, database version, log, pass/fail/skips, and provider outcome before changing queue.

### DB-005 — DB02 academics and timetable

**Actually executed and passing at exact SHA in PostgreSQL CI (10 baseline tests):**

| Test file under `tests/integration/` | Executed passing |
| --- | ---: |
| `academics-a2.test.ts` | 5 |
| `academics-core.test.ts` | 4 |
| `departments-archive.test.ts` | 1 |
| **Total** | **10** |

**Independent source-level check:** 15/15 current GitHub-source V8 assertions passed against the full canonical legacy inventory blob `890c93f6d912a379a942a0e3245a8acdf23b3050` and staged SQL blob `525c57f9d39c9fc91c8a6fb9e82c3c0d302a4584`: 13/13 source tables and 125/125 distinct fields have explicit target/design dispositions; all 125 still say `postgresStatus=NOT_EXECUTED`; the canonical 98,448-byte stage has **61 distinct DB02 functions, 71 distinct DB02 triggers, six CREATE TABLEs**, and paired PL/pgSQL dollar terminators. The guarded acceptance entrypoint blob `0951895732121f6d80e24a67cd31e93d58c98287` requires exact named disposable database and rejects missing or unexpected DB02 triggers/tables/columns. Its inventory includes **10 Node source test files, 8 rollback-only single-session SQL files and 6 two-session race scripts**, all **authored and NOT executed as this DB02 staged acceptance suite**.

**Decisive registration gap:** Current Drizzle journal has 49 numbered migrations from 0000 through `0048_db09_crm_principal_race_hardening` (journal blob `47e910bafd5eef46ca0494e61ebef772cd4f19c8`). Repository source search under `drizzle/` found no `db02_program_term_bounds_guard` or `program_terms`; the DB02 canonical proposal is a separate `scripts/sql/db02-academic-progression-and-rooms-staging.sql` file, *not an applied migration*. Thus running the existing baseline CI cannot prove DB02's persisted cohort term/year/version, faculty/role lifecycle, tenant-correct academic parent reassignments, hall conflicts, curriculum and promotion CAS invariants. DB-005 is not verified simply because the 10 baseline tests pass.

**Next accepted proof:** Sole migration integrator Chat 1 reconciles the canonical DB02 SQL (61 functions, 71 triggers, six tables) with existing numbered migrations and current barrel; verifies duplicate constraints/locks before registering. In a strictly disposable PostgreSQL 17 database, perform clean registered replay, drift/catalog and execute exactly:

```bash
DB02_DISPOSABLE_ACCEPTANCE=YES \
DB02_EXPECTED_DATABASE=db02_verify_test \
DATABASE_URL='<isolated local disposable postgres URL ending /db02_verify_test>' \
bash scripts/sql/db02-run-disposable-acceptance.sh
```

The literal above is a **command to execute later, NOT a command executed by this report**. It must confirm the matching catalog manifest and run all 10+8+6 families with exit 0. Review actual two-session promotion/archive/hall conflict/role and tenant outcomes and the open compatibility/retirement choices before DB-005 can become `DONE_VERIFIED`.

## Evidence classification / no false positives

- Actual PostgreSQL: **46 DB01 and 10 existing-academics baseline integration tests passed** in CI job above, on a disposable test database at SHA `1a625e0...`. The wider job failed; this is **partial** successful test evidence.
- Isolated in-process JS V8: **11 DB004 + 15 DB005 source checks passed** with current exact GitHub blobs. This is *not* native `node --test` and *not* SQL execution.
- Native local Node of DB004/DB005 stage suites: **NOT_RUN** (this execution environment has Node but no GitHub checkout/network DNS).
- Standalone DB01 provider/OTP/handoff/sidecar PostgreSQL acceptance and canonical DB02 staged 10+8+6 suite: **NOT_RUN**. No production DB accessed.
- Product approval of source retirement/projection decisions: **NOT_PROVEN**.
- Task status unchanged: **DB-004 COMPLETED; DB-005 COMPLETED**. Neither has sufficient explicit acceptance evidence for `DONE_VERIFIED`. Keep global DATABASE ACTIVE and original verified-core count at **3/11**.

This evidence is meant for independent verification, Chat 1 migration/CI integration and DB004/DB005 owner sign-off, not as a replacement for those proofs.
