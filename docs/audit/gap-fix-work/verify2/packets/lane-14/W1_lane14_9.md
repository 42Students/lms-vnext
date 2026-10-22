# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-18-031-050 [P1] GAP facet F12
- Files: src/db/schema/users.ts, src/db/schema/memberships.ts
- Legacy: Legacy learner/faculty identities separate numeric records with 10-digit mobile login and soft suspension state; Learner.java:16-73;Faculty.java:20-64
- Expected fix: Map identity collision/merges and preserve login alias semantics without sharing records across colleges

## G2-18-031-052 [P1] GAP facet F12
- Files: src/modules/people/membership-domain.ts, src/db/schema/memberships.ts
- Legacy: Legacy Students delete permanently removes learner and records; Students.js:1066-1084;LearnerController.java:1116-1141
- Expected fix: Define legal deletion vs reversible end and data retention; implement vetted delete only after dependent records/privacy review

## G2-18-031-079 [P1] GAP facet F22
- Files: src/db/schema/users.ts, src/db/schema/memberships.ts, src/db/schema/profiles.ts
- Legacy: Legacy separate learner/faculty tables numeric id, first/last, phone, type, suspendedAt, tokenVersion, isDeleted and profile JSON; Learner.java:16-73,143-231;Faculty.java:20-64,138-196
- Expected fix: Produce full ID crosswalk and field mapper, make no claims of migrated data; preserve old profile JSON for existing rows only when approved

## G2-19-025-001 [P1] MISSING facet F01
- Files: src/modules/auth/request-tenant.ts
- Legacy: GET /api/v1/public/tenant-bootstrap anonymous bootstrap; controller/PublicTenantController.java:23-45; frontend/api/Services/TenantService.js:3-25
- Expected fix: Decide mobile/backward compatibility, expose versioned public bootstrap if needed

## G2-19-025-006 [P1] GAP facet F03
- Files: src/modules/auth/request-tenant.ts, src/modules/colleges/branding-service.ts
- Legacy: Legacy TENANT JSON requestHost, tenantKey, collegeId, organizationId, collegeName; PublicTenantController.java:80-86
- Expected fix: Document field contract and tenantKey adapter, never leak unverified host info

## G2-19-025-007 [P1] MISSING facet F03
- Files: src/modules/auth/request-tenant.ts
- Legacy: Legacy canonicalHost + shouldRedirectToCanonicalHost only for aliases; PublicTenantController.java:88-127
- Expected fix: Compute preferred verified primary host and expose redirect flag safely

## G2-19-025-010 [P1] GAP facet F04
- Files: src/modules/auth/request-tenant.ts
- Legacy: Legacy TENANT mode, numeric collegeId/organizationId, unique tenantKey; PublicTenantController.java:80-86
- Expected fix: Never cast UUID to legacy number; publish migration-safe compatibility contract

## G2-19-025-015 [P1] GAP facet F05
- Files: src/modules/auth/request-tenant.ts
- Legacy: Legacy canonical query ordered verified primary then any primary and sorted active fallback; TenantDomainRepository.java:21-28;PublicTenantController.java:93-119
- Expected fix: Add deterministic primary-verified canonical lookup with safe fallback

## G2-19-025-017 [P1] GAP facet F06
- Files: src/modules/auth/request-tenant.ts
- Legacy: Legacy host strips scheme, path, port, www and respects trusted-forwarded flag; RequestHostUtil.java:34-106
- Expected fix: Reconcile CDN/ingress Host canonicalization without enabling spoofed forwarded hosts

## G2-19-025-029 [P1] GAP facet F12
- Files: src/modules/auth/request-tenant.ts
- Legacy: Legacy precedence local/dev, globalHost, tenant, unknown; PublicTenantController.java:55-79
- Expected fix: Define local/dev and www case normalization tests

## G2-19-025-030 [P1] MISSING facet F12
- Files: src/modules/auth/request-tenant.ts
- Legacy: Legacy canonical prefers verified primary then any primary then verified/any active; PublicTenantController.java:93-119
- Expected fix: Select verified primary only for safe canonical redirect

