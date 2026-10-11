# DB-025 — fail-closed destructive test database target

**Phase:** DATABASE  
**Restriction:** CORE_INFRA / Chat 1 writer  
**Status:** implementation complete on main; disposable PostgreSQL acceptance still pending  
**Observed main source:** `scripts/db-lib.ts` blob `3cdd218eecac83c85d46dcf25d92bec416ee2b26`

## Problem

`scripts/db-test-prepare.ts` calls:

```ts
requireDatabaseUrl("TEST_DATABASE_URL")
```

but the shared helper currently implements:

```ts
const fallback =
  variableName === "TEST_DATABASE_URL"
    ? process.env.DATABASE_URL
    : undefined;
const value = direct ?? fallback;
```

The returned URL is passed to `resetDatabase`, which drops the `drizzle` and
`public` schemas before migrating/seeding.

Therefore an operator who runs:

```bash
DATABASE_URL=... npm run db:test:prepare
```

with no `TEST_DATABASE_URL` can target the application database. The
independent DB verifier does not trigger this bug because it explicitly sets
both variables to the disposable target, but the shared destructive command
remains fail-open.

Chat 2's `db01-test-database-guard.mjs` already proves the desired conservative
target policy, but it is manually invoked and does not protect the shared
command.

## Required implementation behavior

1. `requireDatabaseUrl("TEST_DATABASE_URL")` MUST read only
   `TEST_DATABASE_URL`; it must never fall back to `DATABASE_URL`.
2. Normal application commands calling `requireDatabaseUrl("DATABASE_URL")`
   continue to use `DATABASE_URL`.
3. `db:test:prepare` must refuse before any PostgreSQL connection if
   `TEST_DATABASE_URL` is absent, even when `DATABASE_URL` is populated.
4. Preserve the independent verifier:
   - Docker mode resolves a disposable URL and exports both variables;
   - provided URL mode exports both variables to the same explicit test target.
5. A test target must remain protected by reset safety:
   - reject `postgres`, `template0`, `template1`;
   - local disposable target is allowed;
   - remote reset requires an explicit deliberate disposable confirmation;
   - do not print credentials in error/evidence output.
6. The chosen implementation should avoid two divergent definitions of
   “safe test target.” Prefer one reusable helper or make the destructive
   command invoke an equivalent shared policy.

## Acceptance tests — no PostgreSQL required

At minimum execute these process/helper regressions:

### DB25-01 — omission is fatal

Environment:

- `DATABASE_URL=postgresql://.../valuable_app_db`
- no `TEST_DATABASE_URL`

Expected:

- `npm run db:test:prepare` (or the underlying entrypoint) exits non-zero;
- error says explicit TEST_DATABASE_URL is required;
- failure occurs before any network/DB reset attempt.

### DB25-02 — explicit local test target resolves

`TEST_DATABASE_URL=postgresql://...@127.0.0.1/lms_vnext_test`

Expected target is exactly that URL; no fallback or substitution.

### DB25-03 — application URL cannot substitute

Set only `DATABASE_URL` to a syntactically valid local test-looking DB.
Expected: still refuse because TEST_DATABASE_URL is absent.

### DB25-04 — independent verifier compatibility

Static/behavioral evidence must show
`scripts/db-independent-verify.mjs` exports an explicit
`TEST_DATABASE_URL` before invoking `db:test:prepare`.

### DB25-05 — no secret leakage

Refusal and target-summary messages must not contain username/password.

## PostgreSQL acceptance

After DB-001's disposable PostgreSQL environment is actually available:

1. run the independent verifier on an explicit disposable test database;
2. prove DB25 fail-closed regression first;
3. replay/reset only that disposable target;
4. capture exact source SHA + command/output evidence.

DB-025 implementation completion is distinct from PostgreSQL phase verification:
source tests can complete this safety patch, but DB-001/DB-018 still need real
database execution before they are `DONE_VERIFIED`.

## Coordination

DB-020 now depends on DB-025 so final DATABASE certification cannot bypass this
destructive-command safety gate.

Chat 5 discovered/documented this gap. Chat 1 implemented the fail-closed helper and destructive-entrypoint preflight on main; peer work additionally isolated the independent verifier's destructive environment. Source/no-DB safety evidence is recorded in `docs/planning/db025-local-safety-test-evidence.md`. PostgreSQL acceptance remains separate.
