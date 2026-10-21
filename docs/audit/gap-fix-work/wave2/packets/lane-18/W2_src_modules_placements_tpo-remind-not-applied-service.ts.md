# Work packet (wave 2): edit src/modules/placements/tpo-remind-not-applied-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/tpo-applicant-controller.md

## G2-8-023-008  [P2] GAP  facet F03  effort M
- Legacy: Legacy Not applied (n), Remind and Apply on behalf affordances (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoApplicantService.java:19-21,66-73).
- vNext now: New empty state links to Registered, not applied, reminder API supports preview counts (src/app/(authenticated)/tpo/placements/jobs/[jobId]/applicants-pipeline/page.tsx:121-125; src/modules/placements/tpo-remind-not-applied-service.ts:46-60).
- Fix: Show actionable count and disable reason on live drive workspace.