## G2-19-025-039 [P1] GAP facet F18
- Files: src/modules/auth/request-tenant.ts, src/modules/colleges/public-signin-policy-service.ts
- Legacy: Legacy GLOBAL/TENANT enum and tenantKey/loginMethods JSON keys; PublicTenantController.java:58-86,135-171
- Expected fix: Document explicit semantic mapping and mobile-client compatibility tests

## G2-19-025-041 [P1] GAP facet F20
- Files: src/modules/auth/request-tenant.ts
- Legacy: Legacy forwarded header trusted only by opt-in, strips CSV and port; RequestHostUtil.java:17-26,34-106
- Expected fix: Test spoofed Host, X-Forwarded-Host, IPv6, unicode/IDN, www aliases under actual ingress

## G2-19-025-045 [P1] GAP facet F22
- Files: src/db/schema/college-branding.ts
- Legacy: Legacy CollegeBranding includes login_methods plus ten image/colour/contact fields; CollegeBranding.java:15-63
- Expected fix: Migrate/login-method enum and defaults; preserve branding uniqueness+validation

## G2-19-025-048 [P1] MISSING facet F23
- Files: src/modules/auth/request-tenant.ts, src/app/page.tsx
- Legacy: Legacy canonicalHost/tenantKey public response, secondary colour, loginMethods; PublicTenantController.java:80-171
- Expected fix: Decide backward-compatibility for public and mobile consumers; specify versioned endpoint if approved

## G2-15-011-008 [P1] GAP facet F04
- Files: src/db/schema/activity.ts
- Legacy: Old title/message, class/course, optional learner ID. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Notification.java:18-32`)
- Expected fix: Map numeric learner/course/class IDs and broadcast recipient explosion to new UUID events.

## G2-15-011-011 [P1] GAP facet F04
- Files: src/db/schema/activity.ts
- Legacy: Old scheduledAt/deliveryStatus/deliveryError/deliveredAt stored on notification. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Notification.java:88-105`)
- Expected fix: Add audit mapping for scheduled/pending/failed delivery states or preserve in source event.

## G2-15-011-069 [P1] GAP facet F22
- Files: src/db/schema/activity.ts
- Legacy: Old notification one row class/course/learner with single isRead and scheduled fields. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Notification.java:18-105`)
- Expected fix: Migration plan for old broadcasts to recipients and statuses without losing read history.

## G2-15-011-070 [P1] GAP facet F22
- Files: src/db/schema/activity.ts
- Legacy: Old active/soft-delete admin views and org/college query derived via class/program. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/NotificationRepository.java:17-107`)
- Expected fix: Support archived/deleted state and admin tenancy via direct event scope.

## G2-15-016-001 [P1] GAP facet F01
- Files: src/db/schema/users.ts
- Legacy: One recruiter identity per real person, separate from faculty/learner. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Recruiter.java:14-23`)
- Expected fix: Crosswalk legacy recruiter to unified user and profile without duplicates.

## G2-15-016-010 [P1] GAP facet F04
- Files: src/db/schema/users.ts
- Legacy: ContactMobile optional normalized10 and email optional unique255. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Recruiter.java:37-48`)
- Expected fix: Migrate 10-digit phone to E.164; preserve email account key.

## G2-15-016-015 [P1] GAP facet F04
- Files: src/db/schema/users.ts
- Legacy: Legacy id int, created/updated LocalDateTime and soft isDeleted. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BaseModel.java:23-37`)
- Expected fix: Migrate soft-deleted/suspended to proper deactivated platform or archived profile.

## G2-15-016-017 [P1] GAP facet F05
- Files: src/modules/auth/login-repository.ts
- Legacy: Separate active lookups by phone/email/id ignoring deleted rows. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/RecruiterRepository.java:21-33`)
- Expected fix: Enforce active recruiter+valid grant for role-specific login, not merely active user.

## G2-15-016-020 [P1] GAP facet F06
- Files: src/db/schema/users.ts
- Legacy: At least one phone or mail, email primary now. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Recruiter.java:37-48`)
- Expected fix: Require recruiter-specific reachable email or phone before provision.

## G2-15-016-032 [P1] GAP facet F10
- Files: src/modules/auth/login-repository.ts
- Legacy: Lookups contactMail/mobile/id and active filters. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/RecruiterRepository.java:19-33`)
- Expected fix: Trace exact login via recruiter role and compare invalid/archived account errors.
