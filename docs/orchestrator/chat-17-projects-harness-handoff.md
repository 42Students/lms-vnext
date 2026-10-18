# Chat-17 top-priority Projects harness handoff — IIT Dharwad

**Date:** 2026-10-18  
**Branch:** `chatgpt/chat-17-b`  
**Owner remit:** PostgreSQL fixtures for Projects + Placements; reusable race/tenant helpers; example SQL integration witnesses; exhaustive shared UI-kit tests. Do **not** infer full Projects release readiness from fixture authorship.

## Delivered

| Item | File(s) | Count / intended evidence |
|---|---|---|
| Transaction-safe PostgreSQL fixture module | `tests/integration/support/projects-placements-pg-harness.ts` | Dedicated TEST_DATABASE_URL, database-name and migration guards; one outer rollback per test; SAVEPOINT SQLSTATE checks; two independent rollback-only clients for committed-seed concurrency |
| Canonical tenant/role/project/drive fixtures | same | organizations, colleges, users, memberships, system roles, project template/version/assignment, workspace instance, release, sprint, task, resource, mentor/learner roster, task and final submissions, meeting, placement company/relationship/drive/round |
| Real database example suite | `tests/integration/projects-placements-pg-harness-groups.test.ts` | **21** cases: all main project table groups, placement drive, cross-organization SQL scoping, restrictive FK behavior, duplicate/invalid SQLSTATE, savepoint recovery, full rollback and two-session no-leak witness |
| Guard test suite (unit, no PG connection) | `tests/unit/projects-pg-harness-contract-chat17.test.ts` | **7** assertions and multiple unsafe-URL variants; no production fallback |
| Shared UI kit deep suite | `tests/unit/UX-kit-projects-hardening-chat17.test.tsx` | **21** direct behavior groups + a **38-element kit registry** checking popup/motion hygiene; includes form errors, file limits, cancel/pending, keyboard, sensitive links, persistent errors, table empty states and scroll cues |
| Earlier shared kit motion suite | `tests/unit/UX-kit-scroll-motion-01.test.tsx` | **8** scroll/overlay/motion and four previously uncovered shared primitive examples retained |
| Execution scripts | `package.json` | `test:db:projects-harness`, `test:ux:kit:hardening`; included UI and guard suites in `ux:audit:unit` |
| Full usage and safety | `docs/orchestrator/projects-placements-pg-harness.md` | Example imports, SQLSTATE/savepoint API, schema replay, admin and other-college actors, tenancy limitations, no-COMMIT policy |

## Commands

```bash
# Pure UI/unit contracts; no PostgreSQL required:
npm run test:ux:kit:hardening
npm run ux:audit:unit

# Against migrated EMPTY DISPOSABLE test DB, never a shared/prod database:
export TEST_DATABASE_URL='postgresql://localhost:5432/lms_vnext_projects_test'
npm run test:db:projects-harness
```

**Schema baseline:** canonical registered `drizzle/0008` to `0015` project tables, `0016` company and `0018` placement job, `0023` rounds, plus subsequent registered additions such as `0091` delivery events and `0123` sprint dates. The suite does not assert DB073/DB074/DB075 composite FK proposals are deployed; it tests `project_delivery_events_submission_fk`, which was registered by `0091`.

## Hardening scope and caveats

- Guard runs **before BEGIN** and checks **26** canonical table names with `to_regclass` and the server's real `current_database()`. There is no fallback to `DATABASE_URL`, no `COMMIT`, no `TRUNCATE` and no cross-test persistent fixture.
- Projects table ancestry generally uses `ON DELETE RESTRICT` instead of cascading deletes. Witness `PROJ-HARNESS-15` asserts this protective FK behavior. Do not invent cascades.
- Tenant-specific database queries are tested with separate organizations; these SQL queries alone are **not** proof of service IDOR policy. Other lanes must inject contexts and exercise routes/actions. The harness intentionally rejects cross-college actor fixtures.
- `getDb()` services use independent PostgreSQL connections; they cannot read the private uncommitted rows. For request/session tests use a separate disposable provisioned fixture/cleanup lifecycle or dependency-injected DB transaction. No weakening of the isolation guard.
- Non-database hazards (signed file URLs, virus scanning, network resilience, notifications exactly once, adversarial state-machine transitions, 1000+ query plans) remain with the relevant owner lanes and project coverage ledger owner chat-14.

## Honest verification / handoff

This environment has a connected GitHub source workflow, but no runnable local checkout or PostgreSQL. **All tests are authored, not claimed green.** Verify typecheck, lint, UI unit suite and the real PG suite in the orchestrator's disposable runner. Attach execution results to `docs/audit/coverage/projects-ledger.md` (chat-14 lead) and log any real defect in `docs/audit/projects-defects.md`. A failed SQL witness must prompt a production fix/review, not a skipped assertion.
