# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-7-032-055 [P1] GAP facet F13
- Verification: DEFERRED — requires deeper cross-file behavior and permission verification; parity not asserted.
- Files: src/components/projects/project-admin-readiness-page.tsx
- Legacy: readiness/index.js:595-599 releases load error vs no releases
- Expected fix: Catch release-only failure without crashing selected detail page

## G2-7-035-029 [P1] GAP facet F07
- Verification: DEFERRED — requires deeper cross-file behavior and permission verification; parity not asserted.
- Files: src/components/projects/project-template-view.tsx
- Legacy: overview.js:666-671 Add at least one deliverable. on empty
- Expected fix: Show required deliverable validation in matching form before Publish

## G2-7-036-011 [P1] GAP facet F04
- Verification: OK — the CSV projection has all five columns in legacy order and includes templateId.
- Files: src/modules/projects/admin-workspace-page-export-model.ts
- Legacy: college-admin/projects/workspaces/index.js:402-418 five columns Workspace, Status, Progress, Mentor, Template ID
- Expected fix: Match five ordered columns including templateId

## G2-8-021-001 [P1] GAP facet F01
- Verification: DEFERRED — requires deeper cross-file behavior and permission verification; parity not asserted.
- Files: (none, new feature)
- Legacy: Absence record links a learner string ID to integer class schedule; no direct course/class key (docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Attend.java:16-27).
- Expected fix: Publish exact learnerId/classScheduleId to membershipId/eventId crosswalk; preserve scoped lookup.

## G2-8-027-020 [P1] GAP facet F06
- Verification: DEFERRED — requires deeper cross-file behavior and permission verification; parity not asserted.
- Files: (none, new feature)
- Legacy: Legacy feedback JSON rating number, comments string, recommendAction enum; no other types accepted (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/InterviewController.java:912-978).
- Expected fix: Restore rating1..5/comment/recommend controls under staff permission.

## G2-11-024-017 [P1] GAP facet F07
- Verification: DEFERRED — requires deeper cross-file behavior and permission verification; parity not asserted.
- Files: src/components/placements/tpo-college-rules-control.tsx
- Legacy: docs/legacy-source/frontend/src/pages/tpo/settings.js:107-114 route/beforeunload dirty warning
- Expected fix: Shared unsaved guard covering every form and browser Back.

## G2-11-024-047 [P1] GAP facet F20
- Verification: DEFERRED — requires deeper cross-file behavior and permission verification; parity not asserted.
- Files: src/components/placements/tpo-college-rules-control.tsx
- Legacy: docs/legacy-source/frontend/src/pages/tpo/settings.js:102-129 dirty guard includes route changes and beforeunload
- Expected fix: Cover popstate/Back and all editor sections.

## G2-11-030-038 [P1] GAP facet F15
- Verification: DEFERRED — requires deeper cross-file behavior and permission verification; parity not asserted.
- Files: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx
- Legacy: 929-937 interview cancel/no-show/completed transitions feed candidate notification
- Expected fix: Maintain notifications for interview changes/cancellation and status cascades.

## G2-12-028-054 [P1] GAP facet F22
- Verification: DEFERRED — requires deeper cross-file behavior and permission verification; parity not asserted.
- Files: src/modules/projects/college-project-roster-service.ts, src/modules/projects/college-project-roster-model.ts
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/team.js:227-278 learner roster and mentor mutation stored per workspace; docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/projects/AdminProjectLearnerAssignDTO.java:14-17 allows 500
- Expected fix: Align max capacity and retain event/audit history for add/remove

## G2-14-031-052 [P1] GAP facet F21
- Verification: DEFERRED — requires deeper cross-file behavior and permission verification; parity not asserted.
- Files: src/modules/courses/delivery-service.ts, src/modules/courses/teaching-assignment-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:283-470 semester course mappings feed teaching assignments
- Expected fix: Maintain consistent course mapping→offering→delivery→faculty chain

## G2-15-026-019 [P1] GAP facet F06
- Verification: DEFERRED — requires deeper cross-file behavior and permission verification; parity not asserted.
- Files: src/modules/placements/tpo-bulk-application-stage-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:579-646 bulk-status accepts up to100 numeric applicationIds,newStatus,rejectionReason,assessmentUrl
- Expected fix: Offer bulk legacy shortlist/reject/offer/hire choices with reason and assessment URL

## G2-15-026-038 [P1] GAP facet F12
- Verification: DEFERRED — requires deeper cross-file behavior and permission verification; parity not asserted.
- Files: src/modules/placements/tpo-bulk-application-stage-service.ts, src/modules/placements/screening-service.ts, src/modules/admin-ui/super-admin-placement-applications-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:29-30 status APPLIED, SHORTLISTED, ASSESSMENT, INTERVIEW, OFFERED, REJECTED, HIRED
- Expected fix: Publish clear mapping between legacy single lifecycle and vNext independent screening/stage/offer transitions

## G2-15-026-058 [P1] GAP facet F20
- Verification: DEFERRED — requires deeper cross-file behavior and permission verification; parity not asserted.
- Files: src/modules/placements/tpo-bulk-application-stage-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:579-665 partial failures show count, malformed types fail before writes
- Expected fix: Implement deterministic partial result and idempotency/retry contract for batch statuses

