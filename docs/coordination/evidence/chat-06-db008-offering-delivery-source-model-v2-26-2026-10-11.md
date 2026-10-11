# Chat 6 / DB-008 — offering/delivery source-model Node execution v2

**Date:** 2026-10-11 IST  
**Phase/task:** DATABASE / DB-008 IN_PROGRESS  
**Reason for rerun:** Added source-backed **new-INSERT-only** lifecycle validation to staged offering/delivery SQL guard, expanding the previous 19 reference cases to 26.

| Execution field | Verifiable value |
|---|---|
| File | `tests/db05-offering-delivery-reference.test.mjs` |
| GitHub commit | `6a11cd5aa8252c144efe26c9f93f60f82871ff59` |
| Post-commit GitHub blob SHA | `b2ef07b1535082cbbf0b01391e15e8476eb372e5` |
| Local `git hash-object` | `b2ef07b1535082cbbf0b01391e15e8476eb372e5` (**exact match**) |
| Local SHA-256 | `c2a7d5281d55158b8584c9af9c926edd4037051f4a5a1f545d5906fc2832e458` |
| Node | `v22.16.0` |
| Syntax command | `node --check /tmp/db05-offering-delivery-reference.test.mjs` |
| Test command | `node --test /tmp/db05-offering-delivery-reference.test.mjs` |
| TAP result | **26 tests / 26 passed / 0 failed / 0 skipped / 0 cancelled** |
| TAP duration | `67.435128 ms` |
| Real PostgreSQL/trigger execution | **NOT RUN** |
| TypeScript typecheck/full repo integration | **NOT RUN** |
| GitHub Actions | intentionally unused (billing), not an engineering blocker |

Newly included source-model cases: archived course cannot receive a new offering; completed/archived cohort cannot receive a new offering; closed academic period cannot receive a new offering; archived offering/course/section cannot receive a new delivery. This complements the earlier tenant-college, exact cohort/period, start/end date and fail-closed missing-scope cases.

**Important limitation:** Tests exercise an independently authored pure JavaScript predicate model. They do NOT prove the PostgreSQL trigger SQL in `scripts/sql/db05-offering-delivery-scope.draft.sql`, transaction isolation, historical row updates, migration replay, database access controls, application services or two-session races. W01 must execute a disposable PostgreSQL negative suite before ANY readiness gate can pass.

**Lifecycle guard source evidence:** `src/modules/courses/offering-service.ts` and `src/modules/courses/delivery-service.ts`, plus `src/modules/courses/scope.ts`. `TG_OP='INSERT'` is deliberate; existing historical rows remain when section/cohort/period status transitions occur.

Previous 19/19 artifact remains in `docs/coordination/evidence/chat-06-db008-offering-delivery-reference-node-2026-10-11.md` as earlier versioned evidence, not current SHA proof.
