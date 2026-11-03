# vNext security audit — authentication, authorization and tenant isolation

**Date:** 2026-11-04  
**Scope:** 42Students/lms-vnext `main`, source-level inspection. Start SHA `79040bd9eaf84170a2f4a20582a27889dde24258`; subsequent security fixes have been committed directly to main.  
**Classification:** Security-sensitive engineering audit. Do not include credentials, real tenant data or exploit payloads in this document.  
**Status:** PARTIAL AUDIT, NOT PRODUCTION CERTIFICATION. No live database catalog inspection, full 1,001-route method-by-method review, attack simulation, CI run, or PostgreSQL replay was executed in this GitHub-connector session.

## Security standard

Zero trust between tenants, roles, principals, sessions and API boundaries. Every resource operation must bind an active authenticated principal, a freshly authorized capability, and the persisted target's exact tenant/resource ancestry. All SQL writer paths must fail closed against account disablement, suspended memberships, revoked roles, archived tenants, stale or revoked recruiter grants, and simultaneous revocation. Never substitute a visible UI or authorized page for server-side object authorization.

This is audit evidence and a remediation specification, **not another execution tracker**. `docs/tracker.json` remains the sole live roadmap.

## Findings with verified source evidence

| Priority | Finding | Source evidence | Disposition |
|---|---|---|---|
| HIGH — fixed in code, tests unexecuted | Shared `assertPersistedPlatformPermission` previously rebuilt *all* persisted membership roles, although normal request contexts narrow multi-role accounts to one active role. A Learner-selected request could be evaluated as College Admin by this helper when both roles were stored. A concrete externally exploitable service path was **not** established in this review. | `src/modules/identity/context-service.ts::narrowToActiveRole`, `src/modules/permissions/persisted-actor.ts` | Changed to retain only the still-persisted selected role. Added unit and disposable-PG regression tests. |
| HIGH — fixed in code, tests unexecuted | Persisted actor reconstruction did not independently check archived parent college/organization and membership `suspendedAt`; regular request construction did check them. Concurrent tenant archival or inconsistent state could therefore diverge between request and write authorization. | `src/modules/identity/context-service.ts`, `src/modules/permissions/persisted-actor.ts` | Added persisted college + organization lifecycle joins and explicit membership suspension checks under transaction locks. |
| MEDIUM — fixed in code, tests unexecuted | Prior login/logout cleanup omitted the selected membership-role cookie, allowing an old role preference to persist across account changes, even though persisted role checks already constrained it. | `src/app/api/auth/login/verify/route.ts`, `src/app/api/auth/session/route.ts` | Clear `lms_role` on successful login and logout. |
| HIGH — release-blocking assurance gap | No database-enforced per-request tenant principal is established by the general Drizzle/PG pool. Tenant checks rely heavily on module services, host restrictions and SQL integrity constraints. The first sixteen registered SQL files reviewed had no RLS activation; **whether any active PostgreSQL RLS policies exist has not been established**. | `src/db/client.ts`, `src/modules/permissions/policy.ts`, `scripts/sql/vnext-readonly-integrity.sql` | Inspect real catalog `relrowsecurity`, `relforcerowsecurity`, `pg_policies`, actual role grants. Then design, stage and test RLS/least-privilege defenses. No blind SQL rollout. |
| HIGH — verified security gate weakness | The `API-10` test counts a route as guarded if its source contains *any* of several strings, including only `isSameOriginRequest`; passing threshold is just `>500`, not complete coverage. The snapshot has **1,001** API route files. This does not prove per-method authentication, object authorization, correct tenant filtering or CSRF. | `tests/api10-global-security-gate.test.mjs` | Replace threshold with a generated per-method inventory, justified public/worker exceptions, test ownership, negative tenant/role cases and runtime evidence. Do not falsely label existing test as complete global security certification. |
| HIGH — verified CI coverage gap | `api10-global-security-gate.yml` only runs on changes to a small set of crosswalk/tracker/gate files and does not run for most security-sensitive application edits. Its assertions are source-only, no PostgreSQL. | `.github/workflows/api10-global-security-gate.yml` | Added separate focused auth boundary workflow. Must broaden full security CI to method/resource tests and required PostgreSQL in release gate. |
| HIGH — privilege lifecycle gap to prove | Device sessions have a five-day absolute expiry, while recent reauthentication is represented as recovery messaging, without a demonstrated server-side per-action freshness enforcement for role grants, platform tenant changes, credentials or bulk private exports. Super Admin login does require independent SMS and email codes. | `src/modules/auth/config.ts`, `src/auth/session.ts`, `src/modules/auth/login-service.ts` | Require fresh dual-channel step-up or equivalent phishing-resistant MFA for high-impact actions; record verified auth time in server session and reject stale privileged mutations. |
| HIGH — deployment governance verification gap | GitHub main branch metadata returned `protected:false`; branch protection read was inaccessible to the integration and rulesets endpoint returned an account-feature error. Required checks and review rules cannot be certified. | Repository branch metadata (2026-11-04), GitHub API | Verify enforceable branch protection/rulesets and code review for auth/DB/security changes. Never treat status checks alone as a gate without actual enforcement. |
| HIGH — database-principal assurance gap | Specialized outbound worker explicitly verifies its database role has no elevated attributes and only narrow privileges. The general app pool has no analogous startup verification of production `current_user`, `BYPASSRLS`, superuser/owner status or effective table grants. | `src/modules/operations/outbound-dispatch-principal.ts`, `src/db/client.ts` | Prove the application account is not superuser or `BYPASSRLS`, has no unnecessary DDL or full cross-schema privileges, and cannot bypass selected RLS policies; isolate migration, app, worker and operator identities. |
| MEDIUM — infrastructure verification gap | Per-IP login throttling is an in-process map (with memory bound); shared per-contact and challenge caps are database-based. Client address extraction assumes the trusted Google load balancer's forwarding-chain shape. | `src/auth/ip-rate-limit.ts`, `src/modules/auth/login-service.ts` | Verify load-balancer header sanitization and edge distributed rate limits; attack-test multiple replicas and unknown-IP requests. |
| MEDIUM — hardening opportunity | Production Content-Security-Policy permits `script-src 'unsafe-inline'`, though `object-src 'none'` and other headers are present. | `src/security/headers.ts` | Stage a nonce/hash CSP migration with compatibility testing for Next.js bootstrap and lesson embeds; do not remove CSP abruptly. |

