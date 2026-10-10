# W01 / Chat 1 — platform, core database and CI closure ledger

**Issue:** [#21](https://github.com/42Students/lms-vnext/issues/21)  
**Coordinator:** W01 alone writes `drizzle/**`, `drizzle/meta/**`, the shared schema barrel, core identity authorization, and CI workflow.  
**Source oracles inspected:** `42Students/lms@prod-2026:21bad59d4dfaf2fa11fdeaf9353327ce105697d5`; `42Students/lms2-fe@prod-2026:e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2`.  
**As of:** 2026-10-10 IST. Source table counts are candidates, not live schema and not signed-off active tables.

## Exact ownership inventory

| Domain | Legacy table candidates | Legacy column candidates | Semantic/DB verified | Current state |
| --- | ---: | ---: | ---: | --- |
| DB00 Historical/Engine | 39 | 732 | 0 | **32/39 table dispositions closed**: 31 backup tables retired for greenfield + Flyway metadata replaced by Drizzle; 7 Smrithi tables remain product-decision pending |
| DB01 Identity/Tenancy | 22 | 312 | 0 | Existing application foundation; precise field/constraint producer-consumer signoff pending |
| DB02 Academics/Timetable | 13 | 125 | 0 | Existing application foundation; precise role, period, section and tenant FK checks pending |
| DB03 Groups/Electives | 6 | 79 | 0 | Migrations 0037–0040 and domain flows authored, not migration/DB-runtime verified |
| DB04 Profiles/Verification | 7 | 103 | 0 | 67 proposed field mappings; inactive staged schema/services; no registered DB04 migration/routes |
| **Total W01** | **87** | **1,351** | **0 formal verification** | **Release blocked** |

Source: `docs/planning/database-parity-full-domain-queue.json` plus individual DB03/DB04 ledgers. Candidate columns include migration-added column candidates. Do not infer 0% implementation from 0% *formal semantic verification*.

## This W01 session — merged on main

1. [PR #27](https://github.com/42Students/lms-vnext/pull/27), merge `98c84d841191857a084577b143be26256c62a638`: groups, member transitions, lifecycle, project-team attachment and rule upsert/refresh now transactionally re-authorize stored ACTIVE user, membership and current role; stop stale-context admin/learner writes. Authored four isolated PostgreSQL regression cases.
2. [PR #29](https://github.com/42Students/lms-vnext/pull/29), merge `91f0605bbe4bfacdda5ae58511a403eed597be71`: add `npm run db:journal:verify` and CI guard for missing/empty/unregistered SQL, duplicate or out-of-order entries, orphan snapshots and broken Drizzle snapshot ancestry. Six `node:test` regression cases are wired into CI. A static journal guard is **not** migration execution, Drizzle generation, or PostgreSQL structural verification.
3. [PR #31](https://github.com/42Students/lms-vnext/pull/31), merge `b9861a18ca30516130ae55a09ddd3797c367a288`: elective slot and offering writes use the same stored-admin transactional guard; fix missing `isNull` import in elective listing; author one additional isolated PostgreSQL test.

**This session's incremental authored cases:** five DB03 PostgreSQL cases + six pure Node journal-guard cases. **No test execution/passing status is asserted.** Existing test inventory and authored behavior are not evidence of runtime correctness.

## Current blocking gates — not DONE

**P0 runner / reproducibility:**
- Previous GitHub Actions `verify` job finished FAILED in ~2 seconds with `runner_id=0`, `steps=[]`; job logs endpoint produced no usable logs. Root cause is not provable from this evidence (check organization Actions runner/billing/settings). Later queued runs are not a pass.
- Obtain a clean complete checkout and executable runner with `npm ci`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:db:parity`, `npm run db:journal:verify`, `npm run db:generate` and `npm run build`.

**P0 database replay:**
- On disposable PostgreSQL only: replay `drizzle/0000` through latest journal using `npm run db:test:prepare`, verify `drizzle-kit generate` has no unexpected diff, inspect `pg_catalog` FKs, CHECKs, indexes, scope triggers and event immutability.
- Execute DB03 integration suites including cross-college negative SQL, concurrent max_pick/waitlist, source/target role revocation, group-backed course, quiz, timetable and attendance consumers. Treat every authored case as NOT EXECUTED until real evidence.
- Verify/approve all 79 DB03 legacy-field mappings. Do not mark group-backed elective parity complete merely because group membership and a linked delivery exist.

**P0 DB04 activation/security:**
- Staged DB04 schemas/services and `docs/planning/db04-proposed-migration.sql` remain inactive. Do not export them via `src/db/schema/index.ts` or register a numbered migration until privacy handling, unique number allocation, full journal generation/replay, protected private document storage and tests are satisfied.
- Resolve private evidence upload, verifier/scan status, object-generation binding, identity number redaction and recovery; reviewer role/TPO delegation, grade provenance, cross-tenant SQL checks, concurrency and end-to-end verification.
- Review every 103 source fields; 67 candidate mappings are proposals only and 0 are signed off.

**P1 identity/academics/historical triage:**
- DB00 now explicitly closes 32/39 table dispositions in `docs/planning/db00-historical-engine-disposition.json` (641/732 field candidates by whole-table decision). The seven `smrithi_*` tables remain open until producer/consumer or explicit retirement evidence exists.
- Audit DB01 22 and DB02 13 active domain tables for field, nullable/default, FK/cascade, tenant ownership, actor, state-machine and producer→consumer parity. Check exact current legacy code and record redesign/retirement decisions explicitly.
- Integrate other lanes' SQL **only** after validated domain contracts and allocated migration index. W02–W06 own domain modules/schema drafts; W01 owns the registered Drizzle journal and rejects migration collisions.

## Decision and handoff

- Existing user-visible behavior is specified by latest legacy FE/BE, but the schema may be safely redesigned if every active concept and invariant is mapped and proven.
- Greenfield: no live legacy data import/migration is needed.
- Use `docs/planning/six-chat-closure-plan.md` and [issue #21](https://github.com/42Students/lms-vnext/issues/21) for ownership; do not force-push or copy stale branch trees to main.
- W01 release completion requires all above gates AND the global `npm run parity:status`, `npm run parity:pages`, `npm run parity:clone-gate`, `npm run db:parity:status` checks to reflect real passing evidence.


## Continuation update — DB00 disposition + identity handoff

- DB00 source triage now explicitly closes 32/39 table dispositions: 31 historical backup/cleanup tables retired for greenfield and Flyway metadata replaced by Drizzle; seven Smrithi tables remain open. This dispositions 641/732 DB00 field candidates without calling them runtime-verified.
- W05 recruiter identity dependency is satisfied in source by `provisionPlatformIdentityWithRuntime`; issue #25 now carries the consumption contract. Unit/PG regressions remain authored/not executed while CI has no runner.
- Recent CI jobs still show `runner_id=0`, `steps=[]`; no green CI claim.
