# DB08 learner placement: persisted identity revocation hardening

**Date:** 2026-10-12 IST  
**Repository:** `42Students/lms-vnext`, commits directly on `main` (no PR).  
**Purpose:** correct a stale-request-context authorization gap in placement reads and writes. This is a DB08 security fix supporting broader DB correctness; it is **not** a claim that the original eleven open DATABASE tasks have closed.

## Shipped changes

| Change | Main commit | Code |
|---|---|---|
| Placement read/access guard checks current persisted `users.platform_status` with membership/role | `12677c0f9c8c28e8ad780953aa53ef3d4e6f63e1` | `src/modules/placements/learner-participation-guard.ts` |
| Placement application create holds the persisted account `FOR SHARE` and rechecks ACTIVE within its transaction | `5f9be5f51ff8c59e2b322826e1ff83cd7a4d5a8c` | `src/modules/placements/application-service.ts` |
| Batch registration joins persisted `users` with membership/role and `FOR SHARE`-locks them for its transaction | `1209d6f3ee5b24ff97dc3e75e41e6651bad1f848` | `src/modules/placements/batch-registration-service.ts` |
| Learner self-withdrawal rechecks and locks membership, user and LEARNER role before status and history mutation | `6719cfd91c94a3d4ee993ca3a672d788386ff2d0` | `src/modules/placements/application-service.ts` |
| Five unit scenarios using a stale ACTIVE context, plus active-path control | `49b7ec7aa272b1cbe7f18e6ecc256194c273acff` | `tests/unit/placement-persisted-learner-access.test.ts` |
| Two isolated PostgreSQL regression cases (disabled account and suspended membership), asserting zero registration row | `410036ec3e1b9093c07c321688ba69f32ae217cc` | `tests/integration/placements-db08-registration.test.ts` |
| Repeatable, fail-on-regression Node source guards | `7c7b74430ce570a273d280c18039798433b01d82` | `tests/db08-learner-live-identity-source.test.mjs` |

## Verification performed

On the exact main-branch file blobs below, 26 programmatic source assertions were evaluated through an isolated JavaScript execution environment and **26 passed**. These are **source-structure checks**, not Node/Vitest execution, database constraint proof or two-session PostgreSQL concurrency evidence.

- `src/modules/placements/learner-participation-guard.ts`: `0228215ef94c2c6d99346d2c72c147a3efd22264`
- `src/modules/placements/application-service.ts`: `7e8c857c75f33aebc8a4c43ff0848373bc18bfd9`
- `src/modules/placements/batch-registration-service.ts`: `962a66cd07f5e766c0753b33df6d4cd8e20a2b44`
- `tests/unit/placement-persisted-learner-access.test.ts`: `14706dd9b82e0112e70dfbc477d39e54e6537355`
- `tests/integration/placements-db08-registration.test.ts`: `a23fdb3c49d19dafa259d8b245a792ad0432b894`
- `tests/db08-learner-live-identity-source.test.mjs`: `573c452eb5953c93e706609df57abb3a06fb804c`

The connected GitHub source was readable and writable, but this execution environment had no network path for cloning the repository and no disposable PostgreSQL or Docker executable. Therefore no native `npm test`, TypeScript typecheck, build or real PostgreSQL tests are asserted as passed here. GitHub Actions is intentionally paused for billing and is not required for independent verification.

## Reproduce on an executable checkout

```bash
npm ci
node --test tests/db08-learner-live-identity-source.test.mjs
npx vitest run tests/unit/placement-persisted-learner-access.test.ts
# Execute the existing DB08-B integration suite ONLY after disposable DB08-A/B
# migrations and its existing explicit isolated environment guards are satisfied:
npx vitest run --config vitest.db.config.ts tests/integration/placements-db08-registration.test.ts
```

## Remaining gates and important limits

- Run the unit suite and the DB08-B PostgreSQL suite on a known disposable database, preserve commands and logs pinned to the latest tested commit.
- Add two-connection race witnesses for concurrent account disable, membership suspension and role removal versus application create/withdrawal/registration.
- A read-authorization check does not lock the account for every subsequent downstream read. Its outcome may become stale after the check; protect any later sensitive write with the transaction-scoped persisted identity locks. Paid-module policy writes are not yet guaranteed to serialize with registration's earlier module-access preflight; this remains an independent race gap.
- Never mark the DATABASE phase or a completed-but-unverified task `DONE_VERIFIED` based on these source assertions alone. All original core-eleven blockers must remain honestly tracked.

**Task ownership:** no active queue item was stolen, and migration journal/schema-barrel files were not modified.
