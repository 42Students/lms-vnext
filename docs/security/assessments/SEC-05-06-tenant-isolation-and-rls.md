# SEC-05 tenant isolation and SEC-06 row-level security: code assessment (2026-11-07)

Method: code read only, no tests run, nothing deployed. Not the tracker. Each result becomes a tracker entry after the one CI pass, citing the run that executed the matching tests. Nothing here is VERIFIED. "Not inspected" means exactly that; it is not a pass.

## Changes made in this pass

1. **Public routes run in a named system scope.** `route-core.ts` gets `runInPublicScope`; `route.ts` wires `runAsSystem`. Before, every `auth: "public"` route (about 60: login, public links, webhooks, inbound mail) would have run with no scope and, under enforcement, seen no rows. Now the database session carries `app.system = "public:<route pattern>"`. Consequence to remember: RLS does not narrow these reviewed public routes.
2. **Six public pages that read the database without an actor** now run in a named system scope (`public-page:*`): placements index, public tracker issues, company-join, college-join, external job, HR invite. Same consequence.
3. Already in place, found while reading: authenticated routes run in the actor's scope (`route.ts`); `getCurrentRequestContext()` binds the scope for server components and actions; session/membership bootstrap runs as `auth:resolve-request-context`; internal jobs and webhooks run in a named system scope (`internal-route.ts`, `webhook-route.ts`).

## Facts established

- 112 tenant tables (a `college_id` column); all 112 have the `tenant_isolation` policy (`scripts/rls-tenant-tables.mjs`: missing = 0). CI fails a new one without a policy.
- Policy `app_rls_allows(college_id)` is inert unless `app.rls_mode = 'enforce'` (migration 0333). Variants for two tables with platform-owned rows (0334, narrowed by 0336).
- Pool wrapper applies the scope on checkout and resets it on release; a failed reset destroys the connection. Off unless `DB_TENANT_SCOPE=on` (`tenant-pool.ts`).
- No `SECURITY DEFINER` function and no `search_path` setting in any migration.
- No `FORCE ROW LEVEL SECURITY` in any migration. Table owners are exempt from RLS, so enforcement depends on the runtime role not owning the tables. `runtime-principal-policy.ts` checks superuser, BYPASSRLS, ownership-based bypass and TRUNCATE rights, and fails readiness closed in production.
- Tenant check on every request: `isTenantAccessAllowed` compares the host-derived tenant with the actor's active membership or recruiter grant.

## SEC-06 (26 controls)

| Control | Finding | Proposed state | Missing proof |
|---|---|---|---|
| 001 inventory of tables, owners, grants | `analyse()` inventories tables with `college_id` only; no grants or owner inventory | PARTIAL | Catalog export on dev: owner, grants, RLS flags for every table |
| 002 classify tables | Tenant-owned is derived from `college_id`; user-owned, shared and infrastructure tables are not classified in a document | PARTIAL | Written classification of the non-tenant tables |
| 003 parent-derived tenancy | Tables that inherit tenancy through a parent (no `college_id`) are not in the policy set | GAP (not covered) | List them; add policies via the parent |
| 004 reviewed policies | One generic policy plus two variants | PARTIAL | Per-table review record (rollout doc step 2) |
| 005 RLS enabled | All 112 tenant tables | IMPLEMENTED_UNVERIFIED | Catalog query on dev |
| 006 USING / 007 WITH CHECK | Both clauses present in 0333 | IMPLEMENTED_UNVERIFIED | Acceptance script already covers insert (CI `database` job) |
| 008 per-command behaviour | Acceptance script covers read and insert; update and delete not shown | PARTIAL | Update and delete cases |
| 009 FORCE RLS | Absent | GAP (decision) | Either add FORCE or prove the runtime role never owns the tables on every environment |
| 010 no BYPASSRLS / 011 not superuser | Checked at readiness in production | IMPLEMENTED_UNVERIFIED | Role attributes read on dev |
| 012 runtime vs migration ownership | Policy refuses ownership-based bypass in production | IMPLEMENTED_UNVERIFIED | Dev/prod role layout read |
| 013 / 014 definer functions, search_path | No definer function exists | IMPLEMENTED_UNVERIFIED | Catalog query shows zero |
| 015 trustworthy tenant context | Set only by `runWithTenantScope` / `runAsSystem`, from the server-resolved actor | IMPLEMENTED_UNVERIFIED | Review of `runAsSystem` call sites (now: bootstrap, internal, webhook, public routes, six public pages) |
| 016 pooling cannot leak context | Reset on release, connection destroyed on failure | IMPLEMENTED_UNVERIFIED | Concurrency test |
| 017 client-supplied tenant ID | Scope comes from the actor, never from request input | IMPLEMENTED_UNVERIFIED | Route-by-route review of handlers that accept a `collegeId` |
| 018 settings not enough against SQL injection | Acknowledged in design; defence is parameterised queries plus the runtime role | PARTIAL | SAST/SQL-injection review (SEC-23) |
| 019-024 SQL-level negative tests | Not written beyond the acceptance script | UNASSESSED | Tests, at the CI pass |
| 025 performance | Not measured | UNASSESSED | Dev measurement after switching on |
| 026 incremental rollout and rollback | Runbook exists (`rls-rollout.md`) | PARTIAL | Dev rollout and rollback rehearsal |