## G2-15-026-064 [P1] GAP facet F22
- Verification: DEFERRED — requires deeper cross-file behavior and permission verification; parity not asserted.
- Files: src/modules/placements/tpo-bulk-application-stage-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplicationStatusHistory.java:13-35 old/newStatus/changedAt/actor/rejectionReason
- Expected fix: Provide chronological single-application history merging screening/stage/offer events and actor/reason

## G2-8-017-071 [P1] GAP facet F22
- Verification: DEFERRED — requires deeper cross-file behavior and permission verification; parity not asserted.
- Files: (none, new feature)
- Legacy: LBE/model/ProjectTemplate.java:34-35 course_label VARCHAR(160) separate column
- Expected fix: Backfill/read courseLabel from blueprint overview; preserve editing and search semantics.

## G2-8-029-020 [P1] GAP facet F07
- Verification: DEFERRED — requires deeper cross-file behavior and permission verification; parity not asserted.
- Files: src/app/(authenticated)/admin/projects/templates/[templateId]/versions/[versionId]/page.tsx
- Legacy: Old snapshot JSON parse error says Version snapshot could not be read. Do not roll back without a verified diff. docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/versions.js:241-246.
- Expected fix: Block rollback on unreadable snapshot with exact field-specific explanation.

## G2-8-023-018 [P1] GAP facet F06
- Verification: DEFERRED — requires deeper cross-file behavior and permission verification; parity not asserted.
- Files: (none, new feature)
- Legacy: Legacy AddStudentsRequest learnerIds, includeIneligible boolean, reason string (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoApplicantController.java:70-81).
- Expected fix: Add explicit role choice and required reason only for override; map old scalar learner IDs.

## G2-8-023-036 [P1] GAP facet F10
- Verification: DEFERRED — requires deeper cross-file behavior and permission verification; parity not asserted.
- Files: src/modules/placements/tpo-applicant-review-service.ts
- Legacy: Legacy bulk transitions update JobApplication status and status history, enqueue held notice for Undo (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ApplicationTransitionService.java:115-151).
- Expected fix: Define canonical status machine and projection across application, screening, round and pipeline.

## G2-8-023-068 [P1] GAP facet F22
- Verification: DEFERRED — requires deeper cross-file behavior and permission verification; parity not asserted.
- Files: src/modules/placements/tpo-bulk-application-stage-service.ts
- Legacy: Legacy JobApplication linked by integer job and learner ID; legacy status machine transitions in ApplicationTransitionService (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ApplicationTransitionService.java:53-77,115-151).
- Expected fix: Create status/source/history crosswalk before migration and use single canonical lifecycle semantics.

## G2-8-022-036 [P1] GAP facet F11
- Verification: DEFERRED — requires deeper cross-file behavior and permission verification; parity not asserted.
- Files: (none, new feature)
- Legacy: Legacy seasons can be visible to TPO or college admin via controller access, not row filters in shown method (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoSeasonController.java:16-53; docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoAccessGuard.java:13-18).
- Expected fix: Confirm old college admin season-writing permission and provide equivalent allowed path if needed.

## G2-9-001-051 [P1] GAP facet F14
- Verification: DEFERRED — requires deeper cross-file behavior and permission verification; parity not asserted.
- Files: src/modules/activity/college-activity-export-model.ts
- Legacy: CSV Time,Who,What,Item,Action key,IP; IP from row (`docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:194-206`)
- Expected fix: Approve IP redaction/privileged export policy; don't expose without authorization.

## G2-9-005-026 [P1] GAP facet F07
- Verification: DEFERRED — requires deeper cross-file behavior and permission verification; parity not asserted.
- Files: src/app/(authenticated)/college/page.tsx
- Legacy: Missing college warning Some features are limited. Contact your administrator (`docs/legacy-source/frontend/src/pages/college-admin/dashboard.js:53-63`)
- Expected fix: Allow legacy warning+Quick Actions while blocking scoped data.

## G2-9-008-069 [P1] GAP facet F19
- Verification: DEFERRED — requires deeper cross-file behavior and permission verification; parity not asserted.
- Files: src/app/(authenticated)/college/hiring-dashboard/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:87-130` — Three GETs parallel and independent; previous scope data cleared when filter/scope changes
- Expected fix: Run report sections concurrently and preserve per-scope refresh behavior

## G2-9-016-031 [P1] MISSING facet F04
- Verification: DEFERRED — requires deeper cross-file behavior and permission verification; parity not asserted.
- Files: src/app/(authenticated)/college/placements/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:619-640` — Retention report data totalStaleCount, thresholdDays default180, sample with status/lastActivityAt up to200.
- Expected fix: Add lazy read-only retention DTO and sample truncation.

## G2-9-011-006 [P1] GAP facet F02
- Verification: DEFERRED — requires deeper cross-file behavior and permission verification; parity not asserted.
- Files: src/components/placements/college-drive-pipeline-overview.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/index.js:144-184` — Needs attention warning first, before company card, with grouped categories and candidate links
- Expected fix: Move banner above drive card and include candidate-specific attention rows