## Existing controls confirmed from code (not end-to-end verified)

- OTP HMACs, 6-digit randomly generated codes, five-minute challenge lifetime, per-contact send/verify budgets.
- Production platform Super Admin challenge requires both SMS and email codes; no regular-user MFA requirement at current policy.
- 256-bit opaque per-device sessions, HMAC-only DB credential digests, session revocation and absolute expiration.
- Active membership/role reconstruction per request, active host-verified tenant restriction, no positive tenant-host caching.
- Many domain services enforce resource ancestry and persisted actor locks; some recruiter-only operations have dedicated grant checks.
- Internal scheduler/webhook endpoints sampled have independently checked secrets/HMACs or supervised development gates.
- Some private storage, scan-verdict, provider and telemetry controls are present, but have not been penetration-tested.
- A dedicated `scripts/sql/vnext-readonly-integrity.sql` already inventories RLS flags, FKs, constraints, policies and triggers.

## Required P0 acceptance before deployment

1. **Live PostgreSQL authority inventory.** With an approved read-only account, capture table-by-table `relrowsecurity`, `relforcerowsecurity`, effective `pg_policies`, application `current_user`, superuser/`BYPASSRLS` flags, relation ownership, inherited roles, grants, SECURITY DEFINER function privileges and search paths. Keep outputs outside repository.
2. **Tenant threat and ownership matrix.** Enumerate each tenant-owned base table, organization vs college ownership, parent-child FK ancestry, global/shared tables and genuinely cross-tenant roles/workers. Fail unknown ownership; do not infer it from a UUID name alone.
3. **Phased DB defense in depth.** First separate migration, application, dispatcher, scheduler and operator DB principals. Introduce tenant-aware transaction contracts and reviewed `USING`/`WITH CHECK` policies only on verified domain families, after proving that pooled connections cannot retain another request's context. Ensure `FORCE ROW LEVEL SECURITY` where required and verify app role is not owner/superuser/`BYPASSRLS`. The application must authenticate tenant context server-side: a merely client-writable `SET LOCAL` GUC is insufficient on its own if arbitrary SQL could alter it.
4. **Per-method API gate.** Inventory **every** App Router handler by method, classify anonymous/signed worker/authenticated, specify exact permission, active principal role, trusted target resolver, tenant predicate, object ownership/relationship proof, CSRF strategy, maximum body size, response data exposure, mutation transaction guard and audit sink. Unclassified routes fail CI. Never accept regex-string presence as proof.
5. **Adversarial matrix on disposable PostgreSQL.** Tenant A vs B; organization A vs B; user A vs user B same college; Learner vs Faculty vs Mentor vs TPO vs Recruiter vs College Admin vs Super Admin; selected-role switching; tenant host aliases; revoked/suspended roles while mutation is in flight; recruiter expired grants; direct SQL with restricted app account; background jobs and webhooks; signed storage URLs; CSV and export data. Assert denial AND zero side effects on all unauthorized calls.
6. **Privileged step-up.** Set explicit server-side recent-auth TTL for all user/role assignment, tenant administration, system roles, private exports, auth factor/contact changes, session termination and security configuration operations. Require step-up on these actions independent of main session TTL. Ensure recovery does not use a single weaker channel.
7. **Release enforcement.** Required CI includes typecheck, lint, focused auth tests, disposable-PostgreSQL tenant/authorization/race tests, API route classifications, full secret/dependency/code scanning, and deploy gate. Verify enforceable protected main settings; include security approvals and no bypass for unrelated green UI tests.
8. **Operational proof.** External secret rotation and identity separation, provider webhook origin/signature verification, per-tenant audit trails with no PII, suspicious token/OTP/role events, incident containment and revocation, and negative object-storage authorization tests.

