# Independent review pack (generated 2026-11-08 at 0116ae1b63)

For the reviewer. You should not have seen the author's reasoning: read the control text, the evidence named below and the code, and form your own view. Report per control: ACCEPT, REJECT (with the failing case) or INSUFFICIENT EVIDENCE.

**Tracker state now:** IMPLEMENTED_UNVERIFIED 119, UNASSESSED 232, PARTIAL_EVIDENCE 141, GAP_CONFIRMED 1. Nothing is VERIFIED; only your acceptance (plus the deployed-configuration review) can move a control there (`docs/security/tracker-integration.md`).

## What to reproduce first

| Check | Command | Expect |
|---|---|---|
| Unauthenticated gate (every route, no credentials) | `SWEEP_BASE=<local or dev origin> node scripts/verify/unauth-gate.mjs` | only the baseline of public routes answers; no 5xx |
| Role-by-route matrix | `SWEEP_BASE=... SWEEP_OTP=<dev test code> node scripts/verify/role-route-matrix.mjs` | no role gains a route versus `docs/security/role-matrix-baseline*.json` |
| Row-level security acceptance (needs a disposable PostgreSQL) | `node scripts/rls-tenant-acceptance.mjs` | 34 checks pass as a non-superuser role |
| Runtime database principal | `node scripts/security/pg-runtime-principal-probe.mjs` | not superuser, no BYPASSRLS, owns nothing, cannot TRUNCATE |
| Central ratchets | `npm run security:central` | all counters at or below the baseline |
| Built output carries no secrets | `npm run build && node scripts/security/scan-built-bundles.mjs` | no findings |

Tenant isolation was also probed on the dev deployment (cross-college: 120 routes, same-college: 144 requests): see `docs/security/evidence/`.

## Claims to review (IMPLEMENTED_UNVERIFIED), grouped

### SEC-01

| Control | Requirement | Evidence and finding |
|---|---|---|
| SEC-01-001 | Maintain one authoritative internal user identity independent of email addresses, phone numbers, and legacy IDs. | Sessions and grants key on `user.id` (`verifyLogin` loads `findUserById(attempt.userId)`); email and phone are lookup inputs only (docs/security/assessments/SEC-01-authentication.md) |
| SEC-01-002 | Enforce verified ownership of login email and phone numbers. | Sign-in proves control of the contact: a one-time code is sent to the phone or email and consumed once (identity_auth_attempts, used_at, HMAC digests) before a session exists. (docs/security/assessments/SEC-01-10-14-batch-2026-11-08.md) |
| SEC-01-010 | Protect against credential stuffing, OTP guessing, and authentication flooding. | 5 verification attempts per challenge, reserved atomically before the compare (docs/security/assessments/SEC-01-authentication.md) |
| SEC-01-013 | Prevent OTP replay and enforce atomic, single-use verification. | Codes stored as keyed MAC, compared with `safeEqualHex` (constant time); `usedAt` checked; budget reserved atomically (docs/security/assessments/SEC-01-authentication.md) |
| SEC-01-014 | Ensure failed authentication cannot inadvertently activate sessions. | Session digest is created only after the code matches and `assertCanSignInHere` passes, inside the consume transaction (docs/security/assessments/SEC-01-authentication.md) |
| SEC-01-016 | Regularly test disabled users, archived tenants, and revoked memberships against authentication flows. | `assertCanSignInHere` re-checks at consume time, not only at issue; `verifyIdentitySessionCookie` rejects non-ACTIVE users (docs/security/assessments/SEC-01-authentication.md) |

### SEC-02

| Control | Requirement | Evidence and finding |
|---|---|---|
| SEC-02-001 | Use opaque, unpredictable, server-revocable session identifiers. | Token is 32 random bytes (`crypto.randomBytes`, base64url); the session lives in `identity_device_sessions` with `revoked_at` (docs/security/assessments/SEC-02-session-and-device.md) |
| SEC-02-002 | Store only cryptographic digests of session credentials. | Stored value is `HMAC-SHA256(AUTH_SECRET, token)` (`credential_digest`); the token itself is never stored (docs/security/assessments/SEC-02-session-and-device.md) |
| SEC-02-003 | Keep session cookies `HttpOnly`, `Secure`, and appropriately `SameSite` restricted. | `HttpOnly`, `Secure` when `NODE_ENV=production`, `SameSite=lax`, `path=/` (verify route) (docs/security/assessments/SEC-02-session-and-device.md) |
| SEC-02-004 | Add inactivity timeouts as well as absolute session expiration. | Idle 8 h sliding (heartbeat at most once a minute), absolute 5 days (docs/security/assessments/SEC-02-session-and-device.md) |
| SEC-02-005 | Enforce shorter privileged-session lifetimes. | Super Admin: idle 30 min and absolute 8 h from OTP, decided from the persisted `system_roles`, not a cookie (docs/security/assessments/SEC-02-session-and-device.md) |
| SEC-02-007 | Invalidate or restrict sessions after account suspension. | `resolveSession` joins `users.platform_status = 'ACTIVE'` on every request with a row lock; a suspended user fails with SESSION_REVOKED (docs/security/assessments/SEC-02-session-and-device.md) |
| SEC-02-008 | Revoke affected sessions immediately following role or membership removal. | Context (membership, roles) is re-read from the database on every request; a removed role is gone on the next request. Sessions themselves are not killed (docs/security/assessments/SEC-02-session-and-device.md) |
| SEC-02-009 | Implement logout from all devices. | `revokeAllOwnSessions`, `revokeOtherSessions`, `revokeOwnSession`; routes `/api/auth/devices*` and `DELETE /api/auth/session` (docs/security/assessments/SEC-02-session-and-device.md) |
| SEC-02-010 | Provide device/session visibility to account owners. | `/account/security` and `/api/auth/devices` list device name, last seen, revocation history (docs/security/assessments/SEC-02-session-and-device.md) |
| SEC-02-016 | Ensure every workspace and role switch triggers fresh server-side authorization. | `getCurrentRequestContext()` resolves persisted membership and roles each request; a role cookie that is not granted ends the session as SESSION_INVALID; the tenant host is rechecked (docs/security/assessments/SEC-02-session-and-device.md) |

### SEC-03

