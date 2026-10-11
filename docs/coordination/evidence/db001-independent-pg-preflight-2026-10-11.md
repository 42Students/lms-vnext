# DB-001 independent PostgreSQL preflight — 2026-10-11

**Purpose:** record actual hosted-runtime capability while moving DATABASE verification off GitHub Actions.

**Repository head observed through connected GitHub:** `e6d32ba73397c93c916a9c4aecb0506c0661df58`

GitHub Actions was intentionally not used.

## Executed preflight

Command shape:

```bash
node --version
npm --version
command -v docker
command -v psql
git ls-remote https://github.com/42Students/lms-vnext.git HEAD
```

Actual output from the current hosted execution environment:

```text
v22.16.0
NODE_EXIT=0
10.9.2
NPM_EXIT=0
DOCKER_EXIT=1
PSQL_EXIT=1
GIT_LS_REMOTE_EXIT=128
fatal: unable to access 'https://github.com/42Students/lms-vnext.git/': Could not resolve host: github.com
```

## Interpretation

- Node 22 and npm are available.
- Docker is not installed in this runtime.
- `psql` is not installed in this runtime.
- The shell cannot resolve `github.com`, so it cannot clone/materialize the repository from GitHub.
- Therefore this specific hosted runtime cannot execute the disposable PostgreSQL verifier.
- This is **not** a GitHub Actions/billing blocker and does not block source work.
- Acceptance remains `PG_VERIFICATION_PENDING` until `npm run db:verify:independent` runs on an approved environment with either Docker or a disposable `TEST_DATABASE_URL`.

The repository now contains the CI-independent harness and runbook; no PostgreSQL pass is claimed by this preflight.
