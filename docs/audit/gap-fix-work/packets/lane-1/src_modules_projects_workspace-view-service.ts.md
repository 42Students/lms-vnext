# Work packet: edit src/modules/projects/workspace-view-service.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/superadmin-workspace-delivery.md, docs/audit/gap2/lane-4/superadmin-project-workspace-audit.md, docs/audit/gap2/lane-7/u008-college-admin-workspace-delivery.md, docs/audit/gap2/lane-7/u012-college-admin-workspace-readiness.md, docs/audit/gap2/lane-7/u027-mentor-project-detail.md

## G2-3-029-056  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/frontend/src/components/admin/projects/WorkspaceDeliveryOverview.jsx:17-45`
- vNext now: `src/modules/projects/workspace-view-service.ts:37-66`
- Fix: Legacy workspace.resolvedDelivery flat DTO vs vNext finalDelivery.submissions, reviews, evaluations, versioned attachments; specify full compatibility/projection crosswalk.

## G2-4-029-032  [P1] MISSING  facet F10  effort S
- Legacy: GET `/api/v1/admin/projects/{id}/resource-audit?collegeId` (`docs/legacy-source/frontend/src/api/Services/AdminService.js:476-477`)
- vNext now: Workspace view reads listProjectActivity, not separate audit API (`src/modules/projects/workspace-view-service.ts:29-67`)
- Fix: Expose college-scoped read of resource history with exact fields.

## G2-7-008-055  [P1] GAP  facet F22  effort L
- Legacy: LBE/dto/projects/ProjectWorkspaceDTO.java:8-33: delivery/resolvedDelivery JSON fields including reviewStatus, revisionCount, submitted and reviewed actor names.
- vNext now: V/db/schema/projects.ts:820-930: project_submissions/project_submission_reviews normalized statuses and versions; service workspace-view-service.ts:37-66 loads them.
- Fix: Implement presentation adapter for legacy reviewStatus, actual revisionCount, review actor and timestamps.

## G2-7-012-013  [P1] MISSING  facet F04  effort M
- Legacy: readiness.js:30-38 Proof coverage completed tasks with submissionUrl over completed tasks
- vNext now: workspace-view-service.ts:55-58 exposes submissions; project-workspace.tsx:364-416 omits metric
- Fix: Compute DONE task evidence coverage and zero case

## G2-7-012-062  [P1] GAP  facet F22  effort M
- Legacy: readiness.js:30-38 `submissionUrl` on task used for proof
- vNext now: workspace-view-service.ts:55-58 task submissions separate; readiness-service.ts:90-115 no proof join
- Fix: Map proof to normalized task evidence relationship

## G2-7-027-090  [P1] GAP  facet F22  effort L
- Legacy: PDC:1181-1187 resolvedOverview/Sprints/Tasks/MeetingsList DTO arrays
- vNext now: workspace-view-service.ts:33-67 reads normalized SQL resources/releases/tasks/members/meetings
- Fix: Create field-level DTO->schema/enum crosswalk, including defaults
