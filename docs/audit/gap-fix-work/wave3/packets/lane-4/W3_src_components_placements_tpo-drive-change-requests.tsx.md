# Work packet (wave 3): edit src/components/placements/tpo-drive-change-requests.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u023-tpo-change-request-controller.md

## G2-5-023-003  [P1] MISSING  facet F01  effort L
- Legacy: `Invite the recruiter to review` is available from the drive flow. `docs/legacy-source/frontend/src/components/tpo/drive/InviteReviewer.jsx:69-93`
- vNext now: Mapped vNext change-request page contains no recruiter-review invite action. `src/app/(authenticated)/tpo/placements/jobs/[jobId]/change-requests/page.tsx:18-25`, `src/components/placements/tpo-drive-change-requests.tsx:53-77`
- Fix: Expose reviewed recruiter invite/attach flow with company-aware email and public-link choice.

## G2-5-023-033  [P1] MISSING  facet F09  effort L
- Legacy: Legacy recruiter invitation uses initial form modal, result modal, fallback email copy/open-in-mail, and public-link checkbox. `docs/legacy-source/frontend/src/components/tpo/drive/InviteReviewer.jsx:69-123`
- vNext now: vNext change-request screen does not expose invite workflow or result state. `src/app/(authenticated)/tpo/placements/jobs/[jobId]/change-requests/page.tsx:18-25`, `src/components/placements/tpo-drive-change-requests.tsx:53-125`
- Fix: Add invite modal, domain verification, manual letter fallback and result detail.
