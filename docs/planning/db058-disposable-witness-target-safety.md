# DB-058 — Fail-closed PostgreSQL witness target guard

**Phase:** DATABASE. **Status:** source implementation completed; independent runtime/PostgreSQL acceptance OPEN.  
**Worker:** Chat 5. **Integration policy:** all commits directly to `main`; no numbered migration/schema barrel changes.

## Confirmed failure mode

The DB-018 negative-SQL and concurrency tests previously treated `TEST_DATABASE_URL` plus an `*_ISOLATED_TEST_DATABASE=1` flag as sufficient. A flag alone cannot distinguish a disposable database from a real application/production target. Those tests execute real SQL writes (some in rollback transactions; concurrent race witnesses use committed fixtures and cleanup). They must **reject unsafe targets before instantiating Pool**, not rely only on a test label or best-effort cleanup.

## Patch

- `tests/support/db018-test-target.mjs` reuses the canonical `scripts/db01-test-database-guard.mjs` target validator. It requires an explicit PostgreSQL `TEST_DATABASE_URL`, a recognized isolation flag, a deliberately named test/E2E database, and exact remote-host+database confirmation before any PostgreSQL connection.
- Service-backed race tests require `DATABASE_URL === TEST_DATABASE_URL` because `getDb()` and raw `pg` clients must never hit different databases.
- An exact `DATABASE_URL` alias of the disposable test URL is accepted **only** with the already existing `DB03_ISOLATED_TEST_DATABASE=1` independent-verifier flag. Such an alias is required when the verifier points service code at its provisioned fixture *after* the guarded reset. All other same-database aliases (including different credentials) remain subject to the canonical guard and are refused.
- Declaration `tests/support/db018-test-target.d.mts` exposes the guard to TS-based Vitest integration tests.
- All five DB18 suites call the guard **before** `new Pool`: observational/negative, registered-direct-negative, concurrency CAS/project, known academics race, and placement access race.
- `tests/db058-witness-target-safety.test.mjs` contains **15 authored** Node built-in regressions: missing URL/flag, production name, incorrect URL scheme, unconfirmed/mismatched remote, exact authorized remote, forbidden ordinary app alias, permitted verifier alias, service URL divergence, different-credentials same target, credential secrecy, and pre-Pool coverage of all five suites.

## What was verified during this connector work

Read-only source assertions checked **13/13 structural requirements**, including every DB18 callsite, pre-Pool ordering, service-bound flags, shared canonical-guard import and the 15-case test declaration count. This is a connector/V8 source audit, **not** a Node/Vitest/PostgreSQL test execution.

### Reproducible executable steps

```sh
node --test tests/db058-witness-target-safety.test.mjs
npm run typecheck
npm run db:verify:independent
```

For the last command, Docker (postgres:17-alpine) or an explicitly approved disposable PostgreSQL target is required. Do **not** pass an application database URL as a test database. Retain actual command output, repository commit, PostgreSQL version, scrubbed target and tests passing/failing before marking DB-058 `DONE_VERIFIED`.

## Separate gaps unchanged

- No real PostgreSQL/CI proof was available in the connector-only authoring runtime. The task remains implementation-completed but unverified.
- DB-018 relational zero-violation observations cannot prove preventive constraints without negative mutations and race schedules.
- DB02 P5-R02 and other source-confirmed concurrency gaps are not repaired by this target guard.
- DB-055 seed-target safety belongs to another active worker; this change does not modify or assert completion of that work.
