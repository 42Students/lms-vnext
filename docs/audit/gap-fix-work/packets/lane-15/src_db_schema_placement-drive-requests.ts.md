# Work packet: edit src/db/schema/placement-drive-requests.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/l12-u025-recruiter-plan-drive-controller.md

## G2-12-025-009  [P1] GAP  facet F04  effort M
- Legacy: Legacy group response driveGroupId and colleges array: collegeId/jobId/status/skippedReason. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterPlanDriveController.java:41-45`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterPlanDriveService.java:83-95`
- vNext now: vNext UUID request,status,draft,approvedJobId; no groupId/colleges list. `src/modules/placements/recruiter-drive-request-service.ts:138-153`, `src/db/schema/placement-drive-requests.ts:19-44`
- Fix: Provide response compatibility fields for existing clients.

## G2-12-025-029  [P1] GAP  facet F10  effort M
- Legacy: Legacy creates Job request immediately in placement jobs table. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterPlanDriveService.java:71-79`
- vNext now: vNext records request first; Job only on autoapprove/manual approval. `src/db/schema/placement-drive-requests.ts:19-44`, `src/modules/placements/recruiter-drive-request-service.ts:138-153`
- Fix: Reconcile request ID vs job ID for downstream lifecycle.

## G2-12-025-050  [P1] GAP  facet F22  effort M
- Legacy: Legacy drive_group row int PK, shared_form_json and Job.drive_group_id with per-college job copies. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterPlanDriveService.java:23-27,66-83`
- vNext now: vNext placement_recruiter_drive_requests UUID, draft JSON, no group FK. `src/db/schema/placement-drive-requests.ts:19-44`
- Fix: Decide group migration and history retention.
