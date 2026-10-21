# Work packet (wave 3): edit src/app/api/placements/jobs/[jobId]/change-requests/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u023-tpo-change-request-controller.md

## G2-5-023-039  [P1] MISSING  facet F10  effort L
- Legacy: Legacy invite-recruiter accepts name/email/note/includePublicLink, validates work domain, attaches existing recruiter or generates lead invitation. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoChangeRequestController.java:104-121`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/DriveReviewInviteService.java:56-132`
- vNext now: No equivalent invite operation within mapped change-request API/page. `src/app/api/placements/jobs/[jobId]/change-requests/route.ts:8-19`, `src/app/(authenticated)/tpo/placements/jobs/[jobId]/change-requests/page.tsx:18-25`
- Fix: Provide authenticated per-drive recruiter invite with attach/new lead, public link and manual email fallback.
