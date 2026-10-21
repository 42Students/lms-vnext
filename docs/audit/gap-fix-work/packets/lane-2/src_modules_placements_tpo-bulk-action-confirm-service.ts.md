# Work packet: edit src/modules/placements/tpo-bulk-action-confirm-service.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/tpo-applicant-controller.md

## G2-8-023-004  [P1] GAP  facet F01  effort M
- Legacy: Legacy POST bulk-move, bulk-reject, undo/{groupId} direct endpoints (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoApplicantController.java:90-115).
- vNext now: New preview/confirm actions and student-only run undo in bulk action panel (src/components/tpo/tpo-bulk-action-panel.tsx:133-172; src/modules/placements/tpo-bulk-action-confirm-service.ts:122-129).
- Fix: Restore application bulk undo or communicate non-undoable application decisions before confirmation.

## G2-8-023-035  [P1] GAP  facet F10  effort M
- Legacy: Legacy GET applicants; GET not-applied; POST remind; POST apply on behalf; POST add-students; POST bulk-move/bulk-reject; POST undo (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoApplicantController.java:40-115).
- vNext now: New pipeline reads server service, writes through preview/confirm, remind service, bulkDrive service (src/app/(authenticated)/tpo/placements/jobs/[jobId]/applicants-pipeline/page.tsx:46-50; src/modules/placements/tpo-bulk-action-confirm-service.ts:26-129; src/modules/placements/tpo-remind-not-applied-service.ts:46-95; src/modules/placements/bulk-drive-service.ts:362-405).
- Fix: Produce endpoint-by-endpoint mapping including removed mutation payloads, scopes and response statuses.

## G2-8-023-072  [P1] GAP  facet F23  effort M
- Legacy: Legacy flexible Move to... within sanctioned app statuses and reversible operations (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoApplicantService.java:47-63; docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ApplicationTransitionService.java:154-192).
- vNext now: New separates screening, test and interview stage, no application undo (src/modules/placements/tpo-bulk-application-stage-service.ts:19-23,75-132; src/modules/placements/tpo-bulk-action-confirm-service.ts:122-129).
- Fix: Write explicit intentional change decision with migration and reviewer acceptance tests.

## G2-8-023-023  [P2] GAP  facet F07  effort M
- Legacy: Legacy invalid Move target: Students can be moved only to Shortlisted, Test or Interview (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoApplicantService.java:53-57).
- vNext now: New invalid per-row stage returns STAGE_NOT_ALLOWED or generic safe failure (src/modules/placements/tpo-bulk-application-stage-service.ts:77-109; src/modules/placements/tpo-bulk-action-confirm-service.ts:85-95).
- Fix: Display named permissible transitions in precise inline explanation.
