# 2026-11-04 — RLS write-boundary security hardening (pending executed PG17 acceptance)

**Repository:** `42Students/lms-vnext` · `main`  
**Code commits:** [write-policy classifier](https://github.com/42Students/lms-vnext/commit/8f9cf51d590007a42bf9184a977d89b51e7bbf84), [applicable-policy SQL](https://github.com/42Students/lms-vnext/commit/268f45381e1bf43412230bd7648989d23119792d), [unit cases](https://github.com/42Students/lms-vnext/commit/2569e655005070594037deadbff26853d905b7e3), [PG17 write witness](https://github.com/42Students/lms-vnext/commit/deb7d279870727db59d331077b0535ed4798f875), [CI gate](https://github.com/42Students/lms-vnext/commit/54ccfa78c5fdc0e5d9cf84cb6d44d38be4813e4a).

**Acceptance status: NOT VERIFIED.** First [targeted GitHub Actions run](https://github.com/42Students/lms-vnext/actions/runs/41835195619) ended in FAILURE, with no job steps recorded by the runner. The run does **not** prove tests passed or failed; the checked-in code must be executed successfully on a working disposable PG17 runner. Other workflows near that timestamp also report failure with zero recorded steps, so this cannot safely be attributed to the SQL, test code, or a specific infrastructure cause without new evidence. **No security control is closed by this receipt.**

## Changed security behavior — read-only scanner, actual runtime principal

The existing `scripts/security/pg-rls-readonly-audit.mjs` already examined privileged PostgreSQL application roles, direct-tenant `SELECT USING(true)` policies, views and definer routines. The new code interrogates `pg_catalog.pg_policy` and `has_table_privilege` for four **distinct write authorization conditions**:

1. `APP_UNSCOPED_PERMISSIVE_INSERT`: application-granted `INSERT` with unconditional permissive `WITH CHECK(true)` and no substantive applicable restrictive new-row policy.
2. `APP_UNSCOPED_PERMISSIVE_UPDATE_USING`: application-granted `UPDATE` can reach old rows under an unconditional permissive `USING(true)`, without a substantive restrictive old-row policy. This does **not** imply it can always bypass a separately applicable SELECT policy.
3. `APP_UNSCOPED_PERMISSIVE_UPDATE_CHECK`: application-granted `UPDATE` has unguarded new-row `WITH CHECK(true)` even when old rows may be scoped, allowing potential cross-tenant reassignment.
4. `APP_UNSCOPED_PERMISSIVE_DELETE`: application-granted `DELETE` can reach old rows under unconditional permissive `USING(true)`, without a substantive applicable restrictive old-row policy.

The SQL handles `polcmd` values `*`/specific command, public and inherited role applicability, permissive OR vs restrictive AND behavior, an explicit `WITH CHECK` overriding the implicit `USING` fallback for `ALL` and `UPDATE`, and restrictive `true` no-ops. It examines **metadata only**; no production table row data is read or modified.

## Added adversarial executable acceptance

- `tests/security-pg-rls-catalog.test.mjs`: five new unit cases cover unsafe INSERT/UPDATE old/UPDATE new/DELETE, no-op restrictive conditions, legitimate scoped writes and absent app grants.
- `tests/security-pg-rls-live-writes.test.mjs`: a local PostgreSQL 17 fixture creates a genuinely restricted, non-owner, non-BYPASSRLS app role and eight tenant tables. It deliberately makes unsafe inserts, updates of another college's original row, reassignment of an owned row to another college, and deletion of another college's row possible, then asserts the scanner flags those specific write cases. It also expects a correctly scoped `FOR ALL USING ... WITH CHECK ...` policy to reject cross-tenant writes, permits an own-college write and cleans up the role, tables and all uncommitted fixture changes.
- `.github/workflows/security-rls-policy-auditor.yml`: exact-source commit, existing read witness, new write witness and policy classifier all execute on `postgres:17-alpine`. The fixture refuses to run unless `SECURITY_RLS_DISPOSABLE=1` and the PostgreSQL URL is precisely local `/lms_vnext_rls_test`.

This implementation is an **adversarial detection and release-verification mechanism**, not a production RLS policy migration. It does not make a vulnerable production database secure without reviewing and fixing the *actual* policies.

## Outstanding blocker and next acceptance

1. Obtain a GitHub Actions run that actually starts steps. The failed job above exposed zero steps, so it cannot be used as evidence.
2. Require **both** unit suite and actual disposable PostgreSQL 17 read/write SQL witness to pass, and inspect the exact job logs for parser/SQL/role errors.
3. Run the auditor through a separately authorized **read-only** connection under the **real production app database role** without printing credentials or tenant rows.
4. Implement scoped `USING` and `WITH CHECK` policies for each actual protected table, verify correct privilege grants, affected inherited roles, `FORCE ROW LEVEL SECURITY` requirements, SQL-owner bypass and multi-tenant read/write denial.
5. Add production-equivalent fixtures and independently review the relevant 493 security requirements before marking them `VERIFIED`.

**Security tracker:** Leave `SEC-06-007` (and other unassessed RLS-write controls) unassessed until test execution. In particular do not mark `SEC-06-006` or `SEC-23-015` fully verified from fixture-only proofs. The 493-control canonical tracker is `docs/tracker.json`.

**Authoritative semantics:** PostgreSQL 17 `CREATE POLICY` documentation distinguishes `USING` on existing rows, `WITH CHECK` on inserted/updated rows, default fallback, permissive OR and restrictive AND; separate SELECT policies can also limit mutations that require SELECT privilege.

## Subsequent deployment hardening — privileged runtime database roles

The application readiness path `src/db/client.ts::checkDatabaseConnection` now fails closed **only when both `NODE_ENV=production` and `APP_ENV=production`** if the connected runtime principal is privileged. This is a real production deployment gate, not merely an audit report. The generic error `DATABASE_APP_PRINCIPAL_UNSAFE` does not print connection strings, usernames or tenant rows.

The policy in `src/db/runtime-principal-policy.ts` requires positive false results for:

- Superuser, BYPASSRLS, CREATEROLE and CREATEDB role attributes.
- CREATE capability in any nonsystem schema or the current database, including through a role reachable by `SET ROLE`.
- Any privileged role reachable through `SET ROLE` by the login principal.
- Effective ownership or `SET ROLE` access to the owner of a direct tenant-key table whose row security is not both **enabled and forced**.
- `TRUNCATE` on a direct tenant-key table, including through roles the login can `SET ROLE` to. PostgreSQL RLS does **not** restrict `TRUNCATE`, even on otherwise correctly secured tables.

The catalog checks are read-only, operate on the live connection, and precede the existing schema readiness check. Newly added `tests/unit/security-production-database-principal.test.ts` includes a deny matrix for each privilege and missing/unknown catalog values. The RLS fixture now contains an intentionally unsafe TRUNCATE grant on a FORCE RLS table and expects both a detection finding and an actual cross-tenant destructive operation before rolling back.

**Execution remains pending** while GitHub-hosted workflows are failing with zero step output. A successful exact-SHA disposable PostgreSQL witness, typecheck and production-like app-role exercise are required before claiming this batch is accepted. The gate is **not** a substitute for all-table RLS enablement, tenant graph lineage, grants review or independent review of SECURITY DEFINER routines.

**Relevant PostgreSQL 17 specifications:** `CREATE POLICY`, `SET ROLE`, `Row Security Policies`. In production deployment, rotate/migrate away from privileged database credentials before enabling `APP_ENV=production`; never disable the gate merely to make health checks green.
