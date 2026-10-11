# DB01 disposable PostgreSQL test preflight — CI independent

**Worker:** Chat 2 · **Task:** DB-004 · **Global phase:** DATABASE  
**State:** preflight code and isolated Node tests **EXECUTED**; real PostgreSQL replay **NOT EXECUTED**.

## Critical shared helper hazard

At the inspected `main` revision (2026-10-11), `scripts/db-test-prepare.ts` calls `requireDatabaseUrl("TEST_DATABASE_URL")` in `scripts/db-lib.ts`, but the shared helper falls back to `process.env.DATABASE_URL` when `TEST_DATABASE_URL` is missing. `db:test:prepare` resets and seeds schemas. **Never run it against a valuable application database.** Chat 1 is the sole writer for `scripts/db-lib.ts` and must remove the fallback globally; DB01's guard does not change the unsafe shared helper.

The user's GitHub Actions CI is disabled by billing. This **does not block coding or alternative execution**. It is still forbidden to claim PostgreSQL acceptance without running migrations and negative tests.

## Independently executable safety gate

Added:
- `scripts/db01-test-database-guard.mjs`
- `tests/db01-test-database-guard.test.mjs`

The preflight refuses to proceed unless all conditions hold:
1. `TEST_DATABASE_URL` is explicitly provided. No fallback to `DATABASE_URL`.
2. Scheme is `postgres:` or `postgresql:`, and the database has an explicit `test_` prefix or `_test` suffix/suffixed test token.
3. The effective host/port/database combination differs from any configured `DATABASE_URL`, even if usernames/passwords differ.
4. Non-local hosts require an independent exact target confirmation `DB01_REMOTE_TEST_DATABASE_CONFIRM=RESET:<host>/<dbname>`. No blanket remote allow.
5. Database names have no extra path segments; errors and success output do not print credentials.

This guard performs **zero network/database operations**. Passing proves only that the selected destination meets conservative syntactic safety checks, not that it is disposable, empty, or securely isolated; the operator must verify those facts independently. It is a manually invoked guard until Chat 1 hardens the shared test helper.

### Safe local invocation

```bash
export TEST_DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:5432/lms_vnext_test'
node scripts/db01-test-database-guard.mjs
node --test tests/db01-test-database-guard.test.mjs

# Only after checking that the target is disposable:
npm run db:test:prepare

# Once PR #65's authored tests are integrated in the chosen checkout:
npx vitest run --config vitest.db.config.ts \
  tests/integration/db01-tenant-identity-invariants.test.ts \
  tests/integration/db01-identity-fk-invariants.test.ts
```

Do not run `npm run db:test:prepare` if `TEST_DATABASE_URL` is unset, even if `DATABASE_URL` is set. Do not assume the PR #65 tests exist on `main` while the pull request is still open.

## Executed proof: independent Node 22 runner

Execution date: **2026-10-11**  
Engine: `node v22.16.0`.  
Invocation: `node --test /mnt/data/db01_guard_probe/tests/db01-test-database-guard.test.mjs`.  
The probe folder contained exact GitHub-file copies, *verified by comparing `git hash-object` to the blobs returned by GitHub's current-main fetch*:

| Repo file | Git blob SHA-1 (actual byte equality) |
| --- | --- |
| `scripts/db01-test-database-guard.mjs` | `26aa7f1eb056ca5f684eda6cf5bcf595315fb66b` |
| `tests/db01-test-database-guard.test.mjs` | `ea962cdc855f8fd1e6eaf228e3be9bcc090cba2e` |

Runner reported `1..8`, **8 tests, 8 passed, 0 failed, 0 skipped**. A separate CLI invocation with no explicit `TEST_DATABASE_URL` exited with a refusal message; an example local test URL passed preflight without a DB connection.

**Scope limit:** this is executable safety-preflight test evidence, **not** a PostgreSQL migration replay, runtime tenant/identity proof, CI success or DB01 parity. No task marked `DONE_VERIFIED` by this evidence.

### Chat 1 required follow-up

- Remove the dangerous `TEST_DATABASE_URL -> DATABASE_URL` fallback from `scripts/db-lib.ts`.
- Add its own regression proving `db:test:prepare` never opens `DATABASE_URL` as a fallback.
- Integrate the guard into approved DB01 disposable-db command or add equivalent preflight to the shared DB testing pipeline.
- Continue generated Drizzle migration work separately; this guard does not grant Chat 2 migration-file ownership.
