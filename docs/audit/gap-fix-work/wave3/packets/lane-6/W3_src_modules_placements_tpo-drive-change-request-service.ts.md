# Work packet (wave 3): edit src/modules/placements/tpo-drive-change-request-service.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u025-recruiter-change-request-controller.md, docs/audit/gap2/lane-5/u023-tpo-change-request-controller.md

## G2-16-025-025  [P0] MISSING  facet F10  effort L
- Legacy: DriveChangeRequestService.java:154-171 ACCEPT validates and immediately applies proposal to drive.
- vNext now: tpo-drive-change-request-service.ts:131-149 only updates request status and sends event.
- Fix: Implement field-specific mutation with validation/recheck and atomic job write on accept.

## G2-16-025-026  [P0] MISSING  facet F10  effort L
- Legacy: DriveChangeRequestService.java:173-191 ANSWER validates and applies field value.
- vNext now: tpo-drive-change-request-service.ts:138-149 marks ANSWERED with note only.
- Fix: Apply answered change value and persist answerValue; preserve OTHER free-text-only.

## G2-5-023-051  [P1] MISSING  facet F15  effort L
- Legacy: Legacy recruiter invite may email or return `email` template for manual sending when not sent. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/DriveReviewInviteService.java:24-30,93-132`
- vNext now: vNext change-request flow has no invite email/template operation. `src/modules/placements/tpo-drive-change-request-service.ts:58-75`, `src/app/(authenticated)/tpo/placements/jobs/[jobId]/change-requests/page.tsx:18-25`
- Fix: Implement per-drive recruit-review invite email and fallback written-out template.
