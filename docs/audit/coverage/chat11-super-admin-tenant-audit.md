# Chat-11 — Super Admin tenant modules / branding / sign-in / readiness audit
Source inspection: 2026-10-18. Branch: `chatgpt/chat-11-b`. **Partial, source-reviewed; no TypeScript/Vitest/PostgreSQL or browser execution.**

## Finding and regression ledger

| ID | Surface | Threat / state | Code change or existing guard | Regression | Remaining evidence |
|---|---|---|---|---|---|
| SA-tenants-modules-SEC-01 | `/admin/tenants`, `/admin/module-access`, `/admin/organizations` | Hostile query filters reached a public-looking error/recovery state before Super Admin permission check | `807267d`, `a0b09ec`, `ac7fecc`: `requirePermission(context,"admin-scope.select")` is now executed before query validation | `tests/unit/chat11-super-admin-tenant-route-guard.test.ts`: active SA allowed, disabled SA and College Admin rejected, source verifies guard ordering | Browser/HTTP 401, 403, malformed and duplicate parameter cases |
| SA-tenants-modules-LOGIN-01 | `/admin/colleges/[collegeId]/signin`, API PUT, sign-in policy write/read models | Malformed method, invalid college ID, optimistic-write races, disabled user/wrong role, missing storage, invalid stored method | Existing strict Zod method/version contract, same-origin PUT, URL/body college match, persisted platform permission in transaction, active-college row lock, idempotent same-method retry, activity event and invalid-policy fail-closed UI were inspected | `tests/unit/chat11-super-admin-signin-readiness.test.ts` (model behaviour plus route/service guards) | PostgreSQL two-admin CAS race; host-level OTP behaviour; provider failure injection; token/session expiry |
| SA-tenants-modules-READY-01 | `/admin/colleges/[collegeId]/readiness`, `/admin/tenants/setup` | Missing/zero data source mistaken for success; archived college counted ready; partial results treated as launch approval | Existing `evaluateCollegeReadiness` and `summarizeTenantSetupReadiness` conservatively map null to UNKNOWN, zero to FAIL and incomplete counts to UNKNOWN; page distinguishes persisted checks from live acceptance | `tests/unit/chat11-super-admin-signin-readiness.test.ts`: all ten pass, single UNKNOWN, zero FAIL, mixed FAIL+UNKNOWN, inconsistent coverage, setup route mapping | Real DB cross-tenant joins, primary-domain migration, 1000+ college perf and live DNS/OTP |
| SA-tenants-modules-BRAND-01 | `/admin/colleges/[collegeId]/branding` | Cross-tenant user tries to preview or edit a different college's logo/settings | Existing scoped `getSuperAdminCollegeBrandingPreview`, persisted tenant detail, scoped `getCollegeBranding` and organization-aware `can("college.manage")` guard inspected | `tests/unit/chat11-super-admin-signin-readiness.test.ts` source-scoped regression | Upload URL authorization, signed storage writes, malicious SVG/oversized file, expired session and keyboard crop flow |
| SA-tenants-modules-MOD-01 | `/admin/module-access` | No selected scope, unauthorized module overview, hostile page/filter request | Existing list service and `getModuleAccessOverviewMetrics` scope inputs, now preceded by a page-level Super Admin permission gate | `tests/unit/chat11-super-admin-tenant-route-guard.test.ts` + `tests/unit/chat11-super-admin-signin-readiness.test.ts` | DB true/false override matrices, inherited rules, large tenant counts, audit activity |


| SA-tenants-modules-SEC-02 | `/admin/colleges/[collegeId]/signin`, `/branding`, `/readiness` | Invalid tenant UUID could be parsed before an explicit Super Admin system-role check; sign-in and branding relied on downstream service auth | `c5e0d52`, `8d9ea45`, `e063736`: require `admin-scope.select` before parsing or loading per-college data | `tests/unit/chat11-super-admin-tenant-route-guard.test.ts`: `SA-tenants-modules-SEC-02` | HTTP unauthorized/expired session and load-shedding E2E |


