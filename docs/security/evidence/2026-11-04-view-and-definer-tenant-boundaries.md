# Database privilege-boundary hardening — 2026-11-04

**Scope:** vNext main, read-only PostgreSQL runtime-role catalogue and disposable PG17 witness. **Status:** source changes committed; updated tests NOT yet executed; not production RLS certification. Canonical status remains `docs/tracker.json`. Controls: SEC-06-001, SEC-06-004, SEC-06-010, SEC-06-012, SEC-06-013, SEC-07-019.

## Implemented

- `scripts/security/pg-rls-readonly-audit.mjs`: inventory tenant-key tables across all accessible non-system schemas, including schema-qualified finding names; report accessible owner-rights PostgreSQL views, materialized views and executable `SECURITY DEFINER` routines separately as requiring review. `security_invoker=true` views are not automatically flagged as owner-rights views. Security warnings are review obligations, **not** confirmed vulnerabilities.
- `tests/security-pg-rls-catalog.test.mjs`: classifier assertions for owner-rights views, invoker views, materializations, definers, executable grants and non-public schema names.
- `tests/security-pg-rls-live-readonly.test.mjs`: disposable localhost PG17 fixture with a restricted app role; deliberately demonstrates how a privileged view/materialization/definer routine can expose tenant B records although direct table RLS protects them, and checks an invoker-rights view respects tenant context. Destructive fixture setup is guarded to localhost-only `lms_vnext_rls_test` and must never be used on production.

**Code commits:** [eb9a300d](https://github.com/42Students/lms-vnext/commit/eb9a300d91297a11709aa4f2c8f38399ea0cac9d), [6d731047](https://github.com/42Students/lms-vnext/commit/6d73104792ba820952b005c38b51e40b1d9f1b46), [26f84c61](https://github.com/42Students/lms-vnext/commit/26f84c61468fc4e578c2c7ef363b2d88f9bd3b26), [01b6180b](https://github.com/42Students/lms-vnext/commit/01b6180b620224f4549719a8b51c13734a7fef72), [7cc277dc](https://github.com/42Students/lms-vnext/commit/7cc277dc86035017d17e75c84169a317620a4e4e).

**Post-evidence fixture correction:** [3db7994d](https://github.com/42Students/lms-vnext/commit/3db7994d6adb85caef81815dd4e52fd49d60d0d) corrected the SQL-language function's quoted body in the PG17 test fixture. This makes the test code ready for re-execution; it does not retroactively validate any tests.

## Verification and release disposition

The [RLS workflow on 7cc277dc (41832703600)](https://github.com/42Students/lms-vnext/actions/runs/41832703600) concluded FAILURE with **zero steps and no assigned runner** (`runner_id=0`). Neither tests nor code ran there. Do not call this a test failure or a pass. GitHub Actions infrastructure/billing/runner availability must be verified independently. Earlier [successful run 41809840139](https://github.com/42Students/lms-vnext/actions/runs/41809840139) covered only the **previous** auditor version.

Execute on a configured PG17 CI runner:

```sh
node --test tests/security-pg-rls-catalog.test.mjs
SECURITY_RLS_DISPOSABLE=1 TEST_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/lms_vnext_rls_test node --test tests/security-pg-rls-live-readonly.test.mjs
```

That PostgreSQL URI is a **test fixture**, not a production credential. For actual acceptance, run the read-only auditor securely against the **real restricted runtime login** without logging credentials, independently review all view/routine ownership and grants, and perform cross-tenant SELECT/INSERT/UPDATE/DELETE, grant revocation, same-college horizontal, and pool-reuse tests against production-like RLS configuration. The application database role must not be superuser, owner-bypass, or BYPASSRLS. No `done:true` change or release approval is justified by this patch alone.
