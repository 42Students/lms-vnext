# DB-020 — Public CI restart and independent PostgreSQL acceptance barrier (2026-10-12)

**Scope:** DB-020 under the global `DATABASE` phase. **Status: PARTIAL EVIDENCE; NOT COMPLETED, NOT DONE_VERIFIED.** This note is a reproducible acceptance/runbook handoff, not a migration, schema-barrel change, production deployment or release authorization. W01/Chat 1 exclusively owns `.github/workflows/**`, `drizzle/**`, `src/db/schema/index.ts` and shared package/CI integration.

## What was actually executed on GitHub

The user made `42Students/lms-vnext` public. CI retry [run 3313 attempt 2](https://github.com/42Students/lms-vnext/actions/runs/38210379636) against `006b1bcebf16db3ead31ca505bbe6ae714dc473c` was requested through the connected GitHub action. GitHub confirmed the retry, allocated `ubuntu-latest`, launched the ephemeral PostgreSQL 17 service, checked out the repository, configured Node 22, installed packages, and actually **passed**:

1. `npm run db:journal:verify`;
2. `node --test tests/drizzle-journal-guard.test.mjs`;
3. `npm run db04:promotion:verify`.

It **failed** at `npm run lint`: 49 reported problems (26 errors, 23 warnings). The remaining same-job steps — typecheck, Vitest, DB parity, Drizzle generation/diff, disposable DB preparation and migration, PG integration, Playwright, build and smoke — were **SKIPPED, not PASS**. Service startup is not a database migration replay. Earlier failures were runner-allocation-only; those pre-step failures are now superseded by actual executed runner evidence.

A follow-up main source batch removed three independent, non-overlapping database-side lint parser faults:

- `5e21a137415468d55b399a1956074ffbda9069e7`: repaired invalid template-literal escaping in unregistered DB10 announcements draft;
- `a01073ce33d1c554c318fe8cb8da4f36d82b90d8`: repaired malformed DB10 notification campaign test regex;
- `a1ba3f12c5c0b497bdb9666653dd0d6c82f2335c`: repaired seven double-escaped DB018 source-witness assertions.

[Run 3316](https://github.com/42Students/lms-vnext/actions/runs/38235343095) executes latest of those three repairs and reports **46 problems (23 errors, 23 warnings)**. It still fails at lint, so it does not certify other quality steps.

## Distinct evidence levels

| Gate | Current evidence | Remaining requirement |
| --- | --- | --- |
| Hosted CI runner availability | **PASS**: public-repository runner and PG service launched | Do not reopen billing as a blocker |
| Registered Drizzle journal *source* integrity | **PASS** on 3313 attempt 2 | Re-run at final migration-integrated head |
| DB04 promotion *source* bundle | **PASS** on 3313 attempt 2 | Does not prove DB04 was registered or tested against real PG |
| ESLint | **FAIL**: 23 errors remain as of 3316 | Repair errors, retain rule strength; do not hide with blanket disables |
| TypeScript typecheck | **NOT_RUN** after lint failure | Execute against exact target main |
| Vitest unit and DB source tests | **NOT_RUN** after lint failure | Execute, retain full results |
| Registered migrations clean 0000→HEAD and second-run idempotence | **NOT_RUN** in these CI runs | Chat 1 integrates candidates; run on disposable PG with schema/journal drift proof |
| Tenant/FK/delete/state/race negative witnesses | **NOT_RUN** | Execute opt-in scoped tests; require zero skips where acceptance is required |
| Browser/Playwright | **NOT_RUN** after lint failure | Execute on freshly prepared E2E DB with test auth, no real users |
| Next.js production build/smoke | **NOT_RUN** after lint failure | Execute independently |
| Global DB source active/retire field dispositions | **OPEN** | DB-019 plus domain-owner signoffs, not just candidate-array counts |
| Phase transition | **LOCKED** | All global DATABASE phase-state gates and real executed proof required |

## Immediate Chat 1 CI work — parallel isolation, not weaker checks

**This is an integration handoff; no shared workflow was edited by this worker.** Existing `.github/workflows/ci.yml` runs one serial `verify` job with `timeout-minutes: 15`; after one lint error, DB tests and Playwright are never attempted. On a public repository, standard GitHub-hosted Ubuntu runner minutes are free under GitHub's public-repo policy, but no run should assume infinite job time or artifact retention.

Recommended **parallel jobs** for Chat 1, all required and non-`continue-on-error`:

1. **source-quality:** checkout + Node22 + `npm ci`, lint, `npm run typecheck`, `npm test`, `npm run test:db:parity`, structural coordination checks `node scripts/db065-database-phase-gate.mjs` and `node scripts/db066-transition-evidence.mjs`. Avoid making a single failure suppress otherwise independent job results.
2. **postgresql:** own `postgres:17-alpine` service bound to runner localhost and disposable `lms_vnext_test`; `npm ci`; `npm run db:journal:verify`; `npm run db:generate` and `git diff --exit-code -- drizzle/`; `npm run db:test:prepare` with only scoped `TEST_DATABASE_URL` for destructive prep; `npm run db:migrate`; `npm run test:db`. Use `DB03_ISOLATED_TEST_DATABASE=1`, `DB06_ISOLATED_TEST_DATABASE=1` only when their preflight contract is satisfied. Never run destructive commands on a real product DB. Persist log evidence/PG version and exact `github.sha` even on failure. The existing `npm run db:verify:independent` offers local Docker or explicit TEST_DATABASE_URL evidence but must be assessed for redundant resets if combined with these steps.
3. **browser-e2e:** own PostgreSQL service and fresh E2E fixture prep, install Chromium, use generated transient E2E auth secret, `npm run test:e2e`. No real identity-provider secrets or production DB connections.
4. **build-smoke:** checkout + Node22 + `npm ci`; `npm run build`; serve standalone runtime locally and `npm run smoke:public -- http://127.0.0.1:3000`. If build needs environment variables, provide placeholders only where safe and valid, never publish a secret.
5. Optional separate **full-db-race** job (or nightly manual workflow) with an *isolated* per-run disposable database, the exact opt-ins required by `scripts/db-staged-pg-witnesses.mjs`, zero skipped required cases, and explicit role/tenant/boundary concurrency proof. Staged-only tests **never replace registered migration replay**.

Use concurrency to cancel superseded main checks if economically sensible, but preserve all final-head checks and artifact references. A job failing must fail the overall check, even while other jobs finish. Increase the current 15-minute combined-job timeout to bounded, job-specific values when actual runtime requires it; do not disable quality gates merely to achieve green status. Make public artifact uploads privacy-safe (no `DATABASE_URL` credentials, tokens, private screenshots, personal test records).

## DB-020 final acceptance (do not check these boxes from source files alone)

- [ ] Freeze current legacy FE/BE and vNext main SHAs; reconcile additions after previous source snapshot.
- [ ] DB-003 seven Smrithi tables/91 fields explicitly approved as active, remodeled, external or retired with consumer proof; no silent retirement.
- [ ] DB-004 DB01 137 outstanding source-field dispositions; DB-005/007/008/012 domain-owner semantics and source notes reconciled.
- [ ] DB-019 independent 11-domain ledger (199 table candidates/2,829 field candidates) source identities, proposals and approvals reconciled; no fake runtime verification.
- [ ] Chat 1 registers every approved staged schema/migration exactly once, detects duplicate cross-domain checks/FKs/triggers and produces valid Drizzle snapshots.
- [ ] PostgreSQL disposable from empty database: `0000`→journal head replay **PASSED** on exact SHA; second migration call idempotent; catalog FK/check/index/trigger/enum drift checked.
- [ ] Test tenant isolation and cross-parent FK negatives; soft-delete/history retention; uniqueness, audit and state machines with concrete failing bad writes and succeeding good writes.
- [ ] Execute two-session concurrency races (including known-red DB015 witnesses) with locks/commit results and zero required skips; do not equate SQL source regexes with runtime results.
- [ ] Execute independent `npm run db:verify:independent` or equivalent safely scoped runner; save exit codes, redacted provider/DB metadata, test counts and immutable artifacts.
- [ ] Re-check phase-state + queue/checkpoints, all dependencies and all required gate evidence. Only then request Chat 1/phase coordinator to move DATABASE→API.

**As of this document:** these DB-020 certification boxes remain unchecked; API/UI/RELEASE stay locked. Any status change must follow actual executed acceptance, not confidence inferred from task counts or hosted-runner availability.
