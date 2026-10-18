# Auth, system roles, tenant domains and identity — chat-17 weak-area ledger

**Generated source inventory check:** 29 `src/modules/{auth,system-roles,tenant-domains,identity}` files on 2026-10-18. **Owner:** chat-17 for weak-area regression strengthening. Auth/session and tenant runtime code still have other lane owners; coordinate before broad rewrites.

Each row lists exported runtime functions (non-executable TS interfaces and types omitted), relevant checked-in tests and **explicit gaps**. Referencing an imported module is *not* equivalent to branch coverage; `UNVERIFIED` denotes a known coverage gap, not a pass. Execute targeted `vitest`, `tsc --noEmit -p tsconfig.tests.json`, and real PostgreSQL tests to close outstanding rows. Do not report exhaustive compliance from heuristics alone.

| Module source (under src/modules/) | Runtime exports to cover | Evidence file(s) in tests/unit/ | Behavioral case or remaining hole |
|---|---|---|---|
| `auth/config.ts` | `readAuthConfig, getPlatformHosts, getAuthConfig, resetAuthConfigForTests` | `chat17-auth-config-retention-network.test.ts` | Production QA isolation, invalid secret, hosts. Cached getter invalidation not directly tested. |
| `auth/crypto.ts` | `mac, safeEqualHex, generateCode, generateToken, codeMac, contactFingerprint, sessionDigest, maskPhone, maskEmail` | `chat17-auth-crypto-hardening.test.ts` | MAC separation, malformed digests, token shape, contact masking. |
| `auth/device-label.ts` | `describeDevice` | `auth-device-label.test.ts` | Browser/OS label normalization. |
| `auth/http.ts` | `ipTag, auditLogin, loginErrorResponse, guardLoginRequest` | `chat17-auth-http-hardening.test.ts` | Origin, rate limit, malformed JSON, tenant, PII-safe audit, errors. |
| `auth/login-repository.ts` | `drizzleLoginRepository` | `auth-login-service.test.ts (mocked repository contract)` | Real schema persistence and race isolation NOT verified here. |
| `auth/login-service.ts` | `normalizePhone, normalizeEmail, startLogin, sendEmailFallback, verifyLogin` | `auth-login-service.test.ts` | Validation, OTP attempts, fallback; see service suite for exact branches. |
| `auth/public-network-notice-model.ts` | `publicNetworkNotice` | `chat17-auth-config-retention-network.test.ts` | Timeout, connection, 5xx, sign-out failure truthfulness. |
| `auth/request-tenant.ts` | `resolveRequestTenant, clearRequestTenantCacheForTests` | `chat17-auth-http-hardening.test.ts (tenant resolver mocked)` | UNVERIFIED runtime cache timing/host races. |
| `auth/retention.ts` | `purgeAuthData` | `chat17-auth-config-retention-network.test.ts` | Bounded deletion windows, database exceptions; no live deletion test. |
| `auth/runtime.ts` | `startLoginWithRuntime, sendEmailFallbackWithRuntime, verifyLoginWithRuntime` | `auth-login-service.test.ts (service injection only)` | UNVERIFIED live adapters and transactional reads. |
| `auth/session-service.ts` | `createSession, resolveSession, revokeSessionByToken, revokeAllSessionsForUser, listActiveSessions, revokeOtherSessions, revokeOwnSession` | `chat16-otp-route-tenant-session-09.test.ts` | Needs full real PostgreSQL session lifecycle and race matrix. |
| `auth/tenant-access.ts` | `isTenantAccessAllowed` | `auth-tenant-access.test.ts` | Platform, college, recruiter, disabled, ended/suspended membership, unknown. |
| `auth/tenant-branding.ts` | `getCollegeSignInName` | `chat17-auth-tenant-branding.test.ts` | Authorized college name only and missing/archived fallback. |
| `system-roles/repository.ts` | `drizzleSystemRoleRepository` | `chat17-identity-system-roles-hardening.test.ts (mock repository)` | UNVERIFIED real SQL privilege/race. |
| `system-roles/runtime.ts` | `bootstrapSuperAdminWithRuntime, assignSystemRoleWithRuntime` | `chat17-identity-system-roles-hardening.test.ts (service injection)` | UNVERIFIED runtime adapter execution. |
| `system-roles/service.ts` | `bootstrapSuperAdmin, assignSystemRole, assignSystemRoleInputSchema, bootstrapSuperAdminInputSchema` | `chat17-identity-system-roles-hardening.test.ts`; `chat17-identity-portal-matrix.test.ts` | Role escalation authorization, invalid target and role, scoped SA. Bootstrap collision branch remains. |
| `tenant-domains/admin-confirmation-model.ts` | `describePrimaryDomainSwitch, canConfirmPrimaryDomainDelete` | `tenant-domain-validation.test.ts (validation only)` | UNVERIFIED domain deletion confirmation model behavior. |
| `tenant-domains/college-subdomain-model.ts` | `availableSubdomainLabel, subdomainLabelSchema, subdomainMoveInputSchema` | `tenant-domain-validation.test.ts (hostname only)` | UNVERIFIED reserved/subdomain update cases. |
| `tenant-domains/dns-verifier.ts` | `dnsTenantDomainVerifier` | `chat17-tenant-dns-verifier.test.ts` | Exact TXT records, chunks, DNS failures. |
| `tenant-domains/managed-subdomain-model.ts` | `managedSubdomainRequest, managedBaseDomain, managedHost, isManagedHost` | `tenant-domain-validation.test.ts (hostname only)` | UNVERIFIED multi-domain normalization and removal transitions. |
| `tenant-domains/managed-subdomain-service.ts` | `getManagedCollegeSubdomain, changeManagedCollegeSubdomain` | `tenant-domain-validation.test.ts (validation only)` | UNVERIFIED active membership/tenant write race. |
| `tenant-domains/repository.ts` | `drizzleTenantDomainRepository` | `chat17-tenant-dns-verifier.test.ts (injected verifier)` | UNVERIFIED real SQL transaction/ownership. |
| `tenant-domains/runtime.ts` | `listTenantDomainsWithRuntime, createTenantDomainWithRuntime, verifyTenantDomainWithRuntime, setPrimaryTenantDomainWithRuntime, deleteTenantDomainWithRuntime, resolveTenantFromHostWithRuntime` | `chat17-tenant-dns-verifier.test.ts (verifier only)` | UNVERIFIED end-to-end domain lifecycle and cache invalidation. |
| `tenant-domains/service.ts` | `verificationDnsName, verificationDnsValue, listTenantDomains, createTenantDomain, verifyTenantDomain, setPrimaryTenantDomain, deleteTenantDomain, resolveTenantFromHost` | `chat17-tenant-dns-verifier.test.ts` | Proof token and DNS; service permission matrix needs real DB. |
| `tenant-domains/validation.ts` | `normalizeTenantHost, normalizeRequestHost, createTenantDomainInputSchema, tenantDomainActionSchema` | `tenant-domain-validation.test.ts` | Normalize, ports, URL ambiguity, backslash and controls. |
| `identity/constants.ts` | `ORGANIZATION_STATUSES, COLLEGE_STATUSES, USER_PLATFORM_STATUSES, MEMBERSHIP_STATUSES, MEMBERSHIP_ROLES, SYSTEM_ROLES` | `chat17-identity-system-roles-hardening.test.ts` | Role enums used in service validation; full enum parity not asserted. |
| `identity/context-service.ts` | `resolveRequestContext, listMembershipChoices` | `chat17-identity-portal-matrix.test.ts (pure model only)` | UNVERIFIED real membership status/role/recruiter grant DB resolution. |
| `identity/context.ts` | `isSuperAdmin, hasMembershipRole, hasActiveMembership, hasActiveRecruiter` | `chat17-identity-system-roles-hardening.test.ts`; `chat17-identity-portal-matrix.test.ts` | Disabled/ended/stale roles, recruiter and SA scope. |
| `identity/unauthorized-portal-home.ts` | `deniedPortalHome, PORTAL_PERMISSION_DENIED` | `chat17-identity-portal-matrix.test.ts` | All account role priorities, stale/disabled fallbacks. |

