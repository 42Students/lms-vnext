# DB-008 — Classroom message retention and ancestry integration handoff

**Worker:** Chat 6 · **Global phase:** DATABASE · **Date:** 2026-10-12  
**Status:** Source implementation committed; PostgreSQL and application acceptance NOT VERIFIED.

## Source-backed persistence package (UNREGISTERED)

- `scripts/sql/db05-classroom-message-history.draft.sql`: sole draft owner of trusted author name snapshot, soft-delete timestamp, active timeline index; now also includes a `BEFORE DELETE` hard-delete fence raising SQLSTATE 23514. The current vNext `discussion-service.ts` still performs a hard DELETE; **W01 must not activate the fence before a coordinated soft-delete API cutover**.
- `scripts/sql/db05-classroom-chat-parity.draft.sql`: companion-only child message scope check, including sender membership, course department college, offering period, section period, section cohort's program department, exact cohort and period IDs. Uses shared DB05 advisory lock `605008003` under READ COMMITTED.
- `scripts/sql/db05-classroom-message-ancestor-retention.draft.sql`: separate companion with ten trigger events across delivery (including DELETE), offering, section, course, department, academic period, cohort, program and author membership. Protects retained messages, including deleted ones, from ancestry/identity reparenting. W01 must review policy and trigger ordering, merge once, and prove deadlock-safe races.
- `scripts/sql/db05-classroom-message-integrity-preflight.readonly.sql`: aggregate-only existing-row probe for 17 distinct missing-join/tenant/cohort/period mismatch categories. No actor names, texts or row IDs are emitted. **Not executed on PostgreSQL.**
- `scripts/db05-sql-collision-audit.mjs`: source-only DDL name/column collision detector. The one allowed function replacement is `db05_lesson_discussions_tenant_guard` (base definition then companion update); all unregistered drafts still need W01 integration review.

## Executed evidence (narrow scope)

`tests/db05-classroom-ancestor-reference.test.mjs` was executed by native **Node v22.16.0** on a byte-identical local copy:

```text
node --test /mnt/data/db05-native-tests/classroom-ancestor-reference.test.mjs
tests 18
pass 18
fail 0
```

Committed Git blob: `d2cd43b8118dcdb1e925785fd0ba312e13890d9d`; original source commit: `6a57ef41757458b71fce596eb420cfaee869fdb6`. Git blob matching proves the exact test file bytes were executed. This is a **reference graph model only**; it does not execute PL/pgSQL, active application services, migrations, or PostgreSQL races.

Independent GitHub-source contract checks confirmed trigger-name uniqueness for the new companion, the canonical history column owner, same-key child/ancestor locking, and the fail-closed migration manifest. Source-only assertions are not runtime acceptance. `tests/db05-classroom-ancestor-retention.test.mjs`, `tests/db05-classroom-message-parity.test.mjs`, and `tests/db05-sql-collision-audit.test.mjs` are authored but not yet executed in the full repository.

## Mandatory acceptance before any activation

1. W01 register canonical classroom history columns and dependent guards in numbered Drizzle journal only after live service creates snapshot and uses soft delete, including read/pin/delete filtering.
2. Execute read-only 17-category drift preflight on disposable PostgreSQL with current schema and seed; all mismatch counts must be zero before rollout.
3. Run CL-01..CL-18 two-connection SQL scenarios, wrong college/program/cohort/period actor scope, actor membership user reassignment, direct DELETE and ON DELETE CASCADE, conditional rollback, unauthorized cross-role moderation, concurrent message INSERT vs all upstream moves, READ COMMITTED and deadlock lock-order proof.
4. Check interactions with DB02 department/cohort/period ancestry and DB05 offering/delivery/content/lesson-discussion guards. Do not use PostgreSQL source-only parsing as a substitute for successful executed negative tests.
5. Run native Node suites, typecheck, lint, build and accepted app integration in an independent runner; GitHub Actions billing status is not an engineering blocker.
6. Update all DB05 ledger and shared queue proof only with exact source/runtime SHA and logged results. Original 11 source gaps remain **0/11 formally database verified** and DB-008 remains **IN_PROGRESS**.

**No production migration, runtime trigger or app API change is claimed here.**
