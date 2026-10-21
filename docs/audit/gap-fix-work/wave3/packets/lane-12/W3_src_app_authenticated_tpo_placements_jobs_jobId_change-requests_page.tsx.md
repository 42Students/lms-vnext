# Work packet (wave 3): edit src/app/(authenticated)/tpo/placements/jobs/[jobId]/change-requests/page.tsx

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u023-tpo-change-request-controller.md

## G2-5-023-003  [P1] MISSING  facet F01  effort L
- Legacy: `Invite the recruiter to review` is available from the drive flow. `docs/legacy-source/frontend/src/components/tpo/drive/InviteReviewer.jsx:69-93`
- vNext now: Mapped vNext change-request page contains no recruiter-review invite action. `src/app/(authenticated)/tpo/placements/jobs/[jobId]/change-requests/page.tsx:18-25`, `src/components/placements/tpo-drive-change-requests.tsx:53-77`
- Fix: Expose reviewed recruiter invite/attach flow with company-aware email and public-link choice.

## G2-5-023-033  [P1] MISSING  facet F09  effort L
- Legacy: Legacy recruiter invitation uses initial form modal, result modal, fallback email copy/open-in-mail, and public-link checkbox. `docs/legacy-source/frontend/src/components/tpo/drive/InviteReviewer.jsx:69-123`
- vNext now: vNext change-request screen does not expose invite workflow or result state. `src/app/(authenticated)/tpo/placements/jobs/[jobId]/change-requests/page.tsx:18-25`, `src/components/placements/tpo-drive-change-requests.tsx:53-125`
- Fix: Add invite modal, domain verification, manual letter fallback and result detail.

## G2-5-023-039  [P1] MISSING  facet F10  effort L
- Legacy: Legacy invite-recruiter accepts name/email/note/includePublicLink, validates work domain, attaches existing recruiter or generates lead invitation. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoChangeRequestController.java:104-121`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/DriveReviewInviteService.java:56-132`
- vNext now: No equivalent invite operation within mapped change-request API/page. `src/app/api/placements/jobs/[jobId]/change-requests/route.ts:8-19`, `src/app/(authenticated)/tpo/placements/jobs/[jobId]/change-requests/page.tsx:18-25`
- Fix: Provide authenticated per-drive recruiter invite with attach/new lead, public link and manual email fallback.

## G2-5-023-051  [P1] MISSING  facet F15  effort L
- Legacy: Legacy recruiter invite may email or return `email` template for manual sending when not sent. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/DriveReviewInviteService.java:24-30,93-132`
- vNext now: vNext change-request flow has no invite email/template operation. `src/modules/placements/tpo-drive-change-request-service.ts:58-75`, `src/app/(authenticated)/tpo/placements/jobs/[jobId]/change-requests/page.tsx:18-25`
- Fix: Implement per-drive recruit-review invite email and fallback written-out template.
