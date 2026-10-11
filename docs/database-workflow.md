# Database workflow

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
- `db:seed`: idempotently apply deterministic development seed records
- `db:reset`: drop disposable schemas, re-run migrations, and reseed

Reset refuses PostgreSQL system databases. Localhost resets remain explicit developer operations. A non-local reset requires **both**:

- `ALLOW_DB_RESET=true`;
- `DB_RESET_CONFIRM=RESET:<host>:<port>/<database>` matching the parsed target exactly (default PostgreSQL port is `5432`).

The confirmation string contains no username/password. Never set either override for staging, production, shared databases, or data that must survive.

### Remote disposable reset example

For a deliberately disposable remote database such as `pg.test.internal:5432/lms_vnext_test`:

```bash
DATABASE_URL='postgresql://user:password@pg.test.internal:5432/lms_vnext_test' \
ALLOW_DB_RESET=true \
DB_RESET_CONFIRM='RESET:pg.test.internal:5432/lms_vnext_test' \
npm run db:reset
```

The target confirmation is deliberately separate from the URL so accidentally exporting a valuable `DATABASE_URL` is not enough to authorize schema destruction.

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