| Control | Requirement | Evidence and finding |
|---|---|---|
| SEC-03-001 | RBAC: What is this role allowed to do? | Central policy.ts decisions, deny by default (733 of 782 mutating and 520 of 533 GET route pairs answer 401 unauthenticated) and server-side enforcement through route(). (docs/security/assessments/SEC-03-04-08-access-control.md) |
| SEC-03-005 | Define explicit role-to-permission assignments. | Central policy.ts decisions, deny by default (733 of 782 mutating and 520 of 533 GET route pairs answer 401 unauthenticated) and server-side enforcement through route(). (docs/security/assessments/SEC-03-04-08-access-control.md) |
| SEC-03-006 | Make every permission deny by default. | Central policy.ts decisions, deny by default (733 of 782 mutating and 520 of 533 GET route pairs answer 401 unauthenticated) and server-side enforcement through route(). (docs/security/assessments/SEC-03-04-08-access-control.md) |
| SEC-03-007 | Enforce permissions on the server, never only through UI visibility. | Central policy.ts decisions, deny by default (733 of 782 mutating and 520 of 533 GET route pairs answer 401 unauthenticated) and server-side enforcement through route(). (docs/security/assessments/SEC-03-04-08-access-control.md) |
| SEC-03-008 | Prevent conflicting roles from automatically combining their privileges. | One request context carries one selected role (hasMembershipRole needs roles.length === 1; narrowToActiveRole selects none when several are held and none is chosen). No fallback to the highest-priority role. (docs/security/assessments/SEC-03-04-08-access-control.md) |
| SEC-03-009 | For users holding multiple roles, require explicit selection before entering privileged roles. | One request context carries one selected role (hasMembershipRole needs roles.length === 1; narrowToActiveRole selects none when several are held and none is chosen). No fallback to the highest-priority role. (docs/security/assessments/SEC-03-04-08-access-control.md) |
| SEC-03-010 | Remove the current tendency to fall back to the highest-priority role when no valid selection exists. | One request context carries one selected role (hasMembershipRole needs roles.length === 1; narrowToActiveRole selects none when several are held and none is chosen). No fallback to the highest-priority role. (docs/security/assessments/SEC-03-04-08-access-control.md) |
| SEC-03-011 | Keep Super Admin privileges isolated from ordinary membership sessions. | A Super Admin acts as the platform admin only with no selected membership (isSuperAdmin requires membership === null); platform scope is a separate admin-scope cookie that now expires after 4 hours. (docs/security/assessments/SEC-03-04-08-access-control.md) |
| SEC-03-012 | Create a single reusable policy-decision interface. | One policy interface (src/modules/permissions/policy.ts: can and requirePermission with college, organization and resource arguments) is used by route(); roles are the fixed MEMBERSHIP_ROLES constant, so there is no editable role catalogue to bypass. (docs/security/assessments/SEC-03-05-06-07-08-batch-2026-11-08.md) |
| SEC-03-014 | Evaluate college, organization, resource, ownership, assignment, and grant relationships. | One policy interface (src/modules/permissions/policy.ts: can and requirePermission with college, organization and resource arguments) is used by route(); roles are the fixed MEMBERSHIP_ROLES constant, so there is no editable role catalogue to bypass. (docs/security/assessments/SEC-03-05-06-07-08-batch-2026-11-08.md) |
| SEC-03-019 | Require elevated authorization for changing roles or permissions. | Step-up (15-minute fresh login) on role and permission changes; authorization re-read from the database on every request; persisted-actor re-check inside protected write transactions; a revoked selected role is refused (membership.role.manage). (docs/security/assessments/SEC-03-04-08-access-control.md) |
| SEC-03-020 | Enforce immediate revocation of sensitive permissions. | Step-up (15-minute fresh login) on role and permission changes; authorization re-read from the database on every request; persisted-actor re-check inside protected write transactions; a revoked selected role is refused (membership.role.manage). (docs/security/assessments/SEC-03-04-08-access-control.md) |
| SEC-03-021 | Prevent role creation or editing from bypassing the canonical permission catalogue. | One policy interface (src/modules/permissions/policy.ts: can and requirePermission with college, organization and resource arguments) is used by route(); roles are the fixed MEMBERSHIP_ROLES constant, so there is no editable role catalogue to bypass. (docs/security/assessments/SEC-03-05-06-07-08-batch-2026-11-08.md) |
| SEC-03-023 | Reevaluate role authorization at the point of protected database writes. | Step-up (15-minute fresh login) on role and permission changes; authorization re-read from the database on every request; persisted-actor re-check inside protected write transactions; a revoked selected role is refused (membership.role.manage). (docs/security/assessments/SEC-03-04-08-access-control.md) |
| SEC-03-024 | Verify the role actually selected by the user remains persisted and active. | Step-up (15-minute fresh login) on role and permission changes; authorization re-read from the database on every request; persisted-actor re-check inside protected write transactions; a revoked selected role is refused (membership.role.manage). (docs/security/assessments/SEC-03-04-08-access-control.md) |

### SEC-04

| Control | Requirement | Evidence and finding |
|---|---|---|
| SEC-04-008 | Deny horizontal access: one user may not view another user's private records solely because both are in the same college. | Same-college horizontal probe: 144 requests by a learner for other learners' ids, 108 x 403, 28 x 400, 4 x 404, no foreign data. (docs/security/assessments/SEC-03-04-08-access-control.md) |

### SEC-05

| Control | Requirement | Evidence and finding |
|---|---|---|
| SEC-05-001 | Establish authoritative tenant ownership for every tenant-owned table. | 112 of 112 (docs/security/assessments/SEC-05-06-tenant-isolation-and-rls.md) |
| SEC-05-003 | Make the active tenant server-validated. | Host-derived tenant checked against membership on every request (docs/security/assessments/SEC-05-06-tenant-isolation-and-rls.md) |
| SEC-05-011 | Scope search indexes to the same authorization rules. | No external search index exists; search runs as SQL under row-level security. (docs/security/assessments/SEC-03-05-06-07-08-batch-2026-11-08.md) |
| SEC-05-012 | Scope caches and cache keys by tenant and, where necessary, user and role. | The only cross-request, process-level cache in src is the skill catalog search cache (src/modules/skills/catalog-service.ts: 256 entries, 20 second TTL, keyed by query mode, text, category and limit); the skill catalog is platform-wide reference data and authorization happens in the route before it is read. All other Maps are pe (docs/security/assessments/SEC-05-07-14-last-batch-2026-11-08.md) |
| SEC-05-017 | Prevent a tenant-domain or Host-header mismatch from widening access. | `isTenantAccessAllowed` (docs/security/assessments/SEC-05-06-tenant-isolation-and-rls.md) |
| SEC-05-022 | Require explicit, time-limited authority for legitimate cross-college functions. | Cross-college authority exists only as the Super Admin admin-scope, which is selected explicitly, expires after 4 hours and writes an audit event. (docs/security/assessments/SEC-03-05-06-07-08-batch-2026-11-08.md) |

### SEC-06

