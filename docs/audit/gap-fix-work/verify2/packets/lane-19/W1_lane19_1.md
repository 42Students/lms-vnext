# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-1-004-049 [P1] GAP facet F14
- Files: src/app/(authenticated)/learn/profile/page.tsx
- Legacy: `LearnerProfileController.java:1210-1237` default resume URL API.
- Expected fix: Provide default-resume upload/selection and placements consumption.

## G2-12-029-050 [P1] GAP facet F22
- Files: src/modules/projects/validation.ts
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/projectSectionFieldConfigs.js:144-166 — legacy type names Link/DOC/PPT/Video and isPinned/isRequired, optional key.
- Expected fix: Normalize persisted legacy names/flags to vNext blueprint.

## G2-14-023-005 [P1] GAP facet F03
- Files: src/components/placements/learner-placement-requests.tsx, src/modules/placements/tpo-general-request-model.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerRequestController.java:29-30 — kinds allowed WITHDRAWAL/OFFER_EXTENSION/REGISTRATION_CHANGE/ABSENCE_DISPUTE/CORRECTION/EXTERNAL_OFFER/PAP.
- Expected fix: Build one predictable request picker with seven legacy options and new variant mapping.

## G2-15-028-006 [P1] GAP facet F03
- Files: src/components/projects/project-workspace.tsx
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/WorkspaceSprintsEditor.jsx:81-103 — Sprints editor and Save sprint plan button.
- Expected fix: Offer Super Admin bulk editor for all sprints.

## G2-15-028-012 [P1] MISSING facet F05
- Files: src/components/projects/project-workspace.tsx
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/RepeatingItemEditor.jsx:87-94 — swap row positions Up/Down across full sprint plan.
- Expected fix: Implement persisted sprint sequence reorder under admin scope.

## G2-19-020-002 [P1] GAP facet F01
- Files: src/modules/bug-tracker/report-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/BugTrackerAccessRepository.java:8-10 — callers can find active reporter by tokenHash or displayName.
- Expected fix: Restore approved reporter selection/enrollment or document owner-approved authenticated alternative.

## G2-19-020-005 [P1] GAP facet F03
- Files: src/modules/bug-tracker/report-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/BugTrackerService.java:43-48 — create form selects valid active reporter, rejects bad name.
- Expected fix: Replace freeform reporter acceptance with verified actor provenance.

## G2-19-020-010 [P1] GAP facet F04
- Files: src/modules/bug-tracker/report-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/BugTrackerService.java:44-52 — report’s reporterName replaced by trusted selected displayName.
- Expected fix: Bind report display name to authenticated active user's allowed identity.

## G2-19-020-014 [P1] GAP facet F06
- Files: src/modules/bug-tracker/report-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/BugTrackerAccessRepository.java:10 and docs/legacy-source/backend/src/main/java/com/_42students/lms/service/BugTrackerService.java:44-48 — active reporter required to create report.
- Expected fix: Use authorized reporter session or bind only platform user to report.

## G2-19-020-020 [P1] GAP facet F10
- Files: src/modules/bug-tracker/report-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/BugTrackerService.java:43-52 — SELECT active access by displayName then write BugReport reporterAccess FK.
- Expected fix: Avoid unbounded inactive identity creation; associate with authenticated reporter identity.

## G2-10-004-008 [P1] GAP facet F03
- Files: src/app/(authenticated)/admin/companies/page.tsx
- Legacy: Old global companies render Antd table with Company Domains Added by Colleges Drives Actions columns `docs/legacy-source/frontend/src/pages/superadmin/sections/CompanyCuration.js:59-81`
- Expected fix: Add global distinct-company table with exact old column set; separate college relationships detail view