## Current code and test changes

- `src/modules/permissions/persisted-actor.ts`: role preservation, complete recruiter-only deny-by-default classification, tenant and membership live lifecycle, platform role snapshot intersection.
- `src/app/api/auth/login/verify/route.ts`, `src/app/api/auth/session/route.ts`: account-role cookie cleanup.
- `tests/unit/persisted-workspace-role-and-account-cookie-security.test.ts`: selected workspace role and login/logout contracts.
- `tests/integration/persisted-permission.test.ts`: new disposable PostgreSQL multi-role non-escalation case.
- `.github/workflows/authz-critical-boundary.yml`: focused unit regression for edits to auth, identity and permission boundaries.

**No test was executed from this session.** Committed source and written tests are not marked PASS until an actual identified-SHA runner executes them. The new workflow does not prove complete API coverage, PostgreSQL RLS or production branch governance.

## Execution commands when running on a trusted checkout

```bash
npm ci
npx vitest run tests/unit/persisted-workspace-role-and-account-cookie-security.test.ts \
  tests/unit/platform-permission-matrix.test.ts tests/unit/auth-tenant-access.test.ts
npm run typecheck
# Only against a disposable, explicitly authorized PostgreSQL test database:
TEST_DATABASE_URL='<DISPOSABLE_TEST_DB_URL>' npm run test:db -- tests/integration/persisted-permission.test.ts
# Inventory only with an authorized catalog-reading principal; never commit output:
psql -X -A -t -v ON_ERROR_STOP=1 '<AUTHORIZED_READONLY_DB_URL>' \
  -f scripts/sql/vnext-readonly-integrity.sql > /tmp/vnext-rls-inventory.jsonl
```