| Control | Requirement | Evidence and finding |
|---|---|---|
| SEC-06-005 | Enable RLS on eligible tenant and user data tables. | All 112 tenant tables (docs/security/assessments/SEC-05-06-tenant-isolation-and-rls.md) |
| SEC-06-006 | Use `USING` policies to restrict which rows can be read or modified. | Both clauses present in 0333 (docs/security/assessments/SEC-05-06-tenant-isolation-and-rls.md) |
| SEC-06-007 | Use `WITH CHECK` policies to prevent unauthorized inserted or updated rows. | scripts/rls-tenant-acceptance.mjs (34 checks, run in the CI database job as a non-superuser role) covers read, insert, update, delete, moving a row to another college, derived child rows with a foreign parent and the no-scope case in enforce mode (no rows visible); scripts/rls-isolation-sweep.mjs ran 619 checks on dev. (docs/security/assessments/SEC-03-05-06-07-08-batch-2026-11-08.md) |
| SEC-06-010 | Ensure the ordinary app runtime cannot use `BYPASSRLS`. | Checked at readiness in production (docs/security/assessments/SEC-05-06-tenant-isolation-and-rls.md) |
| SEC-06-011 | Ensure the app runtime is not a superuser. | Runtime principal probe on dev: not superuser, no BYPASSRLS, no CREATEROLE or CREATEDB, no role memberships, owns 0 of 278 tables, cannot TRUNCATE or CREATE; 0 SECURITY DEFINER functions exist (asserted by the acceptance script), so there is no search_path hazard in privileged functions. (docs/security/assessments/SEC-03-05-06-07-08-batch-2026-11-08.md) |
| SEC-06-012 | Separate runtime ownership from migration ownership. | Policy refuses ownership-based bypass in production (docs/security/assessments/SEC-05-06-tenant-isolation-and-rls.md) |
| SEC-06-013 | Restrict elevated database functions and `SECURITY DEFINER` routines. | No definer function exists (docs/security/assessments/SEC-05-06-tenant-isolation-and-rls.md) |
| SEC-06-014 | Prevent unsafe `search_path` behavior in privileged functions. | Runtime principal probe on dev: not superuser, no BYPASSRLS, no CREATEROLE or CREATEDB, no role memberships, owns 0 of 278 tables, cannot TRUNCATE or CREATE; 0 SECURITY DEFINER functions exist (asserted by the acceptance script), so there is no search_path hazard in privileged functions. (docs/security/assessments/SEC-03-05-06-07-08-batch-2026-11-08.md) |
| SEC-06-015 | Define trustworthy tenant context for every protected transaction. | Set only by `runWithTenantScope` / `runAsSystem`, from the server-resolved actor (docs/security/assessments/SEC-05-06-tenant-isolation-and-rls.md) |
| SEC-06-016 | Ensure connection pooling cannot carry tenant context from one request into another. | Reset on release, connection destroyed on failure (docs/security/assessments/SEC-05-06-tenant-isolation-and-rls.md) |
| SEC-06-017 | Never trust an arbitrary client-provided tenant ID as database authority. | Scope comes from the actor, never from request input (docs/security/assessments/SEC-05-06-tenant-isolation-and-rls.md) |
| SEC-06-019 | Test SQL-level attempts to read another tenant's rows. | scripts/rls-tenant-acceptance.mjs (34 checks, run in the CI database job as a non-superuser role) covers read, insert, update, delete, moving a row to another college, derived child rows with a foreign parent and the no-scope case in enforce mode (no rows visible); scripts/rls-isolation-sweep.mjs ran 619 checks on dev. (docs/security/assessments/SEC-03-05-06-07-08-batch-2026-11-08.md) |
| SEC-06-020 | Test SQL-level attempts to modify another tenant's rows. | scripts/rls-tenant-acceptance.mjs (34 checks, run in the CI database job as a non-superuser role) covers read, insert, update, delete, moving a row to another college, derived child rows with a foreign parent and the no-scope case in enforce mode (no rows visible); scripts/rls-isolation-sweep.mjs ran 619 checks on dev. (docs/security/assessments/SEC-03-05-06-07-08-batch-2026-11-08.md) |
| SEC-06-021 | Test inserts that reference another tenant's records. | scripts/rls-tenant-acceptance.mjs (34 checks, run in the CI database job as a non-superuser role) covers read, insert, update, delete, moving a row to another college, derived child rows with a foreign parent and the no-scope case in enforce mode (no rows visible); scripts/rls-isolation-sweep.mjs ran 619 checks on dev. (docs/security/assessments/SEC-03-05-06-07-08-batch-2026-11-08.md) |
| SEC-06-022 | Test tenant-context absence and malformed context. | scripts/rls-tenant-acceptance.mjs (34 checks, run in the CI database job as a non-superuser role) covers read, insert, update, delete, moving a row to another college, derived child rows with a foreign parent and the no-scope case in enforce mode (no rows visible); scripts/rls-isolation-sweep.mjs ran 619 checks on dev. (docs/security/assessments/SEC-03-05-06-07-08-batch-2026-11-08.md) |
| SEC-06-023 | Test ownership changes and tenant transfers. | scripts/rls-tenant-acceptance.mjs (34 checks, run in the CI database job as a non-superuser role) covers read, insert, update, delete, moving a row to another college, derived child rows with a foreign parent and the no-scope case in enforce mode (no rows visible); scripts/rls-isolation-sweep.mjs ran 619 checks on dev. (docs/security/assessments/SEC-03-05-06-07-08-batch-2026-11-08.md) |
| SEC-06-025 | Verify query performance and policy behavior before production rollout. | scripts/rls-perf-probe.mjs measured the policies on dev within the agreed budget before enforcement was switched on (docs/security/rls-rollout.md). (docs/security/assessments/SEC-03-05-06-07-08-batch-2026-11-08.md) |

### SEC-07