## SEC-05 (23 controls)

| Control | Finding | Proposed state | Missing proof |
|---|---|---|---|
| 001 ownership for every tenant table | 112 of 112 | IMPLEMENTED_UNVERIFIED | Check tables without `college_id` (see SEC-06-003) |
| 002 organization vs college tenancy | Both scopes exist in the actor and permission code; RLS policy covers college only | PARTIAL | Organization-level policy decision |
| 003 server-validated active tenant | Host-derived tenant checked against membership on every request | IMPLEMENTED_UNVERIFIED | Negative tests |
| 004 no tenant from request input | Same as SEC-06-017 | PARTIAL | Handler review |
| 005, 006, 008 object ownership, ancestry, mutations | Already PARTIAL in the tracker; depends on per-service checks in the ~1,086 `service-enforced` handlers | PARTIAL | Cross-college tests on every method (the central gap) |
| 007 cross-tenant joins | RLS covers joins once enforced | PARTIAL | Enforcement on dev, join tests |
| 009-010 filters, counts, existence leaks | Not inspected | UNASSESSED | |
| 011 search indexes | No external search index found in a first look | Not inspected | |
| 012 caches | Several modules keep in-memory maps; keys not reviewed for tenant | UNASSESSED | Review of the cache modules |
| 013 jobs scoped by verified tenant | Jobs run as named system scope; per-job tenant selection not reviewed | PARTIAL | Review each scheduler |
| 014, 015 storage, reports, exports | Tracker PARTIAL; exports now need step-up | PARTIAL | Storage namespace audit |
| 016 real-time channels | `notifications/stream` route: bearer in query refused, class-stream authorization module exists | PARTIAL | Cross-tenant subscribe test |
| 017 Host-header mismatch | `isTenantAccessAllowed` | IMPLEMENTED_UNVERIFIED | Negative test |
| 018, 019 multi-membership users | Not inspected | UNASSESSED | Tests |
| 020, 021 revocation, archival | 020 already PARTIAL in the tracker; 021 not inspected | | |
| 022 time-limited cross-college authority | Super Admin `adminScope` and recruiter grants exist; expiry not reviewed | UNASSESSED | |
| 023 backups, support tools, scripts | Not inspected | UNASSESSED | |

## What it takes to close them

1. **Switch RLS on in dev** (owner yes): `DB_TENANT_SCOPE=on`, `ALTER DATABASE ... SET app.rls_mode = 'enforce'`, `SECURITY_SHARED_STORE` on. The changes above exist so that enforcement does not blank the login and public pages.
2. **Decide FORCE RLS** (SEC-06-009) and write the table classification (001-003).
3. **At the CI pass:** add SQL-level negative tests for 019-024 and cross-college tests for SEC-05-005/008, then enter tracker evidence from that run.
4. **Independent review** before any VERIFIED (audit brief questions 9 and 10).

## Update 2026-11-07 (later): more inspected, parent-derived tables listed

Read from the live dev database (read-only job) and code:

