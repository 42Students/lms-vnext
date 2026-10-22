# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-1-026-034 [P1] GAP facet F07
- Files: src/app/(authenticated)/college/profile/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/college-admin/profile.js:143-151: stale warning 'Couldn't refresh profile' and 'Showing the last profile we loaded.'
- Expected fix: Retain cached profile and exact warning copy.

## G2-1-027-020 [P1] GAP facet F07
- Files: src/components/placements/public-recruiter-join-form.tsx
- Legacy: docs/legacy-source/frontend/src/pages/college-join/[token].js:7-10,54-60: maps API field error codes to AntD Form.Item name (email/phone/name/company/code).
- Expected fix: Set field-specific errors with focus per control, preserving exact server messages.

## G2-1-028-017 [P1] GAP facet F07
- Files: src/components/placements/public-recruiter-join-form.tsx
- Legacy: docs/legacy-source/frontend/src/pages/company-join/[token].js:6-10,53-59: maps OTHER_COMPANY_EMAIL to email field error.
- Expected fix: Map server error to Work email field with aria-describedby.

## G2-19-031-132 [P1] GAP facet F22
- Files: src/modules/placements/tpo-team-internal-create-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoTeamThreadController.java:59-176` — Legacy Team threads members/context/mentions/asks/decisions.
- Expected fix: Generic multi-member team schema and object link tables.

## G2-1-031-046 [P1] GAP facet F14
- Files: src/app/(authenticated)/learn/profile/page.tsx
- Legacy: docs/legacy-source/frontend/src/components/profile/about.js:1315-1335: Identity document upload and link import.
- Expected fix: Surface secure identity file receipt upload and status from profile.

## G2-10-004-091 [P1] GAP facet F23
- Files: src/app/(authenticated)/admin/companies/page.tsx
- Legacy: Old global list allows selected-college tab to preserve local notes/contacts and global catalog independently `docs/legacy-source/frontend/src/pages/superadmin/companies/index.js:8-21` `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:140-150`
- Expected fix: Split global master and college CRM experiences instead of a shared list

## G2-10-010-008 [P1] GAP facet F02
- Files: src/app/(authenticated)/admin/academics/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/dashboard.js:52-61` destination Dashboard shows PageShell Dashboard
- Expected fix: Align destination page structure with Dashboard landing

## G2-10-013-020 [P1] GAP facet F05
- Files: src/modules/placements/college-drive-interviews-service.ts
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:232-314 — Client filters interview records by jobId, conflict, company, department, type, mode, search then sorts date.
- Expected fix: Implement server-side candidate filtering by all old dimensions and stable date sorting.

## G2-10-013-040 [P1] GAP facet F10
- Files: src/modules/placements/college-drive-interviews-service.ts, src/modules/placements/college-round-slot-action-service.ts
- Legacy: docs/legacy-source/frontend/src/api/Services/interviewService.js:20-37 — GET /api/v1/interviews scoped by college; UI filters scheduled interview objects by route jobId.
- Expected fix: Map legacy interview entity fields to round-slot appointments and preserve candidate list.

## G2-10-012-048 [P1] GAP facet F12
- Files: src/modules/placements/super-admin-drive-pipeline-model.ts, src/components/placements/super-admin-drive-pipeline.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:241-255 — Pipeline is current-status snapshot: no cumulative claims and no drop-off percentages.
- Expected fix: Suppress percent previous when stages are snapshots; only show supported cumulative metrics.

## G2-10-012-081 [P1] GAP facet F22
- Files: src/modules/placements/super-admin-drive-pipeline-model.ts, src/modules/placements/super-admin-drive-pipeline-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:2278-2328 — Hiring metrics keyed lower-case current statuses from legacy JobApplication status (Applied etc).
- Expected fix: Reconcile snapshot metrics against actual applicant timeline and modern stage distribution.

## G2-10-015-002 [P1] MISSING facet F01
- Files: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/shortlisted.js:40-47 — Dedicated `/superadmin/jobs/:jobId/shortlisted` route, accessible from Manage Shortlisted.
- Expected fix: Make alias/route entry for shortlist deep links with Assessment default.

