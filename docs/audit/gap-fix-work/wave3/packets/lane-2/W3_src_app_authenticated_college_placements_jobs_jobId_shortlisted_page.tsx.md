# Work packet (wave 3): edit src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-jobs-shortlisted.md

## G2-9-014-014  [P1] MISSING  facet F03  effort L
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1815-1898` — Mark Passed, Mark Failed, Move to Offered, Mark Hired, Reject buttons per tab.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx:40-66` — All pipeline action buttons absent.
- Fix: Add per-status stage action buttons with legacy labels.

## G2-9-014-033  [P1] MISSING  facet F06  effort L
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1394-1450` — Move to INTERVIEW opens schedule editor with date/time/meeting URL, not instant move.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx:35-66` — No row controls/scheduling editor.
- Fix: Integrate interview scheduler for eligible applicants.

## G2-9-014-047  [P1] MISSING  facet F09  effort L
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:78-101` — Application Details modal and notes/history/offer letter/interviews linked overlays.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx:57-59` — No row click or detail overlay.
- Fix: Reuse full applicant detail drawer and its staged actions.
