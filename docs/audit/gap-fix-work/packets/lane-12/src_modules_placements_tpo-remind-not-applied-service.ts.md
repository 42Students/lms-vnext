# Work packet: edit src/modules/placements/tpo-remind-not-applied-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/tpo-applicant-controller.md

## G2-8-023-035  [P1] GAP  facet F10  effort M
- Legacy: Legacy GET applicants; GET not-applied; POST remind; POST apply on behalf; POST add-students; POST bulk-move/bulk-reject; POST undo (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoApplicantController.java:40-115).
- vNext now: New pipeline reads server service, writes through preview/confirm, remind service, bulkDrive service (src/app/(authenticated)/tpo/placements/jobs/[jobId]/applicants-pipeline/page.tsx:46-50; src/modules/placements/tpo-bulk-action-confirm-service.ts:26-129; src/modules/placements/tpo-remind-not-applied-service.ts:46-95; src/modules/placements/bulk-drive-service.ts:362-405).
- Fix: Produce endpoint-by-endpoint mapping including removed mutation payloads, scopes and response statuses.
