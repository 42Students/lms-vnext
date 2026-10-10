# DB01 identity and tenancy — Chat 2 source reconciliation

**Worker:** Chat 2 · **Task:** DB-004 · **Global phase:** DATABASE  
**State:** SOURCE-AUDIT IN PROGRESS; NOT VERIFIED / NOT COMPLETED  
**Legacy backend oracle:** `42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5` (`prod-2026`)  
**Legacy frontend oracle:** `42Students/lms2-fe@e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2` (`prod-2026`)  
**vNext evidence:** committed Drizzle TypeScript schema on `main`; no PostgreSQL replay performed by this worker.

## Scope and proof standard

The existing `docs/planning/db-pass4-columns-db01_identity_and_tenancy.json` inventories **22 source-table candidates and 312 source-field candidates**. Its candidate mappings and name matches are *not* validated parity. This document adds a source-backed semantic crosswalk and defect/decision register. Do not convert any `UNVERIFIED_FIELD_SEMANTICS` field to verified based on this review alone; require current runtime reads/writes, database migration replay and negative acceptance tests.

The snapshot through V150 alone is not a proof that a table remains active. Review later migration changes and current JPA/service usages. The greenfield product does **not** migrate existing legacy records.

## Source-backed semantic crosswalk — current proof

| Legacy concept and source | vNext evidence/proposed mapping | Status and required proof |
| --- | --- | --- |
| `organization.id/name/created_at/updated_at` (`model/Organization.java`) | `organizations.id/name/created_at/updated_at`; integer ID becomes UUID | **CANDIDATE:** explicit field equivalents; prove lifecycle and scoped read/write |
| `organization.is_deleted` | `organizations.status` currently defaults `ACTIVE` | **DESIGN DECISION OPEN:** soft deletion vs status cannot be assumed equivalent |
| `college.id/org_id/name/address_line1/address_line2/landmark/city/state/country/pin_code` (`model/College.java`) | `colleges.id/organization_id/name/address_line1/address_line2/landmark/city/state/country/postal_code` | **CANDIDATE:** integer→UUID, `org_id`→FK, `pin_code`→`postal_code`; test referential and tenant scope |
| `college.unique_id` | `colleges.code` case-insensitive unique | **REQUIRES WORKFLOW PROOF:** legacy `PublicTenantController` emits `unique_id` as `tenantKey`; verify code semantics, stability, and externally visible identifiers |
| `college.logo` | `colleges.logo_object_path` | **REDESIGN CANDIDATE:** source is URL/string and target is object path; ensure bootstrap returns a safe public URL and optional fallback |
| `college.college_chair_id/college_vice_chair_id` | no directly matching `colleges` columns | **UNRESOLVED:** show workflow reads and decide mapping to memberships/assignments or signed retirement; never silently omit |
| `college_branding` (`model/CollegeBranding.java`; `controller/PublicTenantController.java`) | `colleges.logo_object_path` covers at most default logo concept; not equivalent to full branding entity | **SOURCE-CONFIRMED PERSISTENCE GAP:** dedicated tenant-specific branding persisted/read by legacy, see below |
| `tenant_domain.college_id/host/is_primary/is_verified/verification_token/verified_at/last_checked_at/last_check_result` (`model/TenantDomain.java`) | `tenant_domains` contains same concepts with UUID college FK, case-folded unique host and unique primary per college | **CANDIDATE:** explicit structural equivalence; verify state transitions / canonical-host route / permission checks |
| `tenant_domain.last_found_values` | no corresponding field in `src/db/schema/tenant-domains.ts` | **SOURCE-CONFIRMED COLUMN GAP:** persisted by active legacy verification service; make explicit safe persistence/redaction/retention decision |
| `tenant_domain.is_deleted` | no corresponding field in `tenant_domains` | **UNRESOLVED:** check delete/revoke semantics; vNext must never resolve removed domain |
| `user.id/name/phone/email` (`model/User.java`) | `users.id/display_name/phone_e164/email` | **CANDIDATE:** normalization requires behavior checks (E.164 and casefold); identity provider `identity_uid` is vNext-specific |
| `user.user_type`, `user_roles`, `role` | `system_roles`, `membership_roles`, `college_memberships` with scoped role enums | **REDESIGN CANDIDATE:** must prove global-vs-college role interpretation and suspend/revoke race |
| `user.password`, `login_user.password` | Identity Platform manages authentication; no plaintext/password copy expected in vNext Postgres | **INTENTIONAL SECURITY-DESIGN CANDIDATE:** verify actual provider ownership, reset/revocation, no local credential mirroring |
| `user.user_name/unique_id/business_title` | no direct columns in `users.ts` | **UNRESOLVED:** identify which fields have active UI/API consumers, then map/store/retire explicitly |
| `user_session`, `refresh_token_blocklist`, `auth_token`, `auth_handoff_token`, `mobile_login_attempt`, `email_verification_token`, learner/faculty OTP verification | Identity Platform may replace some credential/OTP flows | **NOT REVIEWED TO COMPLETION:** document one-for-one user jobs (device list/revoke, expiry, replay protection, OTP brute-force, trusted handoff) before any retirement |
| `recruiter`, `recruiter_college_access`, capabilities | canonical identity + feature recruiter profile/grants | **CROSS-DOMAIN REVIEW REQUIRED:** DB09 owns recruiter CRM domain details; prove pending grant, expiry, revocation, status and tenancy independently of role membership |