## G2-10-009-121 [P1] MISSING facet F23
- Files: src/app/(authenticated)/admin/inbound-mail/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:12-17` REPLIES tab and routing reason chips
- Expected fix: Keep both routing outcome and optional staff triage view

## G2-10-017-038 [P1] MISSING facet F08
- Files: src/components/placements/placement-operations-workspace.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:499-506 — Active drives load failure 'Couldn't refresh active drives' stale warning, Retry.
- Expected fix: Render old cards with stale warning and Retry.

## G2-10-017-058 [P1] GAP facet F13
- Files: src/components/placements/placement-operations-workspace.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:202-204 — Refreshing data retains last college's current scoped rows with RefreshStatus.
- Expected fix: Keep scoped prior results only on same college with warning.

## G2-10-017-076 [P1] GAP facet F19
- Files: src/components/placements/placement-operations-workspace.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:136-153 — Attention request independently catches errors; job cards still usable.
- Expected fix: Use allSettled/optional boundaries.

## G2-10-017-089 [P1] GAP facet F23
- Files: src/components/placements/placement-operations-workspace.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:136-153,202-204 — Attention/jobserver independent failure and stale-data display.
- Expected fix: Decouple optional services, maintain job cards under partial failure.

## G2-10-011-034 [P1] GAP facet F07
- Files: src/components/placements/college-application-detail-drawer.tsx
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:772-825 — Notes invalid version returns 400 and concurrent edit 409 with 'These notes were updated by someone else. Please refresh and try again.'
- Expected fix: Provide stable version preconditions and exact conflict recovery.

## G2-10-011-081 [P1] GAP facet F21
- Files: src/components/placements/college-application-detail-drawer.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:7-12,755-935 — Integrated interview GET/schedule/update/cancel/completed/no-show/feedback APIs in detail.
- Expected fix: Map all interview actions, notifications and calendar export to coherent Super Admin workflow.

## G2-10-011-082 [P1] GAP facet F21
- Files: src/components/placements/college-application-detail-drawer.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:795-825; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:1087-1135 — Screening fetch/rescreen integrates legacy ScreeningService and assessment score.
- Expected fix: Provide supported scoring or explicitly document retired scoring strategy for legacy parity.

## G2-10-012-017 [P1] GAP facet F04
- Files: src/modules/placements/super-admin-drive-pipeline-service.ts, src/modules/placements/super-admin-drive-pipeline-model.ts
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:241-255 — Pipeline numbers are status SNAPSHOT; current applications in each of six status buckets.
- Expected fix: Keep snapshot semantics and show distinct applicant total; do not relabel snapshot as cumulative funnel.

## G2-10-012-022 [P1] MISSING facet F05
- Files: src/modules/placements/super-admin-drive-pipeline-service.ts
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:81-88 — Attention only for jobId === parsed selected job, not all college drives.
- Expected fix: Filter college-wide attention source by job ID before display.

## G2-10-012-029 [P1] GAP facet F07
- Files: src/app/(authenticated)/admin/placements/jobs/[jobId]/page.tsx, src/modules/placements/super-admin-drive-pipeline-service.ts
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:60-64 — Metrics GET failure shows 'Could not load pipeline metrics.' but leaves job header intact.
- Expected fix: Make pipeline optional/settled and render warning without hiding drive identity or buttons.

## G2-10-012-041 [P1] GAP facet F10
- Files: src/modules/placements/super-admin-drive-pipeline-service.ts, src/modules/placements/super-admin-drive-pipeline-model.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:860-883; docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:2278-2328 — GET /metrics aggregates legacy job_application.current application_status per college/job, plus other timing stats.
- Expected fix: Write status mapping, account for changed semantics (screening fallback, withdrawn excluded).

## G2-10-014-049 [P1] MISSING facet F12
- Files: src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/settings.js:145-159 — Open/Close reversible for non-drafts.
- Expected fix: Restore permitted reopen.

## G2-10-015-029 [P1] MISSING facet F06
- Files: src/components/placements/college-application-detail-drawer.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:2790-2837 — Candidate actions open interview schedule/edit/feedback modals.
- Expected fix: Integrate appointment actions in shortlist detail.