| SA-tenants-modules-BRAND-02 | `describeAdminCollegeBranding` (source-neutral model) | No persisted row uses standard colours and no fabricated public URLs; valid HTTPS logo/background/terms/privacy, mobile background fallback and sanitized contacts; reject HTTP, credentials, signed URL query/fragment, object keys, CSS injection and contact header injection | `tests/unit/chat11-super-admin-branding-readiness-adversarial.test.ts`, `SA-tenants-modules-BRAND-02` | Browser rendering, upload authorization and object-storage E2E |
| SA-tenants-modules-READY-02 | `parseSuperAdminReadinessParams`, `visibleReadinessChecks` | Strict status/area URL filters, deny duplicates and extra keys; selecting PASS alone cannot convert one UNKNOWN domain check into verified launch readiness | Same test `SA-tenants-modules-READY-02` | DB source absence and real DNS/OTP |


| SA-tenants-modules-LOGIN-02 | `PUT /api/admin/colleges/[collegeId]/signin` | Origin verified first; live Super Admin context required before parsing; 2 KiB bounded UTF-8 JSON reader; rejects oversized 413/malformed 400 and URL/body college mismatch, preserves CAS 409/storage 503; returns only policy status and version | `tests/unit/chat11-super-admin-signin-route-adversarial.test.ts` — `SA-tenants-modules-LOGIN-02` | Provider/DB integration, real revoked-session concurrency |

| SA-tenants-modules-R01 | `getModuleAccessOverviewMetrics`, `parseModuleMetricsCollegeIds`, `assertModuleMetricsCollegeScopes` | Reject foreign/archived/missing colleges, org/college-scoped SA UUID spoofing and more than 100/duplicate IDs before aggregating. Largest learner scope excludes suspended/disabled identities; membership overrides count only active LEARNER roles with distinct rule IDs. | `tests/unit/chat11-super-admin-module-metrics-scope.test.ts`, `SA-tenants-modules-R01` | PostgreSQL multi-college aggregation and performance at 100 colleges |

| SA-tenants-modules-MOD-02 | `adminFeatureQuerySchema`, `parseAdminFeaturePageParams`, `boundedAdminFeaturePage`, `/admin/module-access` | Bounded decimal page, rejects hex/exponents/whitespace/repeated keys and caller-selected college IDs before scoped service list; no-rule and rule-state combination validation; recovery link and authorization first | `tests/unit/chat11-super-admin-module-query-adversarial.test.ts` — `SA-tenants-modules-MOD-02` | Browser and PostgreSQL pagination E2E |

| SA-tenants-modules-BRAND-03 / BRAND-04 | College branding write and preview | Transaction locks persisted Super Admin permission and ACTIVE college before mutating branding; unsaved image preview suppresses unsafe signed-token/credential URLs | `tests/unit/chat11-super-admin-branding-save-adversarial.test.ts` | PostgreSQL concurrent admin revocation and visual preview still needed |
| SA-tenants-modules-BRAND-05 | `POST /api/colleges/[collegeId]/branding/logo`, `readCollegeLogoForm` | Auth and CSRF before parsing; 3 MiB stream cap, MIME/boundary validation, duplicate multipart field rejection, 400/413, signed object write delegated to existing uploader | `tests/unit/chat11-super-admin-logo-boundary.test.ts` | Live storage E2E and malware/format scanner |

| SA-tenants-modules-BRAND-CAS-01 | `saveCollegeBranding`, `collegeBrandingSaveSchema`, `sameCollegeBranding`, College Branding form and PUT | Strict expectedVersion 0/new record, exactly one actor-scoped write/audit, identical retry without new event, changed stale request 409, live college/system-role locks, 16 KiB bounded JSON, form preserves edits and refreshes token on success | `tests/unit/chat11-super-admin-branding-cas.test.ts` and `tests/integration/chat11-super-admin-branding-cas.test.ts` | Cloud CI and real-browser save after refresh |

| SA-tenants-modules-BRAND-06 | `getPublicCollegeBranding`, `sanitizePublicCollegeBranding` | Legacy stored URL and contact fields revalidated before anonymous sign-in rendering. Reject signed token fragments/queries, non-HTTPS, credentials, private object paths, unsafe CSS and CRLF contacts without hiding other valid fields; owned logo proxy retains precedence | `tests/unit/chat11-super-admin-public-branding-safe.test.ts` — BRAND-06 | Live public college-host and image network E2E |

## Audit disposition

