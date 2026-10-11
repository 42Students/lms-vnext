# DB-051 localhost/proxy reset safety evidence

**Observed:** 2026-10-11 IST  
**Task:** DB-051 — fail-close localhost/proxy destructive database reset ambiguity  
**Status:** source/no-network safety complete; no PostgreSQL reset/replay claimed.

## Current contract

A loopback hostname is not proof that the actual database is disposable because Cloud SQL Auth Proxy and similar tunnels can present a remote database as `localhost` / `127.0.0.1`.

The shared reset helper now applies this policy:

- PostgreSQL system database names are refused case-insensitively.
- URL query parameters that can redirect host/port/database are refused.
- Local databases with explicit test/E2E names remain frictionless.
- Other local database names require exact `DB_RESET_CONFIRM=RESET:<host>:<port>/<database>`.
- Remote targets still require `ALLOW_DB_RESET=true` plus the same exact `DB_RESET_CONFIRM`.
- The default PostgreSQL port is normalized to `5432`.
- Confirmation contains no credentials.

The independent verifier's local external-database example now uses `lms_vnext_test_verify`, which remains on the explicit disposable-name branch.

## Executed no-network matrix

An isolated Node 22 safety harness reproducing the current `resetTarget` / `assertResetAllowed` decision logic executed **10/10 passing cases**:

1. local `lms_vnext_test` allowed without confirmation;
2. local `lms_vnext_e2e` allowed without confirmation;
3. local `lms_vnext` refused without confirmation;
4. local `lms_vnext` refused when token uses the wrong loopback spelling;
5. local `lms_vnext` allowed with exact token;
6. remote test target refused without `ALLOW_DB_RESET=true`;
7. remote test target allowed with both exact gates;
8. mixed-case protected `Postgres` refused;
9. `?host=...` target redirection refused;
10. `?dbname=...` target redirection refused.

Result:

```text
PASS local-test
PASS local-e2e
PASS local-dev-no-confirm
PASS local-dev-wrong-host-token
PASS local-dev-exact
PASS remote-no-allow
PASS remote-exact
PASS mixed-system
PASS redirect-host
PASS redirect-dbname
RESULT 10/10
```

This is no-network logic evidence, not an executed repository `tsx` test suite and not PostgreSQL evidence.

## Remaining executable acceptance

The authored process regressions in `tests/db01-test-database-guard.test.mjs` should still execute from a checkout with dependencies installed. PostgreSQL reset/replay remains a separate DATABASE verification gate.
