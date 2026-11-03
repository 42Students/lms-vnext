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
