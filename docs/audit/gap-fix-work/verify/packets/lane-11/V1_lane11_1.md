# Verification packet (P1 sample): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-10-027-003 [P1] GAP facet F01
- Files: src/app/api/colleges/[collegeId]/branding/logo/route.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:1603-1614 — POST /file/upload multipart fallback.
- Expected fix: Add scoped fallback for blocked CORS if required

## G2-10-009-013 [P1] MISSING facet F03
- Files: src/components/admin/inbound-mail-list.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:37-47` sender bold recruiter/student name, address and Recruiter/Student+college Tag
- Expected fix: Join normalized recruiter/student/college names and render exact badges

## G2-10-014-043 [P1] MISSING facet F10
- Files: src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/settings.js:59-79 — Legacy POST job status to Open/Close by college.
- Expected fix: Wire authorized lifecycle action.

## G2-10-019-033 [P1] GAP facet F06
- Files: src/components/admin/learner-module-access-drawer.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:375-395,869-883 — Student override tri-state in trace drawer; disabled if locked above.
- Expected fix: Surface equivalent learner exceptions with explicit placements-eligibility reasoning.

## G2-10-021-063 [P1] GAP facet F12
- Files: src/components/admin/super-admin-hr-detail-drawer.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:269-279 — Expiry blank passes null (unbounded), selected day end-of-day timestamp.
- Expected fix: Decide default expiry and notify operator before grant.

## G2-17-23-083 [P1] GAP facet F21 Background delivery
- Files: (none, new feature)
- Legacy: TS:188–195 publishes bell and audit; JS:1238–1241 status-changed event, JS:1107–1124 afterCommit
- Expected fix: Reconcile durable event/outbox delivery semantics and post-commit notification guarantees; add audit event correlation IDs

## G2-15-001-003 [P1] GAP facet F01
- Files: (none, new feature)
- Legacy: Course click dispatches CourseID and optional classId to Redux (CoursesContent.jsx:73-81,551-553).
- Expected fix: Verify all workspace descendants derive selected course/class from delivery scope; bridge any legacy-dependent navigation state.

## G2-19-004-013 [P1] GAP facet F04
- Files: src/app/(authenticated)/learn/my-placements/schedule/page.tsx
- Legacy: Legacy round card displays company/logo, role link, online/room, optional platform/duration, bring instructions `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:19-30` `docs/legacy-source/frontend/src/components/Placements/student/ScheduleCard.jsx:74-85`
- Expected fix: Extend view model with role/job link, verified instructions and platform where persisted.

## G2-19-015-033 [P1] GAP facet F12
- Files: src/modules/tenant-domains/repository.ts
- Legacy: Legacy tenant_domain has is_deleted soft tombstone inherited BaseModel `docs/legacy-source/backend/src/main/resources/db/migration/V59__tenant_domains_branding_settings.sql:3-8`
- Expected fix: Resolve domain takeover/tombstone retention and historical tenant links.

## G2-19-015-043 [P1] GAP facet F18
- Files: src/modules/tenant-domains/service.ts
- Legacy: Legacy TXT prefix `42lms-verification=` and `_42lms-verify` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/TenantDomainVerificationService.java:58-85`
- Expected fix: Communicate DNS change clearly to customers with old records.

## G2-2-015-083 [P1] MISSING facet F14
- Files: src/app/api/admin/course-progress/students/export/route.ts
- Legacy: Legacy CSV has learnerId, name, rollNumber, 3 completed and 3 denominators, percent `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:207-225`
- Expected fix: Add learner identifier, roll and per-kind denominator columns

## G2-15-030-073 [P1] GAP facet F23
- Files: (none, new feature)
- Legacy: L:39 allows org view without collegeId
- Expected fix: Owner decide org-scoped reporting scope.

