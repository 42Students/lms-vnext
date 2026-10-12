# DB-004 + DB-005 independent verification — 2026-10-12

**Scope:** DATABASE phase only; peer verification of source reconciliation, staged SQL and current executed CI evidence. **Not** acceptance of either original-core task as `DONE_VERIFIED`.
**Source oracle:** `42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5`.
**Latest independent inspected schema journal:** `drizzle/meta/_journal.json` blob `47e910bafd5eef46ca0494e61ebef772cd4f19c8` (49 entries, 0000–0048). Existing Drizzle replay success does **not** register the optional DB01 security sidecars or DB02's canonical 71 triggers.
**Execution labels:** `SOURCE_EXECUTED_V8`, `NATIVE_NODE_GUARD_EXECUTED`, `CI_POSTGRES_BASELINE_EXECUTED`, `UNEXECUTED_STAGED_DATABASE_ACCEPTANCE`. Do not conflate them.

## DB-004 — Identity and tenancy

**Task state: COMPLETED, not DONE_VERIFIED.** Authoritative source crosswalk and final ledger cover 312/312 unique source fields; 137 original target gaps were separately triaged (123 unverified target proposals + 14 explicit candidate non-persistence decisions). The canonical final ledger has 312 explicit decisions, zero anonymous decision gaps, and **zero PostgreSQL/provider/runtime-semantic verified field mappings**. The earlier 70 active fields without producer/consumer proof have distinct family-level source evidence, not executed provider-writer proof.

Independent exact-GitHub-source JavaScript V8 function evaluation: **11/11 PASS**. Cases covered the 312-field denominator, original gap accounting, canonical source-decision ledger, 70 distinct family consumer rows, single Identity Platform authority, unregistered/untested provider state, and rejection of forged duplicates, omissions, raw password persistence, provider revocation loss, and fabricated runtime verification.

Reviewed blob identities:
- `scripts/db004-identity-disposition-audit.mjs` `9c1651c903cb7f8608c9da257e4c81f6e488f997`.
- `scripts/db01-final-field-disposition-audit.mjs` `fa1155022c2ee7ae493029415a089d8f5513332e`.
- `docs/planning/db01-chat02-312-field-source-triage.json` `efedb62f8738798e757186c7143836345405d33a`.
- `docs/planning/db004-312-source-target-disposition-proposals.json` `38df0e1e4b3826da4bb4800d0b6528ac988ea5fd`.
- `docs/planning/db01-chat05-final-field-disposition.json` `2376d0530a0180769aeee970ad101c5524df88db`.

