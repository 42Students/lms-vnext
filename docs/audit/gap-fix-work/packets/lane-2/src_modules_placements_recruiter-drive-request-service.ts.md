# Work packet: edit src/modules/placements/recruiter-drive-request-service.ts

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/recruiter-drives-new.md, docs/audit/gap2/lane-5/l12-u025-recruiter-plan-drive-controller.md

## G2-11-004-119  [P1] GAP  facet F22  effort L
- Legacy: Legacy `plan-drive` creates college job/requests with jobId receipt `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterPlanDriveController.java:47`
- vNext now: VNext request record status REQUEST or DRAFT + approvedJobId `src/modules/placements/recruiter-drive-request-service.ts:141`
- Fix: Write mapping of approved job, old job ID and review statuses

## G2-12-025-002  [P1] MISSING  facet F01  effort M
- Legacy: Legacy GET `/drive-groups` and `/{groupId}` for recruiter own college copies. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterPlanDriveController.java:53-61`
- vNext now: vNext own requests fetched from placementRecruiterDriveRequests, no drive-group read equivalent. `src/app/(authenticated)/hr/drives/new/page.tsx:83-92`, `src/modules/placements/recruiter-drive-request-service.ts:94-110`
- Fix: Expose historical group/linkage data or migrate to request list.

## G2-12-025-009  [P1] GAP  facet F04  effort M
- Legacy: Legacy group response driveGroupId and colleges array: collegeId/jobId/status/skippedReason. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterPlanDriveController.java:41-45`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterPlanDriveService.java:83-95`
- vNext now: vNext UUID request,status,draft,approvedJobId; no groupId/colleges list. `src/modules/placements/recruiter-drive-request-service.ts:138-153`, `src/db/schema/placement-drive-requests.ts:19-44`
- Fix: Provide response compatibility fields for existing clients.

## G2-12-025-026  [P1] GAP  facet F10  effort M
- Legacy: Legacy planDrive transaction INSERT drive_group, createRequest one college, attach job.driveGroupId. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterPlanDriveController.java:47-51`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterPlanDriveService.java:54-85`
- vNext now: vNext INSERT placementRecruiterDriveRequests, optionally autoapproves to DRAFT job. `src/modules/placements/recruiter-drive-request-service.ts:94-153`
- Fix: Preserve original job/group linkage or approved migration mapping.

## G2-12-025-029  [P1] GAP  facet F10  effort M
- Legacy: Legacy creates Job request immediately in placement jobs table. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterPlanDriveService.java:71-79`
- vNext now: vNext records request first; Job only on autoapprove/manual approval. `src/db/schema/placement-drive-requests.ts:19-44`, `src/modules/placements/recruiter-drive-request-service.ts:138-153`
- Fix: Reconcile request ID vs job ID for downstream lifecycle.

## G2-12-025-019  [P2] GAP  facet F07  effort M
- Legacy: Legacy recruiter without linked company `Your account has no company yet. Please contact the placement cell`. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterPlanDriveService.java:41-47`
- vNext now: vNext company/relationship checks yield FORBIDDEN rather than specific help. `src/modules/placements/recruiter-drive-request-service.ts:34-56`
- Fix: Expose safe recruiter-specific missing-company guidance.

## G2-12-025-020  [P2] GAP  facet F07  effort M
- Legacy: Legacy illegal state maps HTTP409 with direct error text. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterPlanDriveController.java:74-76`
- vNext now: vNext IDEMPOTENCY_CONFLICT / FORBIDDEN codes. `src/modules/placements/recruiter-drive-request-service.ts:94-110`
- Fix: Map safe error codes to legacy exact user messages.

## G2-12-025-022  [P2] GAP  facet F08  effort M
- Legacy: Legacy planDrive success HTTP201 with driveGroupId and each request status. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterPlanDriveController.java:47-51`
- vNext now: vNext create request transaction may return replayed/approved request, no group receipt. `src/modules/placements/recruiter-drive-request-service.ts:94-153`
- Fix: Show exact sent/approved/skipped per chosen college.