## Closure policy

None of the release-blocking RLS, production DB privilege, route completeness, privileged step-up, branch governance or adversarial runtime items is marked complete by this source-level audit. Continue using existing `docs/tracker.json` execution and acceptance rules; attach exact-SHA test/DB evidence to the corresponding tracked work before closure.


## 2026-11-04 hardening continuation — implementation evidence and open gates

### How RBAC is actually enforced (not a role-label claim)

1. The browser holds only an opaque first-party device session. The server resolves its persisted user, current platform state, college membership and roles.
2. One membership role is selected per request: `LEARNER`, `FACULTY`, `MENTOR`, `TPO`, or `COLLEGE_ADMIN`. A stale/forged request context combining membership roles now fails closed. Different colleges require separately active memberships. Role cookies are preferences, not grants.
3. `can()` / `requirePermission()` use the active role **plus server-resolved** organization, college and relationship facts. A matching role alone cannot authorize an arbitrary learner, course, placement or file.
4. `SUPER_ADMIN` is a separately stored platform system role. Its platform authority requires `membership === null` and respects explicit admin scope; it no longer overrides a selected Learner/college workspace. Recruiters have company–college relationship grants with separate expiry/verification checks, not a generic college role.
5. For sensitive mutations, `assertPersistedPlatformPermission()` must be invoked **inside the same transaction** as the protected write, after locking the target, to recheck platform state, selected live role, membership suspension and organization/college status. This is now added to all four people membership mutations, including privileged onboarding.
6. Future PostgreSQL RLS and least-privilege principals are the *defense-in-depth* boundary against missing SQL filters; they are **NOT YET DEPLOYED OR CERTIFIED**. SQL RLS is not the same as RBAC. Every RLS tenant policy must be derived from a verified server-owned identity/tenant and tested for `USING` and `WITH CHECK` (SELECT/UPDATE/DELETE and INSERT/UPDATE), including parent-resource lineage and pooling.

### Changes in this continuation

- `src/modules/people/repository.ts`: transactional live actor and tenant checks for role grant, role removal, membership lifecycle and onboarding; additional persisted Super Admin requirement for TPO/College Admin grants.
- `src/modules/identity/context.ts`: reject mixed membership roles; Super Admin authority only in platform workspace.
- `tests/integration/db01-membership-role-parent-lock.test.ts`: real PostgreSQL adversarial case for role revocation before the four mutations and zero unauthorized side effects.
- `tests/unit/platform-permission-matrix.test.ts`: selected-role isolation and Super Admin/learner workspace non-escalation.
- `.github/workflows/people-live-authorization-pg.yml`: exact-SHA PostgreSQL 17 acceptance suite and mandatory typecheck; full TypeScript check originally hit Node 2 GiB default heap; raised heap to 5 GiB, with rerun evidence pending.
- `scripts/security/pg-rls-readonly-audit.mjs` and `tests/security-pg-rls-catalog.test.mjs`: read-only runtime-principal/catalog inventory for elevated login, effective owner bypass, directly tenant-keyed tables, RLS flags and policy counts. Does not assert policy correctness or indirect tenant ancestry.
- `scripts/security/api-method-inventory.mjs`, `tests/security-api-method-inventory.test.mjs`, `.github/workflows/security-api-method-coverage.yml`: TypeScript AST per-method HTTP handler census; explicit review required for newly introduced HTTP methods, complete method inventory archived as a CI artifact. Existing methods remain **UNREVIEWED** until evidence-based manual/automated object-level tests are completed.
- `.github/workflows/authz-critical-boundary.yml`: additional RLS inventory classifier test.

### CI evidence and unresolved items

