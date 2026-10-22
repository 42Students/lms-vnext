# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-5-024-017 [P1] MISSING facet F06
- Files: src/app/api/tenant-domains/[domainId]/route.ts
- Legacy: Legacy PUT domain supports changing hostname and primary flag, resets verification on changed host. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:462-505`
- Expected fix: Implement safe hostname change with verification reset and audit.

## G2-5-024-018 [P1] GAP facet F06
- Files: src/modules/colleges/branding-service.ts, src/db/schema/college-branding.ts
- Legacy: Legacy partial branding update merges only non-null fields including loginMethods. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:582-610,793-804`
- Expected fix: Align partial semantics and port sign-in method persistence.

## G2-5-024-031 [P1] MISSING facet F09
- Files: src/app/api/tenant-domains/[domainId]/route.ts, src/components/admin/tenant-domain-manager.tsx
- Legacy: Legacy edit custom host in same domain form as primary toggle. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:462-505`
- Expected fix: Add edit control with confirm and DNS-proof reset.

## G2-5-024-032 [P1] GAP facet F10
- Files: src/app/api/tenant-domains/route.ts, src/app/api/tenant-domains/[domainId]/route.ts, src/app/api/tenant-domains/[domainId]/verify/route.ts
- Legacy: Legacy create/update/delete/token/verify mutations save domain and audit each step. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:425-565`
- Expected fix: Implement missing actions and tenant-scoped audit receipts.

## G2-5-024-036 [P1] GAP facet F10
- Files: src/modules/tenant-domains/service.ts
- Legacy: Legacy verify updates DNS diagnostics even for a previously verified domain. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:540-566`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/TenantDomainVerificationService.java:62-107`
- Expected fix: Offer explicit recheck retaining verified status until deliberate revocation.

## G2-5-024-038 [P1] MISSING facet F11
- Files: src/modules/colleges/admin-tenant-setup-journey.ts, src/modules/tenant-domains/service.ts
- Legacy: Legacy resolve preview global-only. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:273-282`
- Expected fix: Expose only behind global-scope admin check.

## G2-5-024-042 [P1] GAP facet F12
- Files: src/modules/tenant-domains/service.ts, src/components/admin/tenant-domain-manager.tsx
- Legacy: Legacy TXT names `_42lms-verify.<host>` or host root, accepted bare/42lms-verification token. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/TenantDomainVerificationService.java:57-89`
- Expected fix: Plan existing DNS-record transition before switching tenant ownership checks.

## G2-5-024-049 [P1] GAP facet F15
- Files: src/modules/tenant-domains/service.ts, src/modules/tenant-domains/managed-subdomain-service.ts
- Legacy: Legacy every domain mutation logs TENANT_DOMAIN_CREATE/UPDATE/DELETE/TOKEN/VERIFY. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:425-565`
- Expected fix: Log actor + previous/current host and domain verification transition in activity events.

## G2-5-024-066 [P1] GAP facet F23
- Files: src/app/api/tenant-domains/[domainId]/route.ts, src/modules/tenant-domains/service.ts
- Legacy: Legacy allows host edit and optional unverified primary under relaxed policy. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:462-505`
- Expected fix: Restore safe host edit; require owner signoff on always-verified primary.

## G2-5-030-039 [P1] GAP facet F12
- Files: src/components/admin/college-edit-dialog.tsx, src/app/(authenticated)/admin/colleges/[collegeId]/page.tsx
- Legacy: Legacy any busy blocks close, any dirty requires confirm; dirty sections explicit. `docs/legacy-source/frontend/src/pages/superadmin/sections/ManageCollegeDrawer.js:13-33,58-81`
- Expected fix: Design shared dirty/busy state contract.

## G2-5-031-037 [P1] GAP facet F10
- Files: src/components/admin/college-admin-lifecycle-action.tsx, src/modules/colleges/admin-session-service.ts
- Legacy: Legacy status API sets isDeleted suspension and invalidates active sessions. `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminUsers.js:175-200`, `docs/legacy-source/frontend/src/api/Services/SuperAdminUsersService.js:1-12`
- Expected fix: Verify all sessions actually revoked and legacy access semantics mapped.

## G2-5-031-038 [P1] MISSING facet F10
- Files: src/app/(authenticated)/admin/colleges/[collegeId]/admins/page.tsx
- Legacy: Legacy permanent deleteFaculty(id) only after suspended, audit preserved. `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminUsers.js:221-250`, `docs/legacy-source/frontend/src/api/Services/AdminService.js:1-16`
- Expected fix: Add safe deletion only after all dependency checks and immutable audit retained.

## G2-5-031-042 [P1] GAP facet F11
- Files: src/components/admin/college-admin-lifecycle-action.tsx
- Legacy: Legacy suspend disabled if backend active project dependencies, warned in modal. `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminUsers.js:205-219`
- Expected fix: Check active project assignment, not just mentor role presence.

## G2-5-031-059 [P1] GAP facet F19
- Files: src/modules/colleges/admin-session-service.ts
- Legacy: Legacy 25 rows per page in browser after GET role list, no server page in component. `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminUsers.js:469-475`
- Expected fix: Implement DB pagination and per-role counts beyond 500.

## G2-6-015-032 [P1] GAP facet F12
- Files: (none, new feature)
- Legacy: In-progress excludes HIRED/REJECTED/WITHDRAWN with UPPER and null allowance (JobApplicationRepository.java:20-26).
- Expected fix: Compute equivalent effective pipeline state for in-progress KPI rather than raw SUBMITTED count.

## G2-6-019-039 [P1] MISSING facet F15
- Files: (none, new feature)
- Legacy: Legacy notification toggle in job preferences DTO (JobPreferencesDTO.java:9-16).
- Expected fix: Expose unified notification opt-out from profile or a clear direct link to notification settings.

