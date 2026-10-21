# Work packet (wave 2): edit src/app/api/placements/jobs/[jobId]/eligibility/[membershipId]/route.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/job-eligibility-override.md, docs/audit/gap2/lane-17/job-eligibility-override-repository.md

## G2-15-015-002  [P2] GAP  facet F01  effort M
- Legacy: Legacy TPO drive workspace set/remove override. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoDriveExtrasService.java:379-395`)
- vNext now: New PUT/DELETE per job/member UUID API. (`src/app/api/placements/jobs/[jobId]/eligibility/[membershipId]/route.ts:46-100`)
- Fix: Map old TPO override action placement into drive/eligibility panel.

## G2-15-015-042  [P2] GAP  facet F13  effort S
- Legacy: Invalid reason produces A reason is required. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoDriveExtrasService.java:384-386`)
- vNext now: New Zod error response via apiErrorResponse. (`src/app/api/placements/jobs/[jobId]/eligibility/[membershipId]/route.ts:46-69`)
- Fix: Render precise same copy and keep draft data.

## G2-17-014-002  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoWorkspaceController.java:211-226 — TPO drive controller exposes POST overrides and DELETE by learner ID.
- vNext now: src/app/api/placements/jobs/[jobId]/eligibility/[membershipId]/route.ts:46-102 — vNext PUT/DELETE eligibility/{membershipId}, GET detail.
- Fix: Preserve legacy endpoint navigation and membership ID mapping.

## G2-17-014-013  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoWorkspaceController.java:209-216 — POST takes learnerId, type, reason; user ID from p() security.
- vNext now: src/app/api/placements/jobs/[jobId]/eligibility/[membershipId]/route.ts:56-65 — PUT takes jobId/membershipId path and JSON decision/reason.
- Fix: Ensure form sends exact decision/reason and stable expectedOverrideId.
