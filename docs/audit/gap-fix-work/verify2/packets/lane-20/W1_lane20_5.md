# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-4-022-011 [P1] GAP facet F04
- Files: src/components/tpo/tpo-students-spreadsheet.tsx, src/components/tpo/tpo-students-drive-visibility.tsx
- Legacy: Legacy learnerIds are integer list, jobId/courseId/assessmentId numeric in BulkRequest. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentsHubController.java:30-46`)
- Expected fix: Map old numeric identifiers to scoped UUID membership, job and content.

## G2-4-022-012 [P1] GAP facet F04
- Files: src/app/(authenticated)/tpo/students/page.tsx, src/components/tpo/tpo-students-spreadsheet.tsx
- Legacy: Legacy placement registration accepts choice,label,detail string fields. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentsHubController.java:78-82`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentsHubController.java:121-125`)
- Expected fix: Map choice/label/detail and registration history into new participation events.

## G2-4-028-032 [P1] MISSING facet F10
- Files: src/app/(authenticated)/tpo/settings/team/page.tsx
- Legacy: Settings team renders TeamPeople mutation actions (`docs/legacy-source/frontend/src/pages/tpo/settings.js:152`)
- Expected fix: Migrate create/remove/reassign APIs.

## G2-5-002-037 [P1] GAP facet F10 Actions/side effects
- Files: (none, new feature)
- Legacy: Application navigation uses jobApplication ID. (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:624-632; docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:1040-1043)
- Expected fix: Open exact application in job with focus anchor.

## G2-5-006-018 [P1] GAP facet F05 Tables/lists
- Files: (none, new feature)
- Legacy: CSV data equals day grid, not per-session status list (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:449-467)
- Expected fix: Match CSV month cell aggregation and column list.

## G2-5-008-030 [P1] GAP facet F06 Forms
- Files: (none, new feature)
- Legacy: Edit Maximum students 1–200 same as create (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:91-105)
- Expected fix: Match upper bound and lowerLimit invariant.

## G2-5-010-011 [P1] GAP facet F03 Visible elements
- Files: (none, new feature)
- Legacy: Option error warning with Reload icon Retry options (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:429-435)
- Expected fix: Use explicit Retry options, not empty options.

## G2-5-012-027 [P1] GAP facet F05
- Files: src/modules/placements/placement-calendar-model.ts
- Legacy: Agenda spans anchor day through anchor+30 days (`docs/legacy-source/frontend/src/pages/tpo/calendar.js:54-58`)
- Expected fix: Use rolling 30-day range anchored on selected date

## G2-5-012-051 [P1] GAP facet F09
- Files: src/components/placements/tpo-week-hour-calendar.tsx
- Legacy: Legacy empty week-grid click opens New follow-up at clicked time (`docs/legacy-source/frontend/src/pages/tpo/calendar.js:333-341`)
- Expected fix: Ensure verified TPO can create by clicking a slot and preserve time

## G2-5-013-016 [P1] GAP facet F05
- Files: src/modules/placements/tpo-bulk-application-stage-service.ts
- Legacy: Legacy bulk status applications cap 100 and reports failed per ID (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AdminJobService.java:100-116`)
- Expected fix: Wrap stage operations into 100-item batch with per-item results

## G2-5-013-045 [P1] GAP facet F10
- Files: src/modules/placements/tpo-bulk-application-stage-service.ts
- Legacy: Legacy updateApplicationStatus has optional assessment URL and rejection reason, two overloads (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AdminJobService.java:79-98`)
- Expected fix: Build mapping for each canonical stage, notes and assessment persistence policy

## G2-5-013-046 [P1] GAP facet F10
- Files: src/modules/placements/tpo-bulk-application-stage-service.ts
- Legacy: Legacy bulkUpdateApplicationStatus has two overloads and independent per-item transaction (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AdminJobService.java:100-116`)
- Expected fix: Add batch orchestration, 100 cap and failed-list response semantics

## G2-5-022-014 [P1] GAP facet F06
- Files: src/modules/placements/tpo-academic-import-service.ts
- Legacy: Legacy upsert updates only nonnull provided academic fields `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoStudentService.java:45-61`
- Expected fix: Implement partial field merge for all legacy verified evidence fields.

## G2-5-022-026 [P1] GAP facet F10
- Files: src/modules/placements/tpo-academic-import-service.ts
- Legacy: Legacy upsert sets source VERIFIED, importedAt now, importBatchId null `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoStudentService.java:43-61`
- Expected fix: Match single-edit provenance; safely re-evaluate all existing applications.