- **Source-level blockers found and patched:** unauthorized malformed-filter route bypass across three administrative pages.
- **Other source behaviours inspected:** sign-in idempotency/CAS, active tenant, readiness unknown versus failed, tenant-specific branding and module-access scoping.
- **Not audited exhaustively:** every exported function and route handler under `src/modules/colleges`, `src/modules/module-access`, `src/modules/tenant-domains`, and every Admin tenant UI state. Thus this document **does not satisfy** the master queue's exhaustive-coverage definition.
- **Execution blocked:** the connected GitHub surface can read/write and push commits but has no repository checkout, package runner, PostgreSQL or browser. No green test, high branch-coverage number, or production release approval is claimed.

## Super Admin read under role-revocation concurrency (2026-10-18)

| ID | Surface | New threat/fix | Regression | Runtime evidence missing |
|---|---|---|---|---|
| SA-tenants-modules-R01 | Module Access aggregate cards | Previous request-context-only `admin-scope.select` could authorize counts if the Super Admin role was revoked after request authentication, including returning success for empty lists. `db34e73` and `df3d5e4` move all aggregation and the empty shortcut behind persisted active-actor locks inside one transaction. | `tests/unit/chat11-super-admin-module-metrics-revoked-role.test.ts` — SA-tenants-modules-R01 | Two-session PostgreSQL revocation proof and large-tenant performance |

## Final-read authorization on readiness (chat-11)

| ID | Surface | New hardening | Regression | Remaining |
|---|---|---|---|---|
| SA-tenants-modules-READY-03 | `getSuperAdminCollegeReadiness` | Rebuild active actor/system-role and selected college/organization permission from persisted rows in a transaction after async readiness counters finish but before emitting tenant counts. A revoked role cannot receive a successful completed response based solely on a stale request snapshot. | `tests/unit/chat11-super-admin-readiness-revocation.test.ts`; `f015d0f`, `5909380` | True two-session role-revocation/SQL transaction E2E and runtime domain checks |

## Tenant and module controls — additional persistently authorized paths

| ID | Surface | Protection | Regression | Remaining |
|---|---|---|---|---|
| SA-tenants-modules-BRAND-READ-02 | College branding preview service | Rebuild persisted active Super Admin authority and selected college/organization scope after private branding record read, before returning public preview to caller; don't disclose private object key | `tests/unit/chat11-super-admin-branding-preview-revocation.test.ts`, commits `f5d70ce`, `e348cf1`, `310eeae` | Two-session role revocation E2E |
| SA-tenants-modules-MOD-RACE-03 | Student member override mutation | Lock ACTIVE college and persisted platform permission in transaction before member lock, ancestor locks, no-op or mutating/audit; test stale, wrong role, wrong tenant, strict input, ancestor locks | `tests/unit/chat11-super-admin-student-rule-role-revocation.test.ts`, commits `40c285f`, `c753c54` | Postgres concurrency between new ancestor lock insert and member override; browser conflict recovery |

## College-specific module filters and guarded reads

| ID | Surface | Security/accuracy | Test | Live gap |
|---|---|---|---|---|
| SA-tenants-modules-MOD-FILTER-04 | `/admin/features/[collegeId]`, `adminModuleDetailQuerySchema` | Authenticate SA before parsing tenant path/query; reject repeated values, unknown identity/scope keys, hex/exponent/whitespace pages, invalid nested scopes, academic pagination beyond 10000; show recoverable clear-filters state before loading rules | `tests/unit/chat11-super-admin-module-detail-filters.test.ts`; `56b97bc`, `ad2c55e`, `76775c0`, `89eb8cd` | Browser route role matrix and malformed URLs |
| SA-tenants-modules-MOD-READ-05 | `listSuperAdminFeatureControls`, `getSuperAdminCollegeModuleAccess` | After reading college/rules, persisted active SA-role and selected-college scope rechecked under transaction-held SHARE locks before emitting organization, college and descendant membership-rule data | `tests/unit/chat11-super-admin-module-reads-revocation.test.ts`; `c86ea38`, `b1be86c` | Postgres role revocation and role-scoped multi-college perf |

## Ancestor / academic module mutation authorization

| ID | Surface | Guard | Test | CI missing |
|---|---|---|---|---|
| SA-tenants-modules-MOD-WRITE-06 | `writeSuperAdminCollegeRule`, `writeDescendantRule` | Existing college `for update` serialization now followed by persisted active Super Admin `college.manage` SHARE lock, before expected-version, no-op, ancestor-lock evaluation, write and audit. Both levels reject tenant and session revocation between initial form read and commit. | `tests/unit/chat11-super-admin-module-writes-revocation.test.ts` (two ID-named handler cases plus role matrix), commits `7c47f0b`, `4a923db`, `c7abfe4` | PostgreSQL two-session revocation, ancestor-lock introduction race with global admin and E2E |

