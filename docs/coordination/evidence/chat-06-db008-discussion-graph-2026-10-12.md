# Chat 6 / DB-008 — discussion graph and ancestor scope source evidence
**Date:** 2026-10-12 IST  
**Phase:** DATABASE (ACTIVE) · **Queue:** DB-008 IN_PROGRESS · **Worker:** Chat 6  
**Legacy backend oracle:** `21bad59d4dfaf2fa11fdeaf9353327ce105697d5`  
**Legacy frontend oracle:** `e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2`

## New bounded integrity proposal

- `scripts/sql/db05-lesson-discussion-ancestry-integrity.draft.sql` — Git blob `64bba68b3738ba31175ecc9195d00e8e46dc5adb`, UNREGISTERED companion.
- `scripts/sql/db05-lesson-discussion-ancestry-preflight.readonly.sql` — Git blob `6751f37d2bedd21ba0a847579c5e176663cafc3d`, requires staged discussion table.
- `tests/db05-discussion-ancestry-integrity.test.mjs` — Git blob `2c8a1523463a35bd016655749fcc99c463e98681`, authored static test (NOT native Node executed at this checkpoint).
- `tests/db05-discussion-ancestry-reference.test.mjs` — Git blob `5581c1ae8c512614910a3fe72c2d315a96ee67a4`.
- Existing source-backed discussion contract and DB05 readiness manifest updated (12 companions / 71 gates after preserving one peer-added gate), NO numbered migration or barrel edit.

## Actually executed test (pure reference model)

**Environment:** Node `v22.16.0` on isolated local runtime with no database, repository checkout or test-provider dependencies.  
**Command:** `node --test /mnt/data/db008-check/tests/db05-discussion-ancestry-reference.test.mjs`  
**Observed:** TAP `1..11`, `pass 11`, `fail 0`, `duration_ms 72.243626`, process exited 0.  
**Source identity:** `git hash-object tests/db05-discussion-ancestry-reference.test.mjs` returned `5581c1ae8c512614910a3fe72c2d315a96ee67a4`. The GitHub connector's independently created blob SHA was also `5581c1ae8c512614910a3fe72c2d315a96ee67a4`; this ties the executed pure-model test to the committed exact bytes.

The 11 reference scenarios include root/normal chains, self, 2-hop and 3-hop cycles, pre-existing corrupt cycle, missing and cross-content parent, lesson vs delivery reparent, historical deleted reply preservation, and no-op/empty content.

**Additional source-only check:** Connector V8 inspected exact candidate/test/manifest blobs: 16 assertions covering two proposed triggers, single SQL transaction, READ COMMITTED guard, shared DB05 advisory lock, deduplicating recursive query, 20 enumerated PG cases, safe preflight and fail-closed manifest. An initial comment-wording false positive on `UNION ALL` was removed; recheck must use the updated blob, not the old candidate. Source-text assertions do NOT execute the SQL.

## Required proof NOT available and NOT claimed

- PostgreSQL installed/reachable: **NO** in this model-hosted container (`psql`, `postgres` and `docker` absent; no `TEST_DATABASE_URL`).
- Registered Drizzle migration: **NO**, W01 is sole integrator.
- Disposable PostgreSQL clean replay, direct-SQL negative, tenant and two-session races DG-01..DG-20: **NOT RUN**.
- Typecheck/lint/build/API/browser: **NOT RUN** for this candidate.
- Legacy active nested-reply or moderation consumers: **UNPROVEN**.

This source-only batch does NOT set any verified DB05 field, completion gate or global phase transition to PASS. W01 must integrate exactly once after active lesson discussion and delivery/ancestry guards, prove lock ordering and execute the DG matrix. Existing pure-model passes do not substitute for SQL execution.
