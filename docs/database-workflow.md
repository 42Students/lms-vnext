# Database workflow

> **Mandatory closure-first database operating rule (2026-10-31):**
> Before editing migrations, read `AGENTS.md` and the sole
> `docs/tracker.json.execution.closureFirstProtocol`; run
> `npm run progress -- --closure-next`. Choose ONE OPEN task,
> name its exact missing registered PostgreSQL / tenant / privacy / state /
> race / producer-to-consumer acceptance gate, and close that gate before
> revisiting other audits. After two passes with no accepted task, record the
> exact failing witness, independently verify any numbered migration,
> and switch to another independent OPEN
> item. Never mark staging SQL or a green source test as registered migration
> proof. Only `docs/tracker.json` changes N/81 after exact-SHA executed
> acceptance. Existing disposable-target and no-prod-write protections remain
> fully in force.

vNext uses one PostgreSQL database with Drizzle migrations as the canonical schema history.

## Local PostgreSQL

Start the lightweight local database:

```bash
docker compose -f compose.db.yml up -d
```

Default local connection:

```text
postgresql://postgres:postgres@localhost:5432/lms_vnext
```

Set `DATABASE_URL` in your shell before running database scripts.

PowerShell example:

```powershell
$env:DATABASE_URL="postgresql://postgres:postgres@localhost:5432/lms_vnext"
```

## Commands

```bash
npm run db:migrate
npm run db:seed
npm run db:reset
```

- `db:migrate`: apply committed migrations
- `db:seed`: idempotently apply deterministic development seed records **only after target authorization**
- `db:reset`: drop disposable schemas, re-run migrations, and reseed

Reset refuses PostgreSQL system databases and target-changing URL query parameters.

**Localhost is not automatically disposable.** Cloud SQL Auth Proxy and similar tunnels also present as `localhost`/`127.0.0.1`.

- Explicitly test/E2E-named local databases such as `lms_vnext_test`, `lms_vnext_test_4242`, or `lms_vnext_e2e` remain frictionless.
- Any other local database requires exact `DB_RESET_CONFIRM=RESET:<host>:<port>/<database>`.
- A non-local reset requires both `ALLOW_DB_RESET=true` **and** the exact `DB_RESET_CONFIRM` token.
- Omitted PostgreSQL ports normalize to `5432`.

The confirmation string contains no username/password. Never set these overrides for staging, production, shared databases, or data that must survive.

### Local development reset example

The default development database is named `lms_vnext`, so a destructive reset must be explicitly confirmed:

```bash
DATABASE_URL='postgresql://postgres:postgres@localhost:5432/lms_vnext' \
DB_RESET_CONFIRM='RESET:localhost:5432/lms_vnext' \
npm run db:reset
```

If the URL uses `127.0.0.1`, the confirmation must also use `127.0.0.1`; the token matches the parsed target exactly.

### Remote disposable reset example

For a deliberately disposable remote database such as `pg.test.internal:5432/lms_vnext_test`:

```bash
DATABASE_URL='postgresql://user:password@pg.test.internal:5432/lms_vnext_test' \
ALLOW_DB_RESET=true \
DB_RESET_CONFIRM='RESET:pg.test.internal:5432/lms_vnext_test' \
npm run db:reset
```

The target confirmation is deliberately separate from the URL so accidentally exporting a valuable `DATABASE_URL` is not enough to authorize schema destruction.

## Seed target safety (DB-055)

The deterministic seed upserts fixed identity and SUPER_ADMIN fixture IDs. Merely
having `DATABASE_URL` set is **not** consent to change a valuable database.
`seedDatabase` validates the target **before opening any database connection**;
it rejects malformed/redirectable URLs and system database names.

- Local explicitly named test/E2E databases (`lms_vnext_test`, `lms_vnext_e2e`) can seed directly.
- For other local direct seeds, set exact
  `DB_SEED_CONFIRM=SEED:<host>:<port>/<database>`.
- For remote direct seeds, require **both** `ALLOW_DB_SEED=true` and that
  exact `DB_SEED_CONFIRM` token; never do this for production.
- A deliberate reset followed by a seed can reuse its **exact**
  `DB_RESET_CONFIRM=RESET:<host>:<port>/<database>`. Remote reset still
  requires `ALLOW_DB_RESET=true`. Merely setting `ALLOW_DB_SEED` does not
  authorize schema destruction.
- Example local development seed:

```bash
DATABASE_URL='postgresql://postgres:postgres@localhost:5432/lms_vnext' \
DB_SEED_CONFIRM='SEED:localhost:5432/lms_vnext' \
npm run db:seed
```

Do not put credentials in confirmation strings, and do not seed shared/staging/
production data. The CLI guard and library-level guard share the same
`seedDatabase` enforcement; test/E2E and reset callers are also covered.

## Test database

Use a separate database such as `lms_vnext_test`.

PowerShell example:

```powershell
$env:TEST_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/lms_vnext_test"
npm run db:test:prepare
npm run test:db
```

`db:test:prepare` resets, migrates and seeds the test database. Integration tests prove critical uniqueness, check and foreign-key behavior against real PostgreSQL.

## Deterministic seed

The seed includes:

- one organization
- two active colleges
- one SUPER_ADMIN user
- one college admin in College A
- one learner in College A
- one faculty user with active memberships in both colleges
- departments in both colleges
- learner/faculty profile examples

The two-college faculty scenario exists specifically to exercise cross-college isolation and membership switching.

## Creating a migration

1. change Drizzle schema files
2. run `npm run db:generate`
3. inspect the generated SQL and snapshot metadata
4. verify indexes, partial unique indexes, checks and FK delete behavior
5. reset a disposable DB with `npm run db:reset`
6. run `npm run test:db`
7. commit schema + migration SQL + `drizzle/meta` together

Do not hand-edit migration snapshots. Once a migration has been shared/applied outside a disposable local environment, create a new migration instead of rewriting history.

## CI

CI provisions an ephemeral PostgreSQL service, prepares the database from committed migrations, applies deterministic seed data, runs DB integration tests, and then builds the application.

This keeps schema-only TypeScript tests from being the sole protection against real PostgreSQL behavior.
