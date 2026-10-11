# Chat 6 / DB-008 — live lesson restore parent lifecycle guard evidence

**Date:** 2026-10-12 IST · **Global phase:** DATABASE ACTIVE · **Task:** DB-008 IN_PROGRESS.  
**Oracle:** legacy BE `21bad59d4dfaf2fa11fdeaf9353327ce105697d5`, FE `e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2`.

## Fixed source candidate (UNREGISTERED)

- `scripts/sql/db05-course-soft-delete-guard.draft.sql` Git blob `fadd279f21eb0686d334a27f90246a2cdd2e7303`: trigger now includes legacy_deleted_at updates; live lesson writes lock/check course `FOR SHARE`; deleted lesson history can still be cleaned up.
- `tests/db05-lesson-restore-parent-reference.test.mjs` Git blob `e95168a6a11bff101a0a9215a0899a36f1567848`, **actually executed**.
- `tests/db05-lesson-restore-parent-guard.test.mjs` Git blob `937bb1fd4bde0543a20de7afd3091953a16adf6d`, static test authored only.
- `docs/planning/db05-migration-readiness-manifest.json` retains 12 unregistered DB05 companions and 73 gates after preserving peer edits; new `DB05_LESSON_RESTORE_PARENT_LIVE_PG_NEGATIVE` remains NOT_RUN.

## Native Node evidence

**Command:** `node --test /mnt/data/db008-check/tests/db05-lesson-restore-parent-reference.test.mjs`  
**Runtime:** Node v22.16.0  
**Result:** 10/10 PASS, 0 FAIL, TAP `1..10`, process exit 0, duration 55.333 ms.  
**Exact source integrity:** local `git hash-object` returned `e95168a6a11bff101a0a9215a0899a36f1567848`, exactly matching GitHub's newly created blob SHA.  
**Scope:** A pure reference policy model checks live/deleted inserts, in-place restore, moves, cleanup, missing parent and no-op state. It does **NOT** execute PL/pgSQL, prove row-lock scheduling, or check tenant membership.

The connected GitHub V8 model also passed **12/12 source-structure assertions** against exact staged SQL/manifest blobs for event columns, lock, non-destructive handling, 12 test case IDs and fail-closed gate. These are static checks, not native Node suite or DB acceptance.

## Required execution still missing

- `psql`, `postgres`, `docker`, and disposable `TEST_DATABASE_URL` were unavailable in this hosted runtime.
- `LR-01..LR-12` actual PostgreSQL migration/tenant/two-session negative tests: NOT_RUN.
- SQL migration journal registration and schema barrel edits: **NONE**; W01 exclusively integrates.
- Typecheck/lint/build/API/browser: NOT_RUN for this source draft.
- No new formal DB05 field semantic verification; do not advance the global phase.

Integrate only after course/lesson legacy_deleted_at and version columns exist and paired authoring/soft-delete read/write consumers are coordinated in the future API wave. Parent row FOR SHARE cannot replace a real two-session rollback/deadlock witness.