## G2-5-023-038 [P1] GAP facet F10
- Files: src/app/api/placements/jobs/[jobId]/change-requests/route.ts, src/modules/placements/tpo-drive-change-request-service.ts
- Legacy: Legacy `/internal-notes` GET/POST reads/writes Team DRIVE messages with kind MESSAGE and deleted filtering. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoChangeRequestController.java:75-102`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoTeamThreadService.java:275-296`
- Expected fix: Preserve Team DRIVE thread integration and legacy notes access in drive Discussion.

## G2-5-030-024 [P1] GAP facet F07
- Files: src/app/(authenticated)/admin/colleges/[collegeId]/page.tsx
- Legacy: Legacy dirty close confirmation lists dirty section names. `docs/legacy-source/frontend/src/pages/superadmin/sections/ManageCollegeDrawer.js:67-80`
- Expected fix: Warn with exact dirty section names and cancel/confirm semantics.

## G2-6-020-015 [P1] GAP facet F05
- Files: (none, new feature)
- Legacy: Legacy repo query for org departments joins college org_id (DepartmentRepository.java:28-31).
- Expected fix: Implement org/global listing when superadmin scope requires it.

## G2-6-027-044 [P1] GAP facet F14
- Files: (none, new feature)
- Legacy: Legacy apply accepts external resumeUrl in body or query (JobController.java:395-405,439-444).
- Expected fix: Implement signed-upload/resume-reference consent or document intentional no-file release.

## G2-11-017-024 [P1] MISSING facet F10
- Files: (none, new feature)
- Legacy: On mount and Retry fetch GET /api/v1/tpo/counts; no writes (more.js:59-65; TpoHubService.js:37-48).
- Expected fix: Add scoped GET counts reader and retriable UI.

## G2-11-023-035 [P1] GAP facet F12
- Files: (none, new feature)
- Legacy: Proof not attached prevents blind bulk approve but still allows per-item review (RequestsPanel.js:261-276).
- Expected fix: Add proof missing flags and explicit skip/error handling to bulk preview.

## G2-11-029-025 [P1] GAP facet F10
- Files: (none, new feature)
- Legacy: updateProjectTemplate payload only sprints plus templateScalars, tasks only if orphaned (sprints.js:82-116).
- Expected fix: Use merge/section PATCH or guarantee version conflict and no loss of concurrent edits.

## G2-14-029-012 [P1] GAP facet F05
- Files: (none, new feature)
- Legacy: Act on all shown or selected rows across full browser-filtered roster (batches/[batchId].js:316-340).
- Expected fix: Expose full selection semantics and explicit per-page limits.

## G2-6-025-049 [P1] GAP facet F22
- Files: (none, new feature)
- Legacy: Legacy signed response: URL,key,publicUrl,uploadReceiptId (PresignUploadResponseDTO.java:11-31).
- Expected fix: Wire material FILE rows with grant/complete/attestation transition and scoped signed downloads.

## G2-6-029-056 [P1] GAP facet F19
- Files: src/components/projects/super-admin-template-page-export.tsx
- Legacy: Legacy CSV exports whole currently fetched filtered list (templates/index.js:270-295).
- Expected fix: Add server filtered export endpoint or clear current-page-only label and scope.

## G2-6-030-050 [P1] GAP facet F13
- Files: (none, new feature)
- Legacy: Legacy departments error warns assignment unavailable but create still allowed without department, with Retry button (LectureHalls.js:306-310,328-336).
- Expected fix: Make department optional dependency recoverable, keep room create/edit usable.

## Lane 9 verification disposition (2026-10-22)

- DEFERRED — G2-4-022-011: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-4-022-012: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-4-028-032: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-5-002-037: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-5-006-018: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-5-008-030: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-5-010-011: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-5-012-027: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-5-012-051: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-5-013-016: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-5-013-045: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-5-013-046: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-5-022-014: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-5-022-026: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-5-023-038: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-5-030-024: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-6-020-015: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-6-027-044: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-11-017-024: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-11-023-035: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-11-029-025: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-14-029-012: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-6-025-049: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-6-029-056: implementation and regression checks not independently completed; no parity claim.
- DEFERRED — G2-6-030-050: implementation and regression checks not independently completed; no parity claim.