## High-priority active regressions

- **WEAK-auth-tenant-access-06/07:** pure tenant host admission used cached college IDs without rechecking disabled-user and revoked-membership state. Updated predicate requires `hasActiveMembership` or `hasActiveRecruiter` and an active user, with negative tests for suspended, ended and disabled contexts.
- **WEAK-tenant-domains-06:** raw configured and request Host now rejects backslash and ASCII controls *before* URL parsing. Domain schema must not verify a hostname other than the caller's literal input.
- **WEAK-system-roles-04 / WEAK-identity-04..07:** role and portal fallback matrix covers active learner, mentor, faculty, TPO, College Admin, recruiter, Super Admin, disabled users and stale memberships. Role mutation is globally scoped only.
- **WEAK-auth-config-01/02:** QA one-time codes only in explicit development configurations; platform host allowlist is intentional and production-default empty.
- **WEAK-auth-retention-01/02:** parameterized purge boundary and fail-on-query-error; no synthetic success on database failure.
- **WEAK-auth-network-01:** sign-out failures cannot announce that the session was cleared.

## Acceptance and open items

- Run `npm run test:chat17:weak` for the explicitly selected weak-area suite, `npm run test:ux:kit:hardening` for all shared UI kit assertions, and `npm run test:db:projects-harness` against a migrated disposable PostgreSQL DB.
- A source-level inventory gives no proof of complete branch coverage. Remaining UNVERIFIED rows require live service/database tests, including multi-session races, HTTP session revocations, DNS handover, system-role bootstrap and grant expiry. Other lane handoffs must include a separate reviewer.
- **Release gate:** no claim that every account is unbreakable until the orchestrator publishes passing typecheck, unit, DB-integrity and browser role-journey results.