## Confirmed missing field: tenant domain DNS diagnostics

Legacy `TenantDomainVerificationService.markVerified` and `markFailed` both store `last_found_values` after checking DNS TXT records. The service truncates joined values to **500 characters**. Failed rechecks deliberately preserve an existing `is_verified` status; first `ensureToken` issuance also does not clear verification. Legacy `TenantResolutionService` defaults to **requiring verified domains** for host resolution, and the super-admin launch-readiness check delegates to that same policy.

The current `src/db/schema/tenant-domains.ts` defines `last_check_result` and `last_checked_at`, but not `last_found_values`.

**Staged direction (not yet authorized as migration):** add a nullable bounded diagnostics field or a scoped verification-history record that supports the admin recheck diagnosis. Establish redaction (untrusted TXT may contain sensitive material), 500-char compatibility, retention and authorization before exposing values. W01 alone registers migrations. Do not weaken existing unique-host, verified-primary or tenant FK constraints.

Acceptance examples: wrong TXT displays/stores diagnosis without silently revoking verified status; DNS timeout distinguishes infrastructure fault from absent record; changing host invalidates previous proof; forged college/domain linkage rejected; request host cannot resolve unverified domain by default.

## Confirmed missing concept: per-college tenant branding

Legacy `CollegeBranding` persists `college_id` (unique), `logo_url`, `favicon_url`, `login_background_url`, `login_background_url_mobile`, `primary_color`, `secondary_color`, `support_email`, `support_phone`, `terms_url`, `privacy_url`; base-model timestamps/deletion apply. Legacy `PublicTenantController.bootstrap` actively reads **all ten** branding override fields and returns them in tenant bootstrap. `TenantAdminController.onboardingReadiness` treats missing branding as advisory warnings, not login blockers.

Current `colleges.ts` stores `logo_object_path` but not favicon, login backgrounds, colors, support contacts or policy links. A single logo property **cannot** prove the corresponding public tenant bootstrap job. No direct equivalent was found in the inspected canonical organization/college/domain schemas; perform broader app-setting/source search before choosing a new table.

**Staged direction:** separate college-scoped branding document/table with a unique college FK, constrained URL/object-path policy, safe color validation, and a super-admin write audit. Preserve logo fallback, mobile login background distinction and public-read vs privileged-write boundaries. W01 owns numbered migration registration; UI/API implementation belongs to later global phases.

Acceptance examples: two colleges return completely isolated branding; deleted/inactive branding uses safe fallback; public bootstrap never leaks unpublished admin-only config; wrong-college mutation fails; URLs and colors pass strict validation.

## Identity/session gaps that must not be prematurely retired

Legacy `UserSession` identifies a device session by refresh-token JTI and stores device, agent, IP, created/last-used/expiry timestamps. `UserSessionService` exposes create, rotate, delete, list-active and revoke-specific-session operations. The fact that vNext uses a managed identity provider does **not** demonstrate parity with per-device session UI or targeted revocation. Require an explicit provider-backed replacement decision with tests, or persist minimal tenant-safe session metadata as needed. Never duplicate raw refresh tokens.

Legacy recruiter credentials and college grant lifecycle include `suspended_at`, `token_version`, grant `status`, `valid_until`, revoker/grantor and capability collection. `RecruiterCollegeAccess.isActiveAt` requires not-deleted, ACTIVE, and unexpired. Explicitly coordinate with DB09 reviewer; user platform status alone is not proof of grant history.

`docs/planning/db01-self-identity-profile-contract.md` already stages `users.given_name`, `users.family_name`, `users.identity_profile_version` and provider-synchronized email changes, **not** an active/verified schema. Do not duplicate or bypass this W01 single-writer contract.

## Remaining DB-004 work / acceptance blockers

1. Reconstruct current active vs retired status for all **22** candidate tables using post-V150 migrations, repositories, current services and vNext behavior. These are not automatically all live tables.
2. Field-by-field classify the **312** candidates with exact vNext storage/external-managed proof, type, null/default, uniqueness, FK, tenant ownership, writer/reader and history; leave active gaps open.
3. Stage bounded domain-specific schema/SQL proposals and coordinate integration with Chat 1; obtain signed decisions for security redesigns and retirements.
4. Run clean disposable PostgreSQL migration replay, tenant-mismatch/suspend/delete tests, canonical-host verification tests and identity/device lifecycle tests **after** promotion.
5. Re-read fresh legacy BE/FE and vNext SHAs, attach executed outputs before `DONE_VERIFIED`.

**Current evidence status:** source file comparison and candidate mapping only. Tests authored here: **0**. Tests executed here: **0**. Runtime semantic fields verified here: **0**. DB-004 remains **IN_PROGRESS**.