- **SEC-06-003 / 002:** 130 tables have no `college_id` but a foreign-key path to a tenant table; 3 are user-owned; 32 are global or infrastructure. Full list: [tables-without-college-id.md](tables-without-college-id.md). The 130 have NO policy. This is the biggest open hole in SEC-06: the database does not narrow a direct query on a child table even though its parent is locked. Plan in that file; not auto-applied without the CI pass because a wrong policy blanks pages.
- **SEC-06-009:** migration `0337` forces RLS for the owner (the runtime role owns all 278 tables). Written and pushed, not yet deployed.
- **SEC-06-010/011:** `lms_vnext_app` has no superuser and no BYPASSRLS (confirmed on dev). It has CREATEROLE and CREATEDB, which it should not (SEC-06-012 gap on dev; production readiness refuses this, dev does not enforce it).
- **SEC-05-021 college archival:** context resolution requires `colleges.status = ACTIVE` for the membership lookup (`context-service.ts:165,281,350`), so an archived college drops access on the next request. IMPLEMENTED_UNVERIFIED; needs a test.
- **SEC-05-012 caches:** no `unstable_cache` or `revalidate` and no module-level cross-request cache found; the `new Map` hits in services are per-call local variables. IMPLEMENTED_UNVERIFIED (nothing to leak found); re-check any in-memory cache added later.
- **SEC-05-011 search:** no external search index; search is SQL `ILIKE` inside services (111 modules), so it inherits each service's college filter and, once enforced, RLS. Per-service review still open.
- **SEC-05-022 time-limited cross-college authority:** GAP. The Super Admin scope cookie (`lms_admin_scope`) carries no expiry; the header comment says authorization is verified server-side, but there is no time limit on a Super Admin acting inside a college. Owner decision: add a short expiry plus an audit line when a scope is entered.

## Update 2026-11-07 (build complete, nothing run)

Done in code, still untested:

- **SEC-06-003 / 002 / 004:** migration `0338` (127 child tables), classification file for the rest, `security:central` rule `table-without-tenant-classification`. The per-table review record is [derived-policy-plan.json](derived-policy-plan.json) (anchor per table) plus [table-classification.json](../table-classification.json). Identity core tables (`users`, `organizations`, `colleges`, `membership_roles`, `module_access_rules`) stay unscoped pending a per-query review: this is a known residual, not a pass.
- **SEC-06-008 / 019 to 024:** acceptance script now covers read, insert, update, delete, row-move out of the college, derived children, FORCE on every tenant table and zero SECURITY DEFINER functions. Runs in the CI `database` job.
- **SEC-06-018:** `sql-raw-dynamic` ratchet rule; all current `sql.raw` uses reviewed (fixed literals, plus the shared store's constants).
- **SEC-06-025:** `scripts/rls-perf-probe.mjs`, to run on dev after 0338.
- **SEC-06-001:** inventory script already exists (`scripts/security/pg-rls-readonly-audit.mjs`, runtime URL); dev catalog was read by hand on 2026-11-07.
- **SEC-06-026:** rollback was exercised for real on 2026-11-07 (pool starvation, rolled back within minutes); runbook updated.
- **SEC-06-012:** role split written as steps, owner-gated (needs `cloudsqlsuperuser`).
- **SEC-05-022:** GAP closed in code: the Super Admin scope now expires after 4 hours, enforced on the server through the `lms_admin_scope_exp` cookie (missing, past or tampered far-future = no scope), and `admin_scope.audit` lines record entering and clearing a scope. Unit test `tests/unit/sec05-admin-scope-expiry.test.ts` written, not run.
- **SEC-05-005 / 006 / 008:** the database now answers for every method of every route that reads tenant rows (RLS on 112 plus 127 tables, enforced on dev); `scripts/rls-isolation-sweep.mjs` proves it table by table with two real colleges. Handlers that use identity-core tables remain service-enforced.
- **SEC-05-009 / 010 (existence leaks, counts):** with RLS enforced, another college's row is simply absent, so object lookups return not-found and counts exclude it. Exception to review: global identity (`users` by email) is deliberately visible across colleges for sign-in and invites.
- **SEC-05-013 (jobs):** see rollout doc: named system scope, tenant chosen inside each job; per-job review of the eight routes is still owed.
- **SEC-05-018 / 019 (multi-membership):** `context-service.ts` requires the active membership to belong to the signed-in user, the college and organization to be ACTIVE, re-reads the roles from the database and narrows to the selected role, then `resolveCurrentRequestContext` rejects anything but exactly one granted role and re-checks the host-derived tenant. IMPLEMENTED_UNVERIFIED; negative tests (foreign membership id, revoked role, two memberships) are owed at the CI pass.
- **SEC-05-023 (backups, support tools, scripts):** no support or impersonation tool exists in the repo apart from the Super Admin scope above (now time-limited and audited). Database scripts refuse non-local hosts unless dev is allowed explicitly. Backups are Cloud SQL's own; no on-demand backups by owner rule; restore and retention are an ops decision, not code. PARTIAL.

Remaining after the final run: execute and record evidence for everything above, the owner-gated role split, the identity-core review, and the independent audit.
