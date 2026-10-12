# Chat 6 / DB-008 — live authoring lock static inspection

**Inspected main HEAD:** `3bfc3be329503b3cfd43d5551e2e9b1e89c4c386`  
**Date:** 2026-10-12 IST  
**Inspection mechanism:** connected GitHub `fetch_file` exact blob source + JavaScript V8 read-only string-structural comparisons. No checked-out repository, no Node `node:test`, no TypeScript compiler, no PostgreSQL connection/transaction, and no Actions CI execution. This document is **NOT** executed database or runtime acceptance evidence.

## File snapshot

| Source | Blob SHA |
| --- | --- |
| `src/modules/courses/delivery-service.ts` | `a13d12faa4adcd86ae9f7e7a75a9c826ced67b04` |
| `src/modules/courses/teaching-assignment-service.ts` | `f5f9dc8f8844cc6d325e3c2ddfb7a88cee3e2b0c` |
| `src/modules/courses/offering-service.ts` | `8724a138dabae308f662fe1d3e39b80a3ff13741` |
| `tests/db05-course-authoring-live-scope-locks.test.mjs` | `742123d80afbacd9acad59af7d3851cdb1e9b347` |
| `docs/planning/db05-live-course-authoring-lock-acceptance.json` | `1acb1ada59b6e8fe11a05308fd9061d15f7275ad` |
| `docs/planning/db05-migration-readiness-manifest.json` | `242b6cad717d68226c52968507afbac3d54e8a9b` |

## Source-level assertions (27/27 true)

- Delivery create: transaction present, 2 SHARE locks, section status rechecked, cohort+period match checked, live offering + section college matched, course/department and section/cohort/program joins present.
- Teaching assignment create: transaction present, 3 SHARE locks, active faculty membership status checked, college matched, FACULTY role selected and guarded before insertion.
- Offering update: transaction present, offering FOR UPDATE locked, 3 SHARE locks, parent course ACTIVE and college rechecked, cohort and period college rechecked, cohort/period mutability rechecked, immutable offering parent IDs asserted in UPDATE.
- `node:test` source: 11 definitions authored. **The suite was not run.**
- PostgreSQL matrix: LC-01..LC-21 exactly 21 unique cases, all `executed=false`, `passed=false`.
- DB05 readiness: integration gate `DB05_LIVE_AUTHORING_LOCKED_SCOPE_TWO_SESSION_PG_ACCEPTANCE` explicitly `NOT_RUN`, 21 scenarios. Global `SOURCE_STAGED_BLOCKED` retained.

## Active source work

Live `main` implementation commits in this iteration:
- [a8aa245](https://github.com/42Students/lms-vnext/commit/a8aa245e16215486987f47de41ff0f0914177f4b) delivery section state/cohort/period recheck
- [ebdb0d1](https://github.com/42Students/lms-vnext/commit/ebdb0d1825ab2569c64055afc57741d5c964bc76) faculty membership/role SHARE recheck
- [881f1e6](https://github.com/42Students/lms-vnext/commit/881f1e6e341492f16a2d694bffee2fb68bde6741) delivery course/section same-college ancestry recheck
- [1aa4d66](https://github.com/42Students/lms-vnext/commit/1aa4d663c2700cc620333889e76af1e44c9bc4f2) offering update cohort/period mutability recheck
- [83c9edc](https://github.com/42Students/lms-vnext/commit/83c9edc2d33d8d9b4ee876ac819d336ef9ca1678) offering update course ancestor/college SHARE recheck

One concurrent peer also fortified parent ID consistency and offering creation; the latest version was preserved rather than overwritten.

Tests and acceptance: `tests/db05-course-authoring-live-scope-locks.test.mjs`, `docs/planning/db05-live-course-authoring-lock-acceptance.json` (21 mandatory scenarios).

## Why not DONE_VERIFIED

The 21 scenario matrix requires a **disposable PostgreSQL** with two concurrent connections, READ COMMITTED isolation, direct SQL invalid-parent writes and policy-specific rejection, and lock/deadlock/timing witnesses, plus Node/TS lint/typecheck and service tests. W01 retains exclusive numbered migration/schema-barrel ownership, and the upstream DB02 ancestor reparent guard still needs coordinated acceptance. GitHub Actions billing is intentionally not used; runtime verification can be supplied independently when available.

**Result:** source check 27/27 true; production correctness and DB phase certification **NOT VERIFIED**.
