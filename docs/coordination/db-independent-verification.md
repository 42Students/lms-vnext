# CI-independent PostgreSQL verification

**Purpose:** execute DATABASE acceptance without GitHub Actions. GitHub Actions is intentionally unused because of billing; this workflow is the supported local/ephemeral replacement.

## Canonical command

From a clean checkout of the exact commit being verified:

```bash
npm ci
npm run db:verify:independent
```

By default the verifier starts a disposable `postgres:17-alpine` container on a random localhost port, creates a unique `lms_vnext_test_<pid>` database, runs the database gates, records evidence, and removes the container.

Requirements for the default mode:

- Node 22.x
- npm
- git
- Docker with a running daemon
- repository dependencies installed with `npm ci`

The verifier does **not** invoke GitHub Actions.

## Existing disposable PostgreSQL instead of Docker

A worker may provide an already isolated PostgreSQL database:

```bash
TEST_DATABASE_URL='postgresql://user:password@127.0.0.1:5432/lms_vnext_verify' \
DATABASE_URL='postgresql://user:password@127.0.0.1:5432/lms_vnext_verify' \
npm run db:verify:independent
```

For a deliberately disposable **non-local** database, both reset gates must be satisfied:

- set `DB01_REMOTE_TEST_DATABASE_CONFIRM=RESET:<host>/<database>` for the exact disposable target;
- set `ALLOW_DB_RESET=true` so the lower-level reset helper permits a non-local host.

The database name must still satisfy the explicit test-target naming policy. Never set either override for shared, staging, production, or any database that contains data that must survive. The destructive prepare subprocess receives `TEST_DATABASE_URL` only; `DATABASE_URL` is intentionally removed for that step so an application target can never substitute for the disposable target.

## Gates executed

The verifier runs, in order:

1. `npm run db:journal:verify`
2. `npm run db:test:prepare` — destructive reset of the disposable database, zero-to-head migration replay, seed
3. `npm run db:migrate` — migration idempotence/smoke
4. `npm run test:db:parity`
5. `npm run test:db` with `DB03_ISOLATED_TEST_DATABASE=1`

A non-zero exit from any step fails the verifier. Later gates are not claimed as passed.

## Evidence

Each run writes JSON under:

```text
.verification/db-independent-<timestamp>.json
```

The directory is git-ignored. The evidence records:

- exact git SHA;
- Node/npm versions;
- provider mode and PostgreSQL/Docker details when available;
- exact command for every gate;
- start/end time and exit status;
- SHA-256 of command output plus a bounded output tail;
- whether the whole run passed;
- `githubActionsUsed: false`.

For durable queue evidence, copy the relevant run summary into the worker checkpoint / queue task and reference the exact source SHA. Do not mark `DONE_VERIFIED` from an authored script or a failed/preflight-only run.

## Current hosted ChatGPT runtime limitation

A ChatGPT execution environment may have Node but no Docker daemon, no `psql`, and no shell network access to clone the repository. That environment can author/review this harness but cannot manufacture PostgreSQL evidence. In that case record `PG_VERIFICATION_PENDING`, complete other source work, and run this command from any approved local/ephemeral environment that meets the requirements above.