| Control | Requirement | Evidence and finding |
|---|---|---|
| SEC-07-003 | Remove unnecessary schema ownership and DDL privileges from application runtime. | Probe: owns 0 of 278 tables, not a member of any role, no CREATE on the database, no CREATEROLE/CREATEDB (docs/security/assessments/SEC-07-database-privilege-and-integrity.md) |
| SEC-07-004 | Remove dangerous default privileges. | Default privileges for the migrator grant DML only; no function or schema defaults to the runtime role (docs/security/assessments/SEC-07-database-privilege-and-integrity.md) |
| SEC-07-007 | Enforce tenant-aware foreign-key relationships. | 127 child tables now carry `tenant_isolation_derived`: a child row can only be read, inserted or updated if its tenant parent is visible, so a child cannot attach to another college's parent (the policy's WITH CHECK). Composite tenant FKs are not used (single-column FKs only) (docs/security/assessments/SEC-07-database-privilege-and-integrity.md) |
| SEC-07-008 | Use composite tenant-aware constraints where needed. | 127 child tables now carry `tenant_isolation_derived`: a child row can only be read, inserted or updated if its tenant parent is visible, so a child cannot attach to another college's parent (the policy's WITH CHECK). Composite tenant FKs are not used (single-column FKs only) (docs/security/assessments/SEC-07-database-privilege-and-integrity.md) |
| SEC-07-009 | Prevent child records from attaching to another tenant's parent. | 127 child tables now carry `tenant_isolation_derived`: a child row can only be read, inserted or updated if its tenant parent is visible, so a child cannot attach to another college's parent (the policy's WITH CHECK). Composite tenant FKs are not used (single-column FKs only) (docs/security/assessments/SEC-07-database-privilege-and-integrity.md) |
| SEC-07-010 | Define safe cascading-deletion behavior. | 742 foreign keys: 629 RESTRICT, 90 NO ACTION, 21 CASCADE, 2 SET NULL. Only one cascade hangs off `college_memberships`; the rest are inside course, placement and log structures (docs/security/assessments/SEC-07-database-privilege-and-integrity.md) |
| SEC-07-013 | Avoid raw SQL where reviewed query builders or parameterized SQL suffice. | Rule `sql-raw-dynamic` in `security:central`: any `sql.raw()` outside `src/db/schema` with a non-literal argument fails the build (4 reviewed, all constants) (docs/security/assessments/SEC-07-database-privilege-and-integrity.md) |
| SEC-07-014 | Audit all dynamic SQL. | Same guard plus a read of template-string queries (none build SQL from input) (docs/security/assessments/SEC-07-database-privilege-and-integrity.md) |
| SEC-07-018 | Use migration checks, rollback procedures, and production-safe sequencing. | `schema-drift` job, journal and snapshots, rollback notes in `rls-rollout.md`, dry-run of migrations in a rolled-back transaction (`rls-isolation-sweep.mjs --apply=`) (docs/security/assessments/SEC-07-database-privilege-and-integrity.md) |

### SEC-08

| Control | Requirement | Evidence and finding |
|---|---|---|
| SEC-08-001 | Inventory every API route and exported HTTP method. | Route inventory by the sweeps (533 GET and 782 mutating pairs), every route classified by route() auth mode, unauthenticated calls answer 401, role matrix finds function-level gaps, and the security:central ratchet fails a new route without classification. (docs/security/assessments/SEC-03-04-08-access-control.md) |
| SEC-08-002 | Classify every endpoint as public, authenticated, privileged, service-to-service, or webhook. | Route inventory by the sweeps (533 GET and 782 mutating pairs), every route classified by route() auth mode, unauthenticated calls answer 401, role matrix finds function-level gaps, and the security:central ratchet fails a new route without classification. (docs/security/assessments/SEC-03-04-08-access-control.md) |
| SEC-08-004 | Require authentication on every nonpublic endpoint. | Route inventory by the sweeps (533 GET and 782 mutating pairs), every route classified by route() auth mode, unauthenticated calls answer 401, role matrix finds function-level gaps, and the security:central ratchet fails a new route without classification. (docs/security/assessments/SEC-03-04-08-access-control.md) |
| SEC-08-007 | Prevent broken object-level authorization (BOLA/IDOR). | Cross-college probe: 120 GET routes called with another college's ids returned no foreign data (59 x 404, 37 x 403); failure semantics are consistent (wrong role 403, foreign id 404, plain errors mapped centrally). (docs/security/assessments/SEC-03-04-08-access-control.md) |
| SEC-08-008 | Prevent broken function-level authorization. | Route inventory by the sweeps (533 GET and 782 mutating pairs), every route classified by route() auth mode, unauthenticated calls answer 401, role matrix finds function-level gaps, and the security:central ratchet fails a new route without classification. (docs/security/assessments/SEC-03-04-08-access-control.md) |
| SEC-08-013 | Enforce maximum request body sizes. | route() applies origin check, bounded body, rate limit and CSRF-equivalent same-origin enforcement before the handler. (docs/security/assessments/SEC-03-04-08-access-control.md) |
| SEC-08-015 | Apply rate limits and abuse controls per endpoint risk. | route() applies origin check, bounded body, rate limit and CSRF-equivalent same-origin enforcement before the handler. (docs/security/assessments/SEC-03-04-08-access-control.md) |
| SEC-08-016 | Protect cookie-authenticated mutations against CSRF. | route() applies origin check, bounded body, rate limit and CSRF-equivalent same-origin enforcement before the handler. (docs/security/assessments/SEC-03-04-08-access-control.md) |
| SEC-08-017 | Validate Origin/Host/proxy assumptions. | route() applies origin check, bounded body, rate limit and CSRF-equivalent same-origin enforcement before the handler. (docs/security/assessments/SEC-03-04-08-access-control.md) |
| SEC-08-019 | Use consistent authorization failure semantics. | Cross-college probe: 120 GET routes called with another college's ids returned no foreign data (59 x 404, 37 x 403); failure semantics are consistent (wrong role 403, foreign id 404, plain errors mapped centrally). (docs/security/assessments/SEC-03-04-08-access-control.md) |
| SEC-08-020 | Protect asynchronous export and report endpoints. | Bulk exports require step-up (15-minute fresh login), are audited as api.export events and feed the bulk-export tripwire. (docs/security/assessments/SEC-03-04-08-access-control.md) |
| SEC-08-021 | Protect less-obvious endpoints such as counts, autocomplete, previews, and download links. | Cross-college probe: 120 GET routes called with another college's ids returned no foreign data (59 x 404, 37 x 403); failure semantics are consistent (wrong role 403, foreign id 404, plain errors mapped centrally). (docs/security/assessments/SEC-03-04-08-access-control.md) |
| SEC-08-023 | Fail CI when a new route lacks security classification. | Route inventory by the sweeps (533 GET and 782 mutating pairs), every route classified by route() auth mode, unauthenticated calls answer 401, role matrix finds function-level gaps, and the security:central ratchet fails a new route without classification. (docs/security/assessments/SEC-03-04-08-access-control.md) |

### SEC-09

| Control | Requirement | Evidence and finding |
|---|---|---|
| SEC-09-001 | Inventory every application secret, API key, database credential, webhook secret, and signing key. | One registry names every machine secret and key (21 entries) with kind, length and distinctness rules; CI workflows reject newly committed credentials and credential artifacts. (docs/security/assessments/SEC-09-12-21-secrets-browser-backup.md) |
| SEC-09-002 | Establish clear ownership and purpose for each secret. | The secret registry records a purpose for every entry; the workflow 'Security - full-history secret scan' scans all history; cryptography is node:crypto (AES-256-GCM, HMAC-SHA256, randomBytes, timingSafeEqual), no home-made primitives. (docs/security/assessments/SEC-09-15-16-17-21-batch-2026-11-08.md) |
| SEC-09-005 | Implement continuous secret scanning across commits and pull requests. | One registry names every machine secret and key (21 entries) with kind, length and distinctness rules; CI workflows reject newly committed credentials and credential artifacts. (docs/security/assessments/SEC-09-12-21-secrets-browser-backup.md) |
| SEC-09-006 | Scan historical Git commits, not only the latest source tree. | The secret registry records a purpose for every entry; the workflow 'Security - full-history secret scan' scans all history; cryptography is node:crypto (AES-256-GCM, HMAC-SHA256, randomBytes, timingSafeEqual), no home-made primitives. (docs/security/assessments/SEC-09-15-16-17-21-batch-2026-11-08.md) |
| SEC-09-016 | Use established, reviewed cryptographic libraries and algorithms. | The secret registry records a purpose for every entry; the workflow 'Security - full-history secret scan' scans all history; cryptography is node:crypto (AES-256-GCM, HMAC-SHA256, randomBytes, timingSafeEqual), no home-made primitives. (docs/security/assessments/SEC-09-15-16-17-21-batch-2026-11-08.md) |

### SEC-10

| Control | Requirement | Evidence and finding |
|---|---|---|
| SEC-10-001 | Enforce TLS for all external application traffic. | HTTPS terminates at the Google load balancer (10 managed or pre-shared certificates); the app sends `Strict-Transport-Security: max-age=31536000` (no `includeSubDomains` or preload, owner item 10). HTTP to HTTPS redirect not read (docs/security/assessments/SEC-10-encryption-and-sensitive-data.md) |
| SEC-10-003 | Encrypt databases, storage buckets, and backups at rest. | Cloud SQL, Artifact Registry, Kubernetes Secrets (GKE) and Cloudflare R2 encrypt at rest with provider-managed keys; backups inherit the instance's encryption. Customer-managed keys are not used (docs/security/assessments/SEC-10-encryption-and-sensitive-data.md) |
| SEC-10-009 | Prevent exposing sensitive data through error responses. | Unhandled errors answer `{"error":"INTERNAL_ERROR","message":"Something went wrong on our side."}` with a request id; database errors are logged server-side, never returned (checked on dev with several 500s) (docs/security/assessments/SEC-10-encryption-and-sensitive-data.md) |
| SEC-10-010 | Protect personal data in analytics and reporting systems. | Log alerts hash account ids with `LOG_ALERT_ACCOUNT_HASH_KEY`; logs carry user ids and one-way IP tags, not contacts or codes; no analytics warehouse exists (docs/security/assessments/SEC-10-encryption-and-sensitive-data.md) |
| SEC-10-011 | Use pseudonymization or aggregation for suitable analytics workloads. | Log alerts hash account ids with `LOG_ALERT_ACCOUNT_HASH_KEY`; logs carry user ids and one-way IP tags, not contacts or codes; no analytics warehouse exists (docs/security/assessments/SEC-10-encryption-and-sensitive-data.md) |
| SEC-10-012 | Require elevated authorization for bulk personal-data exports. | Exports and imports require step-up (a login within 15 minutes) through `route({ stepUp })` (owner decision 2026-11-06); each export is written to the audit trail as `api.export`; the anomaly tripwire flags ten exports by one user in ten minutes (docs/security/assessments/SEC-10-encryption-and-sensitive-data.md) |
| SEC-10-014 | Prevent sensitive responses from being cached inappropriately. | Pages `private, no-cache, no-store`, APIs `private, no-store` (evidence file) (docs/security/assessments/SEC-10-encryption-and-sensitive-data.md) |

### SEC-11

| Control | Requirement | Evidence and finding |
|---|---|---|
| SEC-11-002 | Authorize each file against its owning tenant, user, and resource. | File access is decided from rows (owner, college, resource), signed GET URLs are short-lived (5-minute ceiling), content type is checked by magic bytes after upload (mismatch QUARANTINED), size ceilings per kind. (docs/security/assessments/SEC-11-file-uploads-and-storage.md) |
| SEC-11-003 | Use short-lived signed download URLs when appropriate. | File access is decided from rows (owner, college, resource), signed GET URLs are short-lived (5-minute ceiling), content type is checked by magic bytes after upload (mismatch QUARANTINED), size ceilings per kind. (docs/security/assessments/SEC-11-file-uploads-and-storage.md) |
| SEC-11-007 | Validate file types using content inspection rather than extensions alone. | File access is decided from rows (owner, college, resource), signed GET URLs are short-lived (5-minute ceiling), content type is checked by magic bytes after upload (mismatch QUARANTINED), size ceilings per kind. (docs/security/assessments/SEC-11-file-uploads-and-storage.md) |
| SEC-11-009 | Reject executable or dangerous content not required by a workflow. | Upload types are an allowlist (src/modules/storage/file-policy.ts: documents, three image types, zip for some flows; no HTML, SVG or executables). Signed links force attachment unless the type is a PDF or png/jpeg/gif/webp, filenames are ASCII-cleaned and percent-encoded in Content-Disposition, and responses carry private, no-st (docs/security/assessments/SEC-11-12-batch-2026-11-08.md) |
| SEC-11-010 | Enforce file-size, file-count, and total-storage limits. | File access is decided from rows (owner, college, resource), signed GET URLs are short-lived (5-minute ceiling), content type is checked by magic bytes after upload (mismatch QUARANTINED), size ceilings per kind. (docs/security/assessments/SEC-11-file-uploads-and-storage.md) |
| SEC-11-012 | Sanitize filenames and downloadable metadata. | Upload types are an allowlist (src/modules/storage/file-policy.ts: documents, three image types, zip for some flows; no HTML, SVG or executables). Signed links force attachment unless the type is a PDF or png/jpeg/gif/webp, filenames are ASCII-cleaned and percent-encoded in Content-Disposition, and responses carry private, no-st (docs/security/assessments/SEC-11-12-batch-2026-11-08.md) |
| SEC-11-014 | Prevent insecure direct access to another learner's submission. | File access is decided from database rows (owner, college, resource) at every signed-URL request, with a 5-minute ceiling, so ended memberships stop working on the next request; same-college learner probe found no foreign data. (docs/security/assessments/SEC-11-12-batch-2026-11-08.md) |
| SEC-11-017 | Prevent dangerous HTML/SVG/PDF content from becoming an application-origin script execution path. | Upload types are an allowlist (src/modules/storage/file-policy.ts: documents, three image types, zip for some flows; no HTML, SVG or executables). Signed links force attachment unless the type is a PDF or png/jpeg/gif/webp, filenames are ASCII-cleaned and percent-encoded in Content-Disposition, and responses carry private, no-st (docs/security/assessments/SEC-11-12-batch-2026-11-08.md) |
| SEC-11-019 | Revoke access to shared documents when membership or permissions end. | File access is decided from database rows (owner, college, resource) at every signed-URL request, with a 5-minute ceiling, so ended memberships stop working on the next request; same-college learner probe found no foreign data. (docs/security/assessments/SEC-11-12-batch-2026-11-08.md) |

### SEC-12

| Control | Requirement | Evidence and finding |
|---|---|---|
| SEC-12-001 | Implement a strict Content Security Policy. | Response headers on every dev response: CSP with frame-ancestors none, X-Frame-Options DENY, Permissions-Policy denying camera, microphone, geolocation, payment and usb. (docs/security/assessments/SEC-09-12-21-secrets-browser-backup.md) |
| SEC-12-003 | Prevent stored and reflected XSS. | Rich text goes through a strict rebuild (sanitizeCourseDisplayHtml in src/modules/courses/course-display-validation.ts): all text is escaped, only a short tag allowlist is reconstructed and every attribute is dropped. Only 8 files use dangerouslySetInnerHTML: 3 course components fed by that sanitizer and 5 static marketing/polic (docs/security/assessments/SEC-11-12-batch-2026-11-08.md) |
| SEC-12-004 | Sanitize rich-text course and assessment content. | Rich text goes through a strict rebuild (sanitizeCourseDisplayHtml in src/modules/courses/course-display-validation.ts): all text is escaped, only a short tag allowlist is reconstructed and every attribute is dropped. Only 8 files use dangerouslySetInnerHTML: 3 course components fed by that sanitizer and 5 static marketing/polic (docs/security/assessments/SEC-11-12-batch-2026-11-08.md) |
| SEC-12-005 | Treat Markdown, HTML, code previews, and embedded lesson content as untrusted. | Rich text goes through a strict rebuild (sanitizeCourseDisplayHtml in src/modules/courses/course-display-validation.ts): all text is escaped, only a short tag allowlist is reconstructed and every attribute is dropped. Only 8 files use dangerouslySetInnerHTML: 3 course components fed by that sanitizer and 5 static marketing/polic (docs/security/assessments/SEC-11-12-batch-2026-11-08.md) |
| SEC-12-007 | Avoid dangerous HTML injection and unchecked rendering shortcuts. | Rich text goes through a strict rebuild (sanitizeCourseDisplayHtml in src/modules/courses/course-display-validation.ts): all text is escaped, only a short tag allowlist is reconstructed and every attribute is dropped. Only 8 files use dangerouslySetInnerHTML: 3 course components fed by that sanitizer and 5 static marketing/polic (docs/security/assessments/SEC-11-12-batch-2026-11-08.md) |
| SEC-12-008 | Implement protection against clickjacking. | Response headers on every dev response: CSP with frame-ancestors none, X-Frame-Options DENY, Permissions-Policy denying camera, microphone, geolocation, payment and usb. (docs/security/assessments/SEC-09-12-21-secrets-browser-backup.md) |
| SEC-12-009 | Configure secure frame and embedding rules. | Response headers on every dev response: CSP with frame-ancestors none, X-Frame-Options DENY, Permissions-Policy denying camera, microphone, geolocation, payment and usb. (docs/security/assessments/SEC-09-12-21-secrets-browser-backup.md) |
| SEC-12-011 | Restrict browser permissions through Permissions-Policy. | Response headers on every dev response: CSP with frame-ancestors none, X-Frame-Options DENY, Permissions-Policy denying camera, microphone, geolocation, payment and usb. (docs/security/assessments/SEC-09-12-21-secrets-browser-backup.md) |
| SEC-12-012 | Restrict cross-origin access and credentialed CORS. | No Access-Control-Allow-* header is set anywhere in src, so browsers enforce same-origin; credentialed cross-origin access and wildcard CORS do not exist. (docs/security/assessments/SEC-11-12-batch-2026-11-08.md) |
| SEC-12-013 | Avoid broad wildcard CORS configurations. | No Access-Control-Allow-* header is set anywhere in src, so browsers enforce same-origin; credentialed cross-origin access and wildcard CORS do not exist. (docs/security/assessments/SEC-11-12-batch-2026-11-08.md) |
| SEC-12-014 | Prevent sensitive data from entering URLs and browser history. | Search of src for secrets in query strings (token, otp, password, secret, code) finds none; share and invite tokens travel in the path and are stored hashed, sign-in codes only in POST bodies. (docs/security/assessments/SEC-11-12-batch-2026-11-08.md) |
| SEC-12-015 | Audit browser storage for credentials and personal information. | Browser storage holds interface preferences only (table columns and sort, recent searches, last selected college or membership key, a sign-out broadcast key); no token, code or personal data. Sign-out writes lms:signout so other tabs leave, the session cookie is HttpOnly and server-revoked. (docs/security/assessments/SEC-11-12-batch-2026-11-08.md) |
| SEC-12-016 | Ensure logout clears privileged local application state. | Browser storage holds interface preferences only (table columns and sort, recent searches, last selected college or membership key, a sign-out broadcast key); no token, code or personal data. Sign-out writes lms:signout so other tabs leave, the session cookie is HttpOnly and server-revoked. (docs/security/assessments/SEC-11-12-batch-2026-11-08.md) |
| SEC-12-019 | Verify that client-side checks never substitute for server-side authorization. | Authorization is enforced in route() and the services; the role-by-route matrix and unauthenticated gate test the server regardless of what the UI hides. (docs/security/assessments/SEC-11-12-batch-2026-11-08.md) |

### SEC-13

| Control | Requirement | Evidence and finding |
|---|---|---|
| SEC-13-005 | Prevent duplicate actions and replayed mutations. | 128 files use idempotency, dedupe or delivery keys (outbound messages, notifications, webhooks, uploads); unsafe mutations additionally carry `confirmed: true` in 93 files so a replayed or accidental request is refused (docs/security/assessments/SEC-13-business-logic.md) |
| SEC-13-006 | Use idempotency keys where repeated requests can cause harmful effects. | 128 files use idempotency, dedupe or delivery keys (outbound messages, notifications, webhooks, uploads); unsafe mutations additionally carry `confirmed: true` in 93 files so a replayed or accidental request is refused (docs/security/assessments/SEC-13-business-logic.md) |
| SEC-13-007 | Protect concurrent writes against race conditions. | `expectedUpdatedAt` optimistic checks in 181 files, version/stale checks in 282 files, `SELECT ... FOR UPDATE` or `FOR SHARE` in 347 files, advisory locks in 43 files (quiz attempt limits, sign-in send caps, skills selection, profile verification) (docs/security/assessments/SEC-13-business-logic.md) |
| SEC-13-008 | Enforce optimistic or pessimistic concurrency control as appropriate. | `expectedUpdatedAt` optimistic checks in 181 files, version/stale checks in 282 files, `SELECT ... FOR UPDATE` or `FOR SHARE` in 347 files, advisory locks in 43 files (quiz attempt limits, sign-in send caps, skills selection, profile verification) (docs/security/assessments/SEC-13-business-logic.md) |
| SEC-13-014 | Ensure withdrawn, expired, suspended, and archived entities cannot continue operating. | Active-status checks appear in 175 service files and in context resolution (user, membership, college and organization must be ACTIVE on every request) (docs/security/assessments/SEC-13-business-logic.md) |
| SEC-13-017 | Make security decisions deterministic and testable. | Policy functions are pure and unit tested (`platform-policy.test.ts`); inconsistent security state (a context with several roles, a Super Admin with a membership, an expired scope) resolves to no access (docs/security/assessments/SEC-13-business-logic.md) |
| SEC-13-018 | Default to denial on inconsistent or missing security state. | Policy functions are pure and unit tested (`platform-policy.test.ts`); inconsistent security state (a context with several roles, a Super Admin with a membership, an expired scope) resolves to no access (docs/security/assessments/SEC-13-business-logic.md) |

### SEC-14

| Control | Requirement | Evidence and finding |
|---|---|---|
| SEC-14-003 | Module: Assignments — Reading another learner's submissions or modifying grades | Faculty grade and submission access re-checks the persisted teaching assignment inside the write transaction (assertPersistedFacultyTeachingMutation), learners reach only their own submissions (same-college probe: 144 requests, no foreign data), and published grades are immutable in the database fixtures. (docs/security/assessments/SEC-01-10-14-batch-2026-11-08.md) |
| SEC-14-011 | Module: College Admin — Changing another college's academic or administrative records | 120 foreign-id GET routes: no foreign data; mutating routes not probed with foreign ids; the database refuses cross-college writes (shown) (docs/security/assessments/SEC-14-23-24-25-26-remaining.md) |
| SEC-14-012 | Module: Super Admin — Platform privilege escalation and unrestricted unaudited access | Scope is explicit, expiring (4 h), audited and ignored when a membership is selected; every Super Admin request is a normal `route()` request (denials and mutations audited) (docs/security/assessments/SEC-14-23-24-25-26-remaining.md) |
| SEC-14-021 | Enforce consent and eligibility before exposing learner profiles to recruiters. | Recruiter access to learner profiles runs through relationship-scoped grants that must be ACTIVE, VERIFIED and unexpired for an ACTIVE company-college relationship at sign-in and at use; the CI job 'DB017 relationship-scoped disclosure defaults' tests the negative and tenant cases. (docs/security/assessments/SEC-01-10-14-batch-2026-11-08.md) |
| SEC-14-022 | Check legitimate company-to-college relationships at the time of access. | Recruiter access to learner profiles runs through relationship-scoped grants that must be ACTIVE, VERIFIED and unexpired for an ACTIVE company-college relationship at sign-in and at use; the CI job 'DB017 relationship-scoped disclosure defaults' tests the negative and tenant cases. (docs/security/assessments/SEC-01-10-14-batch-2026-11-08.md) |

### SEC-15

| Control | Requirement | Evidence and finding |
|---|---|---|
| SEC-15-004 | Validate webhook signatures with provider-specific rules. | Inbound machine endpoints verify an HMAC or shared secret over the raw body in constant time, refuse a browser Origin, bound the body, and use strict schemas. (docs/security/assessments/SEC-15-integrations-webhooks.md) |
| SEC-15-006 | Verify webhook events against the expected organization and resource. | Scan verdicts must match file id, college id and generation; inbound mail is idempotent by providerMessageId and deliveries claim a key in the shared store (fails closed); structured logs name secrets and routes without values. (docs/security/assessments/SEC-09-15-16-17-21-batch-2026-11-08.md) |
| SEC-15-007 | Restrict webhook endpoint methods and payload sizes. | Inbound machine endpoints verify an HMAC or shared secret over the raw body in constant time, refuse a browser Origin, bound the body, and use strict schemas. (docs/security/assessments/SEC-15-integrations-webhooks.md) |
| SEC-15-008 | Reject malformed or unexpected callback fields. | Inbound machine endpoints verify an HMAC or shared secret over the raw body in constant time, refuse a browser Origin, bound the body, and use strict schemas. (docs/security/assessments/SEC-15-integrations-webhooks.md) |
| SEC-15-009 | Prevent callbacks from mutating another tenant's resources. | Scan verdicts must match file id, college id and generation; inbound mail is idempotent by providerMessageId and deliveries claim a key in the shared store (fails closed); structured logs name secrets and routes without values. (docs/security/assessments/SEC-09-15-16-17-21-batch-2026-11-08.md) |
| SEC-15-012 | Add safe retry and idempotency behavior. | Scan verdicts must match file id, college id and generation; inbound mail is idempotent by providerMessageId and deliveries claim a key in the shared store (fails closed); structured logs name secrets and routes without values. (docs/security/assessments/SEC-09-15-16-17-21-batch-2026-11-08.md) |
| SEC-15-016 | Log security-relevant integration failures without leaking secrets. | Scan verdicts must match file id, college id and generation; inbound mail is idempotent by providerMessageId and deliveries claim a key in the shared store (fails closed); structured logs name secrets and routes without values. (docs/security/assessments/SEC-09-15-16-17-21-batch-2026-11-08.md) |

### SEC-16

| Control | Requirement | Evidence and finding |
|---|---|---|
| SEC-16-004 | Sign or authenticate internal job requests. | Every internal route goes through internalRoute(): browser Origin refused, query string refused, one named secret per route compared with timingSafeEqual, a missing or short server secret denies every call. (docs/security/assessments/SEC-16-background-jobs.md) |
| SEC-16-009 | Validate messages at queue boundaries. | Internal routes accept only schema-bound, size-bounded bodies (or none) and refuse query strings. (docs/security/assessments/SEC-09-15-16-17-21-batch-2026-11-08.md) |

### SEC-17

| Control | Requirement | Evidence and finding |
|---|---|---|
| SEC-17-001 | Keep production databases off the public internet. | Cloud SQL on private IP; NetworkPolicy lms-vnext-ingress-from-lb-only; vNext pod non-root (uid 1001), RuntimeDefault seccomp, no privilege escalation, read-only root filesystem, all capabilities dropped, CPU and memory limits, service-account token not mounted. (docs/security/assessments/SEC-17-cloud-network-infrastructure.md) |
| SEC-17-002 | Restrict inbound network access. | Cloud SQL on private IP; NetworkPolicy lms-vnext-ingress-from-lb-only; vNext pod non-root (uid 1001), RuntimeDefault seccomp, no privilege escalation, read-only root filesystem, all capabilities dropped, CPU and memory limits, service-account token not mounted. (docs/security/assessments/SEC-17-cloud-network-infrastructure.md) |
| SEC-17-003 | Restrict sensitive outbound connectivity. | Egress NetworkPolicy lms-vnext-egress-restricted (deploy/k8s/dev/lms-vnext-egress-policy.yaml) applied on dev 2026-11-08: the web pod may reach DNS, the Cloud SQL address on 5432 and public HTTPS only. Checked live: /ready 200, sign-in works, https://example.com reachable from the pod, the metadata server and a private pod addre (docs/security/assessments/SEC-17-cloud-network-infrastructure.md) |
| SEC-17-006 | Harden operating-system and runtime configurations. | The vNext pod runs non-root with a read-only root filesystem, dropped capabilities and RuntimeDefault seccomp; the same-origin check uses the actual Host header, never X-Forwarded-Host, and forwarded client addresses are hardened for rate limits. (docs/security/assessments/SEC-09-15-16-17-21-batch-2026-11-08.md) |
| SEC-17-008 | Use non-root application containers. | Cloud SQL on private IP; NetworkPolicy lms-vnext-ingress-from-lb-only; vNext pod non-root (uid 1001), RuntimeDefault seccomp, no privilege escalation, read-only root filesystem, all capabilities dropped, CPU and memory limits, service-account token not mounted. (docs/security/assessments/SEC-17-cloud-network-infrastructure.md) |
| SEC-17-009 | Restrict filesystem and container privileges. | Cloud SQL on private IP; NetworkPolicy lms-vnext-ingress-from-lb-only; vNext pod non-root (uid 1001), RuntimeDefault seccomp, no privilege escalation, read-only root filesystem, all capabilities dropped, CPU and memory limits, service-account token not mounted. (docs/security/assessments/SEC-17-cloud-network-infrastructure.md) |
| SEC-17-010 | Apply resource and process limits. | Cloud SQL on private IP; NetworkPolicy lms-vnext-ingress-from-lb-only; vNext pod non-root (uid 1001), RuntimeDefault seccomp, no privilege escalation, read-only root filesystem, all capabilities dropped, CPU and memory limits, service-account token not mounted. (docs/security/assessments/SEC-17-cloud-network-infrastructure.md) |
| SEC-17-013 | Verify load-balancer and reverse-proxy header trust. | The vNext pod runs non-root with a read-only root filesystem, dropped capabilities and RuntimeDefault seccomp; the same-origin check uses the actual Host header, never X-Forwarded-Host, and forwarded client addresses are hardened for rate limits. (docs/security/assessments/SEC-09-15-16-17-21-batch-2026-11-08.md) |

### SEC-18

| Control | Requirement | Evidence and finding |
|---|---|---|
| SEC-18-007 | Use short-lived, narrowly scoped CI credentials. | CI uses the default `GITHUB_TOKEN`; no cloud credentials in GitHub (images are built on Actions and pushed from the owner's laptop); the only `id-token: write` is in `deploy-development.yml`, which is not used (docs/security/assessments/SEC-18-supply-chain-and-ci.md) |
| SEC-18-008 | Avoid exposing production secrets to pull-request jobs. | No workflow references a repository secret (one file name contains the word); no `pull_request_target` trigger; no `workflow_run` chaining (docs/security/assessments/SEC-18-supply-chain-and-ci.md) |
| SEC-18-009 | Pin and review third-party GitHub Actions. | All 616 `uses:` lines in 224 workflows were pinned to commit SHAs on 2026-11-08 (`actions/checkout`, `setup-node`, `upload-artifact`, `github-script`, `setup-go`, `oven-sh/setup-bun`, `google-github-actions/auth` and `setup-gcloud`); the version stays as a trailing comment; Dependabot's github-actions ecosystem proposes updates (docs/security/assessments/SEC-18-supply-chain-and-ci.md) |
| SEC-18-011 | Run software composition analysis for vulnerable dependencies. | `dependabot.yml` (npm weekly, groups, actions); 2 open medium alerts, both in dev tooling, recorded in `accepted-risks.md` (docs/security/assessments/SEC-18-supply-chain-and-ci.md) |
| SEC-18-013 | Run secret scanning. | Workflows "no new committed credentials", "reject committed credential artifacts", "full history secrets"; all green on main (docs/security/assessments/SEC-18-supply-chain-and-ci.md) |
| SEC-18-019 | Audit transitive dependencies and supply-chain changes. | `dependabot.yml` (npm weekly, groups, actions); 2 open medium alerts, both in dev tooling, recorded in `accepted-risks.md` (docs/security/assessments/SEC-18-supply-chain-and-ci.md) |

### SEC-19

| Control | Requirement | Evidence and finding |
|---|---|---|
| SEC-19-001 | Create a standardized security event schema. | `security_audit_events`: time, request id, event, outcome, actor user, membership, college, role, method, path, status, target, one-way IP tag, JSON detail (bounded 4 KB) (docs/security/assessments/SEC-19-logging-audit-detection.md) |
| SEC-19-002 | Record successful and failed authentications. | `auth.login_started`, `auth.login_succeeded`, `auth.login_rejected` (with error code) in the table and the log; no contacts or codes (docs/security/assessments/SEC-19-logging-audit-detection.md) |
| SEC-19-006 | Record sensitive data exports and bulk downloads. | `api.export` for every download response, step-up required before it (docs/security/assessments/SEC-19-logging-audit-detection.md) |
| SEC-19-010 | Keep audit logs separate from ordinary debugging logs. | Separate table and separate structured events (`api.audit`, `action.audit`, `admin_scope.audit`, `auth.*`, `internal.route_denied`) (docs/security/assessments/SEC-19-logging-audit-detection.md) |
| SEC-19-011 | Protect audit logs against unauthorized editing or deletion. | Trigger refuses UPDATE, DELETE and TRUNCATE for every role; the runtime role holds only INSERT and SELECT; the table is owned by the migration login, which the application never uses; verified on dev (docs/security/assessments/SEC-19-logging-audit-detection.md) |
| SEC-19-013 | Define reliable time synchronization and correlation IDs. | Database clock (`now()`), `x-request-id` on every response and in every row (docs/security/assessments/SEC-19-logging-audit-detection.md) |
| SEC-19-015 | Detect unusual authentication failure patterns. | Anomaly tripwire (src/security/anomaly.ts) flags 20 denials per 5 minutes per user, 10 login probes per 5 minutes per client tag, 30 not-found answers per 5 minutes per user (object enumeration) and 10 exports per 10 minutes per user; findings go to the structured log, the alert module and security_audit_events. Fired as designe (docs/security/assessments/SEC-19-logging-audit-detection.md) |
| SEC-19-016 | Detect suspicious API request volumes and object enumeration. | Anomaly tripwire (src/security/anomaly.ts) flags 20 denials per 5 minutes per user, 10 login probes per 5 minutes per client tag, 30 not-found answers per 5 minutes per user (object enumeration) and 10 exports per 10 minutes per user; findings go to the structured log, the alert module and security_audit_events. Fired as designe (docs/security/assessments/SEC-19-logging-audit-detection.md) |
| SEC-19-017 | Detect unexpectedly large data exports. | Anomaly tripwire (src/security/anomaly.ts) flags 20 denials per 5 minutes per user, 10 login probes per 5 minutes per client tag, 30 not-found answers per 5 minutes per user (object enumeration) and 10 exports per 10 minutes per user; findings go to the structured log, the alert module and security_audit_events. Fired as designe (docs/security/assessments/SEC-19-logging-audit-detection.md) |

### SEC-21

| Control | Requirement | Evidence and finding |
|---|---|---|
| SEC-21-014 | Prevent a failed dependency from causing an insecure authorization fallback. | A failed dependency never opens an authorization fallback: database errors deny, the shared store claim fails closed, and only rate limiting degrades (availability, not access). (docs/security/assessments/SEC-09-15-16-17-21-batch-2026-11-08.md) |

### SEC-22

| Control | Requirement | Evidence and finding |
|---|---|---|
| SEC-22-008 | Apply consent and visibility rules to candidate discovery. | Candidate discovery by recruiters depends on explicit relationship grants (ACTIVE, VERIFIED, unexpired, capability-scoped) and share defaults tested in the CI job 'DB017 relationship-scoped disclosure defaults'. (docs/security/assessments/SEC-20-26-batch-2026-11-08.md) |

### SEC-23

| Control | Requirement | Evidence and finding |
|---|---|---|
| SEC-23-001 | Run authentication regression tests. | Thousands of unit tests plus integration suites in CI cover sign-in, role selection (narrowToActiveRole, identity-system-roles), account disable and membership revocation (db01-session-atomic-authorization, workflow 'session idle and atomic role-change revocation'), same-origin checks on route() and concurrency races (revoke-ver (docs/security/assessments/SEC-20-26-batch-2026-11-08.md) |
| SEC-23-003 | Run role-switching tests. | Thousands of unit tests plus integration suites in CI cover sign-in, role selection (narrowToActiveRole, identity-system-roles), account disable and membership revocation (db01-session-atomic-authorization, workflow 'session idle and atomic role-change revocation'), same-origin checks on route() and concurrency races (revoke-ver (docs/security/assessments/SEC-20-26-batch-2026-11-08.md) |
| SEC-23-004 | Run account-disable and membership-revocation tests. | Thousands of unit tests plus integration suites in CI cover sign-in, role selection (narrowToActiveRole, identity-system-roles), account disable and membership revocation (db01-session-atomic-authorization, workflow 'session idle and atomic role-change revocation'), same-origin checks on route() and concurrency races (revoke-ver (docs/security/assessments/SEC-20-26-batch-2026-11-08.md) |
| SEC-23-010 | Run CSRF tests. | Thousands of unit tests plus integration suites in CI cover sign-in, role selection (narrowToActiveRole, identity-system-roles), account disable and membership revocation (db01-session-atomic-authorization, workflow 'session idle and atomic role-change revocation'), same-origin checks on route() and concurrency races (revoke-ver (docs/security/assessments/SEC-20-26-batch-2026-11-08.md) |
| SEC-23-014 | Run session revocation and concurrent-request tests. | Thousands of unit tests plus integration suites in CI cover sign-in, role selection (narrowToActiveRole, identity-system-roles), account disable and membership revocation (db01-session-atomic-authorization, workflow 'session idle and atomic role-change revocation'), same-origin checks on route() and concurrency races (revoke-ver (docs/security/assessments/SEC-20-26-batch-2026-11-08.md) |
| SEC-23-015 | Run RLS tests using the real restricted application database role. | CI database job runs scripts/rls-tenant-acceptance.mjs as a non-superuser role in inert and enforce modes against a disposable PostgreSQL service; security workflows are path-triggered; adversarial fixtures use dedicated disposable databases. (docs/security/assessments/SEC-14-23-24-25-26-remaining.md) |
| SEC-23-020 | Run concurrency and transaction-race tests. | Thousands of unit tests plus integration suites in CI cover sign-in, role selection (narrowToActiveRole, identity-system-roles), account disable and membership revocation (db01-session-atomic-authorization, workflow 'session idle and atomic role-change revocation'), same-origin checks on route() and concurrency races (revoke-ver (docs/security/assessments/SEC-20-26-batch-2026-11-08.md) |
| SEC-23-022 | Require security tests to run automatically for relevant changes. | CI database job runs scripts/rls-tenant-acceptance.mjs as a non-superuser role in inert and enforce modes against a disposable PostgreSQL service; security workflows are path-triggered; adversarial fixtures use dedicated disposable databases. (docs/security/assessments/SEC-14-23-24-25-26-remaining.md) |
| SEC-23-023 | Keep dedicated disposable PostgreSQL fixtures for adversarial tests. | CI database job runs scripts/rls-tenant-acceptance.mjs as a non-superuser role in inert and enforce modes against a disposable PostgreSQL service; security workflows are path-triggered; adversarial fixtures use dedicated disposable databases. (docs/security/assessments/SEC-14-23-24-25-26-remaining.md) |

### SEC-25

| Control | Requirement | Evidence and finding |
|---|---|---|
| SEC-25-003 | Track security findings with evidence-based closure. | Security findings are tracked in docs/tracker.json: a control only moves with exact commit and passing-run evidence, VERIFIED needs an independent reviewer, and negative invariant tests enforce this in CI. (docs/security/assessments/SEC-20-26-batch-2026-11-08.md) |

### SEC-26

| Control | Requirement | Evidence and finding |
|---|---|---|
| SEC-26-007 | Tamper-evident security audit storage. | security_audit_events is append-only: a trigger refuses UPDATE, DELETE and TRUNCATE and the runtime role is refused them (verified on dev 2026-11-08). Not hash-chained, so tamper evidence stops at the database privileges. (docs/security/assessments/SEC-14-23-24-25-26-remaining.md) |

## Out of scope for this pass

Controls marked GAP in `docs/security/tracker-updates-pending.json` are known open items, not claims. Production was not touched by this program. The owner decisions are in `docs/security/OWNER-ACTIONS.md`.