## Learner module bulk mutation correctness — current round

| ID | Surface | Verification and corrected behaviour | Test | Remaining |
|---|---|---|---|---|
| SA-tenants-modules-MOD-BULK-07 | `updateSuperAdminStudentRulesInBulk` | Per-student mutation returning null no longer counts as applied; raw exception messages no longer leak credentials/SQL to page; known stale CAS/ancestor locks provide next-step messages; per-learner successful writes still audited; absent successes skip misleading bulk summary | `tests/unit/chat11-super-admin-bulk-module-safety.test.ts` actual mocked service cases for null/no-op, raw error, conflict, audit recovery and revoked system role; commits `a14b3e2`, `f4a2a13` | Two-session PostgreSQL, bulk partial success browser testing |

## College sign-in editor CAS after successful commits

| ID | Surface | Corrected state | Test | Pending |
|---|---|---|---|---|
| SA-tenants-modules-LOGIN-CAS-03 | `CollegeSigninMethodForm` | Successful API response is checked for supported channel and safe integer policy version before showing saved; local committed method/token replace stale initial prop on subsequent edits; invalid successful response remains non-success with safe error, existing confirm/role guards preserved | `tests/unit/chat11-super-admin-signin-editor-cas.test.ts`; commits `209ec08`, `8d02a4d` | Browser two back-to-back saves during route refresh and PostgreSQL optimistic concurrency |

## Owner no-CI queue pass — Super Admin tenant lifecycle and branding

| Export | Current protection / change | Behavioral coverage still to add |
|---|---|---|
| `createOrganization` / `renameOrganization` | Persisted `organization.manage` role before transaction writes; rename locks live parent row to serialize with archival | DB system-role revocation and concurrent create/rename/archival |
| `archiveOrganization` | Persisted role, parent FOR UPDATE lock, then active-child existence test inside SAME transaction; prevents creating college between old check and archive | Concurrent create-college / archive-organization race and rollback/activity |
| `restoreOrganization` | Persisted role and archived parent FOR UPDATE lock before restore; active-name unique DB constraint remains authoritative | Parallel restore vs duplicate active name, selected-scope denial |
| `listArchivedOrganizations` | College-scoped Super Admin now derives parent organization from selected college, forbids mismatching scope, and rechecks persisted role before returning bounded archived names | Selected college with missing selected organization; other-college name privacy |
| `createCollege` | Persisted `college.manage` role and parent organization ACTIVE SHARE lock inside insertion transaction; cannot create tenant during concurrent parent archival | Concurrent create/archive parents and selected platform scope |
| `updateCollege` / `archiveCollege` / `restoreCollege` | Persisted `college.manage` role before commit, update and restore require locked ACTIVE parent; existing read preflight and selection scope kept | Real multi-session role revocation, archive/restore and feature initialization |
| `uploadCollegeLogo` | PUT, HEAD and metadata verification provider errors now clean their unique uncommitted private object on best effort, map to safe `LOGO_UPLOAD_FAILED`, and leave old visible logo pointer untouched; earlier DB transaction failure already cleaned up | Cloud storage aborted PUT, metadata mismatch, upload failure and delete failure tests |
| `readAdminCollegeSignInPolicy` / `saveAdminCollegeSignInPolicy` | Earlier current-role and version-CAS guards unchanged; test coverage and staged table readiness still tracked separately | Super Admin two-session policy conflicts and effective host login behavior |
| `getSuperAdminCollegeReadiness` | Persisted late role check already present; readiness unknown missing tables must not appear ready | DB rollback/missing relation and concurrent unarchive consistency |

Scope: `src/modules/organizations/service.ts`, `src/modules/colleges/service.ts`, `src/modules/colleges/admin-branding-logo-service.ts`. Cloud CI has intentionally not been run under owner direction. Never claim PostgreSQL evidence from source inspection.

| `getSuperAdminCollegeReadiness` — current lifecycle recheck | The final readiness evaluation now uses persisted, transaction-locked college status from after aggregate reads instead of initial status snapshot, and rechecks identity/organization/role before disclosing the results | Historical readiness-model unit tests, add slow-aggregate / concurrent college archival PostgreSQL E2E |