## G2-4-031-023 [P1] MISSING facet F06
- Files: src/components/admin/college-signin-method-form.tsx
- Legacy: onDirtyChange/onBusyChange informs parent drawer close guard (`docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSignIn.js:79-89`)
- Expected fix: Integrate route leave/close guard or restore parent callbacks.

## G2-5-024-013 [P1] MISSING facet F04
- Files: src/modules/tenant-domains/service.ts
- Legacy: Legacy preview distinguishes TENANT vs TENANT_NOT_FOUND, canonicalHost nullable and shouldRedirect boolean. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:287-313`
- Expected fix: Expose global-only preview response fields.

## G2-5-024-033 [P1] GAP facet F10
- Files: src/modules/tenant-domains/managed-subdomain-service.ts
- Legacy: Legacy managed change soft-retires old host; remove soft-deletes it. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:343-396,408-423`
- Expected fix: Preserve old host/tombstone history across rename/removal.

## G2-5-031-043 [P1] GAP facet F12
- Files: src/components/admin/college-admin-lifecycle-action.tsx, src/app/(authenticated)/admin/colleges/[collegeId]/admins/page.tsx
- Legacy: Legacy suspend reversible, hard Delete only when already suspended, and project dependencies block. `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminUsers.js:202-249`
- Expected fix: Implement audited hard-delete policy or explicitly sunset with owner approval.

## G2-19-027-093 [P1] GAP facet F22
- Files: (none, new feature)
- Legacy: LBE/repository/CourseRepository.java:112-134 checks duplicate course name OR short title among non-deleted rows.
- Expected fix: Resolve duplicate short titles during import and ensure intended constraint parity.

## G2-7-017-083 [P1] GAP facet F22
- Files: (none, new feature)
- Legacy: LFE/components/admin/projects/workspaceRowMeta.jsx:61-77 per-member task assignment aggregates via assigneeId numeric
- Expected fix: Map identity join and preserve task coverage/last activity fields

## G2-9-010-023 [P1] GAP facet F05
- Files: src/app/(authenticated)/college/placements/jobs/[jobId]/applications/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:463-482` — Changing Department resets Program and Batch
- Expected fix: Clear descendant selects when parent changes; bound options to parent

## G2-9-030-023 [P1] GAP facet F06
- Files: src/components/admin/college-logo-uploader.tsx
- Legacy: Image chosen inside Ant Form.Item `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:163-169`
- Expected fix: Align upload/save transaction semantics

## G2-9-031-033 [P1] GAP facet F09
- Files: src/components/admin/managed-college-subdomain.tsx
- Legacy: Remove Modal warns college becomes unreachable at this address; data unaffected `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSubdomain.js:93-100`
- Expected fix: Explain loss of access and data unaffected before Remove.

## G2-9-031-063 [P1] GAP facet F22
- Files: src/modules/tenant-domains/managed-subdomain-service.ts
- Legacy: Legacy single college-to-subdomain assignment with no ownership check platform domain `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSubdomain.js:6-9`
- Expected fix: Document tenant-domain schema migration and primary/managed record uniqueness.

## G2-9-032-053 [P1] GAP facet F12
- Files: src/modules/colleges/bulk-import-model.ts
- Legacy: Optional header orgId/name/uniqueId and 3–5 positional columns `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:155-217`
- Expected fix: Accept legacy CSV template or provide converter with explicit error

## G2-9-032-073 [P1] GAP facet F20
- Files: src/components/admin/college-create-form.tsx, src/components/admin/college-edit-dialog.tsx, src/components/admin/college-bulk-import.tsx
- Legacy: Unsaved edit and import drafts guarded before closing `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:343-378`
- Expected fix: Add edit dirty guard and warn on scope navigation

## G2-9-035-103 [P1] GAP facet F10
- Files: src/modules/colleges/admin-today-attention-service.ts
- Legacy: Legacy Today attendance pending refers to held last7 days `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:149-154`
- Expected fix: Restore 7-day attendance-pending window and exclude cancelled sessions.