## G2-11-020-050 [P1] GAP facet F11
- Files: (none, new feature)
- Legacy: Owner choices only self, TPO/admin accounts and placement team; excludes other faculty (index.js:221-236).
- Expected fix: Scope owner editor choices to authorized staff from team membership, not lead-only values.

## G2-11-026-027 [P1] MISSING facet F13
- Files: (none, new feature)
- Legacy: Storage unavailable returns 503 'Screenshot storage is unavailable' (BugTrackerAttachmentService.java:183-190).
- Expected fix: Add 503/Retry response without losing issue metadata.

## G2-12-011-029 [P1] MISSING facet F12
- Files: (none, new feature)
- Legacy: Recruiter messages only if unread>0 and within 30d (RecruiterNotificationService.java:122-134).
- Expected fix: Add unread thread fetch with 30d and tenant scope.

## G2-6-018-041 [P1] GAP facet F12
- Files: (none, new feature)
- Legacy: Legacy blocks delete while any nondeleted college linked (OrganizationServiceImpl.java:76-85).
- Expected fix: Compare legacy isDeleted vs vNext college ARCHIVED mapping; don't archive parent while any owned college still requires active organization.

## G2-6-031-038 [P1] GAP facet F12
- Files: (none, new feature)
- Legacy: Legacy termsChecked starts false each render; login only if true (SuperAdminLogin.js:35,192-215).
- Expected fix: Get owner/legal decision on affirmative consent vs informational text.

## G2-6-008-006 [P1] GAP facet F02
- Files: src/app/(authenticated)/teacher/notifications/page.tsx
- Legacy: Old page has single source-merged sorted list; 5 category filter pills `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:517-575` `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:612-709`
- Expected fix: Merge reads in UI with stable source-tagged sort by created timestamp

## G2-12-027-030 [P1] GAP facet F10
- Files: (none, new feature)
- Legacy: LBE/controller/FacultyTeachingAssignmentController.java:116-130 and LBE/service/impl/FacultyTeachingAssignmentServiceImpl.java:87-114: bulk loops under @Transactional; one failure rolls back all writes.
- Expected fix: Preserve atomic bulk contract or explicitly label partial success and provide rollback action.

## G2-14-030-004 [P1] GAP facet F02
- Files: (none, new feature)
- Legacy: LFE/pages/superadmin/sections/InterviewEditForm.js:306-435 fields ordered interviewType, roundDescription, interviewerName, duration, timezone, date, time, conflict alert, mode, location, notes, save/cancel.
- Expected fix: Rebuild form with all legacy field groups and order; keep vNext reason/version requirements separately.

## G2-15-025-009 [P1] GAP facet F04
- Files: (none, new feature)
- Legacy: LBE/service/tpo/RecruiterCollegeOverviewService.java:62-113 returns collegeName, studentsTotal rounded, byBranch, cgpaBands verified, cgpaBasedOn, asOf.
- Expected fix: Separate college demographics aggregate from drive summary and preserve asOf timestamp.

### Lane-5 fast verification triage (2026-10-22)
- **G2-5-024-017 — DEFERRED**: Source located; parity not proven without runtime/data-flow check.
- **G2-5-024-018 — DEFERRED**: Source located; parity not proven without runtime/data-flow check.
- **G2-5-024-031 — DEFERRED**: Source located; parity not proven without runtime/data-flow check.
- **G2-5-024-032 — DEFERRED**: Source located; parity not proven without runtime/data-flow check.
- **G2-5-024-036 — DEFERRED**: Source located; parity not proven without runtime/data-flow check.
- **G2-5-024-038 — DEFERRED**: Source located; parity not proven without runtime/data-flow check.
- **G2-5-024-042 — DEFERRED**: Source located; parity not proven without runtime/data-flow check.
- **G2-5-024-049 — DEFERRED**: Source located; parity not proven without runtime/data-flow check.
- **G2-5-024-066 — DEFERRED**: Source located; parity not proven without runtime/data-flow check.
- **G2-5-030-039 — DEFERRED**: Source located; parity not proven without runtime/data-flow check.
- **G2-5-031-037 — DEFERRED**: Source located; parity not proven without runtime/data-flow check.
- **G2-5-031-038 — DEFERRED**: Source located; parity not proven without runtime/data-flow check.
- **G2-5-031-042 — DEFERRED**: Source located; parity not proven without runtime/data-flow check.
- **G2-5-031-059 — DEFERRED**: Source located; parity not proven without runtime/data-flow check.
- **G2-6-015-032 — DEFERRED**: New-feature or legacy migration contract requires deeper design verification.
- **G2-6-019-039 — DEFERRED**: New-feature or legacy migration contract requires deeper design verification.
- **G2-11-020-050 — DEFERRED**: New-feature or legacy migration contract requires deeper design verification.
- **G2-11-026-027 — DEFERRED**: New-feature or legacy migration contract requires deeper design verification.
- **G2-12-011-029 — DEFERRED**: New-feature or legacy migration contract requires deeper design verification.
- **G2-6-018-041 — DEFERRED**: New-feature or legacy migration contract requires deeper design verification.
- **G2-6-031-038 — DEFERRED**: New-feature or legacy migration contract requires deeper design verification.
- **G2-6-008-006 — DEFERRED**: Source located; parity not proven without runtime/data-flow check.
- **G2-12-027-030 — DEFERRED**: New-feature or legacy migration contract requires deeper design verification.
- **G2-14-030-004 — DEFERRED**: New-feature or legacy migration contract requires deeper design verification.
- **G2-15-025-009 — DEFERRED**: New-feature or legacy migration contract requires deeper design verification.