## G2-10-028-002 [P1] MISSING facet F01
- Files: src/app/(authenticated)/admin/projects/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/index.js:352-361 — Create workspace, Bulk reassign mentor and Deleted workspaces buttons visible.
- Expected fix: Expose three separate header actions and deleted destination.

## G2-10-021-099 [P1] GAP facet F21
- Files: src/modules/placements/super-admin-hr-service.ts
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:11-21; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminRecruiterController.java:67-149 — Old SuperAdminRecruiterService with endpoints lifecycle/grants.
- Expected fix: Compare mutation outcomes status by status and all backend service validations.

## G2-10-023-102 [P1] GAP facet F22
- Files: src/app/(authenticated)/admin/tenants/create/page.tsx, src/app/(authenticated)/admin/tenants/setup/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantsHub.js:81-90 — Last-created org local state and current selectedCollegeId context.
- Expected fix: Implement transactional next-step state/provenance

## G2-15-022-017 [P1] GAP facet F06
- Files: src/modules/placements/tpo-recruiter-grant-write-model.ts
- Legacy: ExtendRequest `months` defaults6 on null body; valid 0..60 (0 removes end); TpoRecruiterAccessController.java:87-105
- Expected fix: Support 0,24 and valid 1..60 or document intentional business rules; preserve default6 where applicable.

## G2-15-022-018 [P1] GAP facet F06
- Files: src/modules/placements/tpo-recruiter-grant-write-service.ts
- Legacy: Extend from later of now/current validUntil; 0 sets NULL; TpoRecruiterAccessController.java:103-106
- Expected fix: Compare expiry function leap-month semantics and explicitly support infinity, audit both paths.

## G2-15-022-019 [P1] MISSING facet F06
- Files: src/modules/placements/tpo-recruiter-grant-write-model.ts
- Legacy: Revoke accepts optional `reason`, trimmed max500, server stores; TpoRecruiterAccessController.java:114-135
- Expected fix: Add optional reason (≤500 chars) to confirmation and grant update; include in event metadata.

## G2-15-022-029 [P1] GAP facet F10
- Files: src/modules/placements/tpo-recruiter-grant-write-service.ts
- Legacy: Revoke status, revokedAt, revokedByUserId/Type=FACULTY, reason; TpoRecruiterAccessController.java:128-134
- Expected fix: Store reason and actor role where audit needs it; preserve version-safe transaction.

## G2-18-023-014 [P1] GAP facet F05
- Files: src/modules/placements/learner-placement-rules-service.ts
- Legacy: Rule page uses student batch rules with overrides; PlacementRulesService.java:37-80; LearnerEligibilityController.java:110-120
- Expected fix: Resolve current learner's active placement batch policy override rather than only college base.

## G2-18-023-032 [P1] GAP facet F12
- Files: src/modules/placements/learner-placement-rules-service.ts
- Legacy: Legacy batch override applies counts-as-placed and held offer params per learner; PlacementRulesService.java:37-80
- Expected fix: Read effective batch policy for current enrollment and reuse in held-offer apply gate.

## G2-11-001-029 [P1] GAP facet F06
- Files: src/modules/placements/public-enquiry/recruit-service.ts
- Legacy: Server name max150, company max200 after clean(). `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementsPageService.java:132`
- Expected fix: Align validation lengths and normalization.

## G2-11-001-046 [P1] GAP facet F10
- Files: src/modules/placements/public-enquiry/recruit-service.ts
- Legacy: Duplicate existing lead reused; activity includes quoted note. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementsPageService.java:143`
- Expected fix: Include cleaned hiring note in lead activity.

## G2-11-001-056 [P1] GAP facet F13
- Files: src/app/placements/page.tsx
- Legacy: Load error separate from missing and retryable. `docs/legacy-source/frontend/src/pages/placements/index.js:69`
- Expected fix: Dedicated retryable error state.

## G2-11-001-072 [P1] GAP facet F20
- Files: src/modules/placements/public-enquiry/recruit-service.ts
- Legacy: Legacy note clean() sanitizes and truncates. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementsPageService.java:190`
- Expected fix: Match input sanitation and test markup.