**Real PostgreSQL evidence already exists for the registered DB01 baseline** in [CI run 38274277458](https://github.com/42Students/lms-vnext/actions/runs/38274277458) (at `1a625e03`): independent `tests/integration/db01-membership-role-parent-lock.test.ts` 10/10, `db01-concurrent-integrity` 6/6, `db01-core-structure-invariants` 12/12, `db01-tenant-routing-lifecycle` 4/4, `db01-tenant-identity-invariants` 5/5 and `db01-identity-fk-invariants` 9/9 ran and passed within an overall failing integration job. Other DB01 baseline tests also passed. **This subset PASS does not prove the unregistered provider/session/OTP/handoff lifecycle sidecars.** Stage manifest remains `STAGED_UNREGISTERED_NOT_EXECUTED`, including domain deletion/tombstone policy and per-device sessions. The 14 no-persistence candidates do not constitute approved product retirements.

**Missing DB-004 acceptance:** Chat 1 integrates only policy-approved source-backed DB01 staging under sole numbered Drizzle/barrel authority; disposable clean replay and catalog prove specific registered keys/guards; run cross-tenant FK/state/deletion/revocation and two-session race negatives; independently run actual Identity Platform OTP/email/session/handoff/expiry/replay and tenant-context/writer lifecycle tests; record exact accepted source commit, PG version, logs, and domain/product owner decisions. No acceptance evidence yet authorizes state promotion.

## DB-005 — Academics and timetable

**Task state: COMPLETED, not DONE_VERIFIED.** Frozen 13 historical table / 125 field census is exact and all fields have recorded source and vNext design dispositions. Exactly **17** fields in the historical `program` and `program_structure` families are labeled `HISTORICAL_DDL_ONLY_REQUIRES_RETIREMENT_REVIEW`; do not treat that as approved retirement or automatically clone obsolete duplicate storage. The complete candidate ledger still marks all 125 source rows' PostgreSQL semantic verification `NOT_EXECUTED`.

Independent exact-GitHub-source V8 structural checks: **21/21 PASS**. Checked 13/125 denominator, exact legacy oracle SHA, distinct identities, per-row source/target decisions, intentionally unverified labels, 61 distinct `CREATE FUNCTION` declarations and 122 paired `$$` markers, **71 distinct triggers**, canonical runner references, opt-in isolated target, catalog trigger comparison, and inclusion of **8 rollback SQL acceptance scripts** plus **6 two-session concurrency scripts**. Those counts are source inventory, **not** proof of PostgreSQL SQL validity or trigger execution.

Current reviewed blobs:
- `scripts/sql/db02-academic-progression-and-rooms-staging.sql` `525c57f9d39c9fc91c8a6fb9e82c3c0d302a4584`.
- `docs/planning/db-pass4-columns-db02_academics_and_timetable.json` `890c93f6d912a379a942a0e3245a8acdf23b3050`.
- `scripts/sql/db02-run-disposable-acceptance.sh` `e31f34c881cbf695322ed70bc21aa5495f12c40c`.
- `scripts/sql/db02-assert-disposable-target.sh` `6a6717eb805bd0ac35fd6513b9aff969f6886689`.

**Independent native Node 22.16.0 proof: 12/12 PASS**, running an isolated guard fixture at `/mnt/data/db004-db005-tests` against copies of `scripts/db01-test-database-guard.mjs` (Git blob `c2a916da0302c3b0c4a527f8de5a88f0c83f9ae7`) and `db02-assert-disposable-target.sh` (`6a6717eb805bd0ac35fd6513b9aff969f6886689`). Commands: `git hash-object scripts/db01-test-database-guard.mjs scripts/sql/db02-assert-disposable-target.sh`; `node --test verify-guard.test.mjs`. Tested opt-in, local test-only DB name, no-production DB, query redirect rejection, application URL separation, remote exact confirmation, and name mismatch. This tests **pre-connection safety only**, never connects to PostgreSQL or tests triggers. Every one of the six committed DB02 two-session shell harnesses now invokes the common guard before the first actual `psql` DB connection.

**Registered baseline PostgreSQL tests** `tests/integration/academics-core.test.ts` 4/4, `academics-a2.test.ts` 5/5 and `departments-archive.test.ts` 1/1 passed in the same hosted CI run 38274277458. These are not DB02 stage-specific tests. Schema journal `0000` through `0048` has **no numbered promotion of the canonical DB02 stage**, and `src/db/schema/index.ts` has no DB02 staging exports. Thus **no executed DB02 71-trigger or six-race acceptance has occurred**.

**Missing DB-005 acceptance:** Chat 1 reconciles DB02 canonical staging into numbered Drizzle/barrel without duplicate SQL or overlap with registered baseline; replay `0000` to exact head on a disposable PG17 target; verify all stage tables/columns, 71 triggers, enum changes, FKs/lock orders; run `DB02_DISPOSABLE_ACCEPTANCE=YES DB02_EXPECTED_DATABASE=<explicit_test_db> DATABASE_URL=<disposable_test_url> bash scripts/sql/db02-run-disposable-acceptance.sh` from that isolated checkout, capturing full 8 SQL rollback and 6 two-session race outputs; adjudicate the 17 historic source-field retirement candidates with domain/product owner before final acceptance.

## CI interpretation and handoff

- [CI run 38280370593](https://github.com/42Students/lms-vnext/actions/runs/38280370593) at `1dd934d68eca7f76f85f672611bc64b0e13a15bd`: `source-contracts`, `schema-drift` and `db00-scope` jobs passed. The `database` job **passed** journal, PostgreSQL 17 clean migration replay, idempotence, read-only catalog and DB017 share-default checks but **failed** broad integration; unit, typecheck, build, lint and browser preparation also failed. Never describe entire CI or PostgreSQL integration as passing. Earlier [run 38274277458](https://github.com/42Students/lms-vnext/actions/runs/38274277458) provides the per-suite DB01/academics baseline counts above.
- As of this verification, **DB-004 and DB-005 must remain `COMPLETED`**. No source test, native Node safety guard, baseline migration replay or checked document is independently sufficient for `DONE_VERIFIED`.
- **Chat 1 exclusive mutation scope:** `drizzle/**`, `src/db/schema/index.ts`, shared CI/root infra. Do not authorize another worker to write them; do not apply unregistered stage SQL against production or shared environments.
- The global phase stays **DATABASE** with API/UI/RELEASE **LOCKED**. Verified original-core count stays **3/11** (DB-002, DB-003, DB-017).
