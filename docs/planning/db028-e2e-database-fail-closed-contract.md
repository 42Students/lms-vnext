# DB-028 — fail-closed browser E2E database preparation

**Phase:** DATABASE  
**Restriction:** CORE_INFRA / Chat 1  
**Observed:** 2026-10-11 IST  
**Status:** source implementation complete; Node/PostgreSQL execution not claimed

## Gap

`scripts/db-e2e-prepare.ts` accepted `E2E_DATABASE_URL`, copied it directly into
`DATABASE_URL` / `TEST_DATABASE_URL`, imported DB-connected modules and then
called `resetDatabase`. Unlike `db:test:prepare`, it did not run the shared
disposable-target preflight first.

A malformed or valuable E2E target could therefore reach the schema-drop path.
This is a separate destructive surface from DB-025 and is tracked independently
rather than reopening the completed DB-025 batch.

## Implemented contract

- Browser E2E targets use the same
  `scripts/db01-test-database-guard.mjs` policy as destructive DB tests.
- Explicit disposable names include `test_*`, `*_test*`, `e2e_*` and
  `*_e2e*`.
- The preflight receives `TEST_DATABASE_URL=E2E_DATABASE_URL` but deletes
  `DATABASE_URL` from the guard subprocess environment, so a configured
  application URL cannot be used as an alias or create a same-target ambiguity.
- The preflight runs before `process.env.DATABASE_URL` is assigned and before
  DB-connected modules are dynamically imported.
- Local disposable targets remain supported.
- Non-local targets still require the exact
  `DB01_REMOTE_TEST_DATABASE_CONFIRM=RESET:<host>/<database>` confirmation and
  the lower-level `ALLOW_DB_RESET=true` remote reset permission.
- Refusal messages do not include URL credentials.

## Regression coverage

`tests/db01-test-database-guard.test.mjs` now contains DB-028 cases that:

1. accept an explicitly named local `*_e2e` target;
2. assert the preflight is ordered before application-URL assignment/import/reset;
3. assert the shared guard script is reused;
4. assert the guard subprocess does not receive `DATABASE_URL`;
5. spawn the E2E preparation entrypoint with a production-like database name and
   assert refusal occurs before a connection error and without leaking the
   password.

The same test file is already included in the canonical
`npm run test:db:parity` command.

## Source acceptance performed in this chat

A read-only current-main source audit checked 12 invariants across:

- `scripts/db-lib.ts`
- `scripts/db01-test-database-guard.mjs`
- `scripts/db-test-prepare.ts`
- `scripts/db-e2e-prepare.ts`
- `scripts/db-independent-verify.mjs`
- `tests/db01-test-database-guard.test.mjs`
- `package.json`

Result: **12/12 source invariants true**.

This was connector/in-process source inspection, **not** execution of the Node
test file and **not** PostgreSQL verification. Do not mark DB-028
`DONE_VERIFIED` from this evidence.

## Remaining acceptance

On an approved executable checkout:

```bash
npm ci
node --test tests/db01-test-database-guard.test.mjs
```

Then, for real DB acceptance, use only a disposable E2E/test database and prove
that the destructive prepare succeeds on that target while production-like,
same-application and unconfirmed remote targets fail closed.