- Exact-SHA `69c1b2af809097dd55fc928788dc7f8716a1506b`: focused auth critical-boundary workflow **PASS** (GitHub Actions run 41704973409). This does not substitute for a PostgreSQL security integration pass.
- Exact-SHA `995b81e24cfd76771a233b3f2e7bf5a48e624f05`: PostgreSQL security workflow **FAILED BEFORE DB TESTS** due to TypeScript Node heap exhaustion (run 41704815926); no app test failure or successful PostgreSQL execution can be inferred.
- The follow-up PostgreSQL workflow with raised heap and new API method census initially had no final conclusion at document update; verify latest identified SHA and job logs before changing test status.
- **Still open**: live app DB principal and actual `pg_policies` inspection, table-level tenant ancestry and phased RLS migrations, complete legacy API method/object tenant review, multi-tenant adversarial read/write integration, privileged recent-auth step-up, external penetration test, production secret rotation proofs and enforceable protected-main governance.

### Safe diagnostic commands

```bash
# Run against an explicitly authorized database (catalog metadata only, no row reads)
DATABASE_URL='<AUTHORIZED_APP_DB_URL>' node scripts/security/pg-rls-readonly-audit.mjs --strict

# Full source census (UNREVIEWED never means authorized)
node scripts/security/api-method-inventory.mjs --json /tmp/vnext-security-api-census.json
node scripts/security/api-method-inventory.mjs --enforce-new

# Unit contracts
node --test tests/security-pg-rls-catalog.test.mjs tests/security-api-method-inventory.test.mjs
```

The user-facing security status must only claim *code committed*, *CI proven by a completed exact-SHA runner*, or *runtime DB proven by an authorized live catalog + adversarial test*. Do not conflate those evidence levels.


### Additional high-impact closure evidence (same date)

- Fresh privileged step-up: `src/auth/recent-device-auth.ts` requires a live, OTP-backed first-party device session created less than 10 minutes earlier; expired, future, invalid and missing timestamps deny access. It is invoked before **College Admin/TPO role assignment and removal** in `src/app/api/people/[membershipId]/roles/route.ts` and before **protected new-person onboarding** in `src/app/api/people/onboard/route.ts`. No reliance on browser-supplied timestamps or role labels.
- `tests/unit/recent-device-privileged-role-security.test.ts`: freshness bounds and protected-role route contracts. Pending exact-SHA authentication workflow after this update.
- **PostgreSQL acceptance PASS**: GitHub Actions run https://github.com/42Students/lms-vnext/actions/runs/41705887635 for `bf330bdac3d6b0b2e29785bdcaa74c7a5ab4c33a`; TypeScript, registered migration verification, disposable PG17 setup, lock/revocation/no-side-effect integration suite, selected-role persisted permission suite, end-to-end people membership suite, and migration immutability all passed. This establishes these particular boundaries on that exact SHA; it is not RLS certification or full app penetration certification.
- **API census PASS**: GitHub Actions run https://github.com/42Students/lms-vnext/actions/runs/41705701801 for `6aec2c3e73707244c0217add85d5467409e45c3a`; 1,001 API route files, **1,322 exported HTTP methods**, 1,179 methods with direct session-call evidence, **143** without direct session-call evidence, **36** unsafe methods without a direct origin-check call; **all 1,322 are still UNREVIEWED for full resource/tenant object-level authorization**. These are method-level prioritization signals, not confirmed security holes.
- Focused auth workflow PASS: https://github.com/42Students/lms-vnext/actions/runs/41704973409 (`69c1b2af809097dd55fc928788dc7f8716a1506b`). Exact-SHA tests for the more recent step-up integrations still require verification.

**Remaining release-blockers:** actual production DB role inspection and tenant-table lineage -> tested RLS `USING`/`WITH CHECK` policies -> nonowner/nonbypass application user -> complete API 1,322-method object-permission review -> revoked-role and foreign-ID 403/404 runtime matrix -> step-up for remaining high-impact actions -> external penetration test -> enforced PR review/required status checks and secret-hygiene operational evidence.
