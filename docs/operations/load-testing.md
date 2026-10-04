# Read-load testing

LMS vNext has a small, dependency-free load harness for the authenticated read paths that are expected to become hot first.

It intentionally starts with read-only traffic. Mutation/load scenarios should only be added when a disposable environment and cleanup strategy exist.

## Covered mixes

`learner`:
- course delivery list
- project list
- placement job feed
- notifications

`operations`:
- activity center
- TPO operational command center
- departments
- notifications

`mixed` runs both groups and is the default.

The local/dev E2E identity harness is permitted only outside production. Production-like runs must use a real approved test account/session.

## Local/dev run

Prepare the deterministic database and start the app with the E2E auth harness enabled:

```bash
npm run db:test:prepare
E2E_AUTH_ENABLED=true \
E2E_AUTH_SECRET=0123456789abcdef0123456789abcdef \
npm run dev
```

Then, in another shell:

```bash
E2E_AUTH_SECRET=0123456789abcdef0123456789abcdef \
npm run test:load:reads -- http://127.0.0.1:3000
```

The harness warms every selected target before beginning measurement so route compilation/startup does not silently count as steady-state latency.

## Production-like authenticated run

Do not enable the E2E bypass in production. Supply an approved session cookie through the environment instead:

```bash
LOAD_PROFILE=learner \
LOAD_COOKIE='lms_session=...; lms_membership=...' \
npm run test:load:reads -- https://example.invalid
```

Keep `LOAD_PROFILE` aligned with the privileges of the supplied session. Never commit or print `LOAD_COOKIE`.

## Controls

- `LOAD_PROFILE`: `learner`, `operations`, or `mixed` (default `mixed`)
- `LOAD_DURATION_MS`: measured duration, default `15000`
- `LOAD_CONCURRENCY`: concurrent workers, default `8`
- `LOAD_REQUEST_TIMEOUT_MS`: per-request timeout, default `10000`
- `LOAD_MAX_P95_MS`: p95 latency gate, default `750`
- `LOAD_MAX_ERROR_RATE`: accepted error ratio, default `0.01`
- `LOAD_BASE_URL`: alternative to the positional base URL
- `LOAD_COOKIE`: explicit authenticated cookie for production-like runs

The command exits non-zero when either the error-rate or p95 threshold is exceeded and emits one structured JSON result with overall and per-target metrics.

## Production-readiness closure

The harness itself does not close the production-readiness load-test item. Before launch:

1. run against the production-shaped Cloud Run + Cloud SQL environment;
2. use approved non-human test identities;
3. record concurrency, dataset shape, p50/p95/p99, error rate, Cloud Run CPU/memory/concurrency, and Cloud SQL CPU/connections/query latency;
4. inspect the slowest endpoint before raising thresholds;
5. repeat after any performance fix;
6. store the baseline in the launch evidence/runbook.

Do not add Redis, queues, replicas, or a second datastore merely to improve a synthetic number. Optimize measured queries and indexes first.
