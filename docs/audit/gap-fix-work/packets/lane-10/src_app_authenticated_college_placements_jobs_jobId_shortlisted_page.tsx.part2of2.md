# Work packet: edit src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx (part 2 of 2)

15 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-jobs-shortlisted.md

## G2-9-014-051  [P1] MISSING  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/api/Services/AdminService.js:823-850` — PUT /api/v1/admin/jobs/{jobId}/applications/{applicationId}/status and POST .../bulk-status.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx:40-69` — Shortlist page has no writes; sibling pipeline action service accessible elsewhere.
- Fix: Wire row/bulk mutations from shortlist page to college stage endpoints.

## G2-9-014-052  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/api/Services/AdminService.js:900-913` — GET applications CSV export filters by current status, department, source, batch, search.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx:53-56` — Exports screening-filtered list with 1000-row cap using vNext route.
- Fix: Match selected shortlist stage/filter semantics and full export reach.

## G2-9-014-056  [P1] MISSING  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/utils/placementApplicationTransitions.js:55-92` — Legacy bulk preview explicitly notes notifications, other applications withdrawn and interviews canceled on HIRED.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx:40-66` — No bulk-preview consequences or confirmation.
- Fix: Add status-specific consequence preview before action.

## G2-9-014-058  [P1] GAP  facet F11  effort S
- Legacy: `docs/legacy-source/frontend/src/components/admin/ModuleGroupGuard.jsx:27-74` — Disabled placements shows placement-off explanatory Result and recovery hint.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx:22-31` — Only role check; no contextual module-disabled explanation.
- Fix: Implement module-off state with super-admin recovery instructions.

## G2-9-014-060  [P1] GAP  facet F12  effort L
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:112-118` — Default shortlistedMode Assessment; all statuses include Interview, Offered, Hired.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx:27-31` — Selects only screening SHORTLISTED, no stage, forces status SUBMITTED.
- Fix: Make shortlist page represent pipeline status, not screening snapshot.

## G2-9-014-063  [P1] MISSING  facet F12  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:2025-2040` — Source EXTERNAL rows cannot be selected for admin bulk updates.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx:57-59` — Read-only shortlist, no per-source selection logic.
- Fix: Keep external candidate selection disabled with explanation.

## G2-9-014-072  [P1] MISSING  facet F15  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1950-1975` — Assessment modal confirms candidates receive in-app notification.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx:40-69` — No assessment notice/actions.
- Fix: Restore assessment distribution notification message.

## G2-9-014-079  [P1] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:112-118` — Assessment is initial filter on shortlisted page.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx:41-52` — Title Shortlisted and count shortlisted, no Assessment tab.
- Fix: Use legacy assessment-stage label and counts, while keeping overall Shortlisted context.

## G2-9-014-086  [P1] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:672-693` — Selections are reconciled against newly fetched rows to avoid stale bulk IDs.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx:40-66` — No selection; safer but missing operational workflow.
- Fix: Reintroduce selection with reconciliation on filter/data changes.

## G2-9-014-090  [P1] GAP  facet F21  effort L
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:208-245` — Interview calendar/detail, assessment link, applicant history/notes and CSV are linked integrations.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx:35-66` — Standalone query/list/export does not load those integrations.
- Fix: Restore entry points to interview/assessment/history/notes/offer workflows.

## G2-9-014-098  [P1] GAP  facet F23  effort L
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1547-1600` — Legacy full shortlist workspace shows company/drive status and all pipeline statuses.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx:40-59` — vNext read-only shortlist search/export with role/roll columns not in original order.
- Fix: Treat current view as incomplete new subset, not parity-complete.

## G2-9-014-038  [P2] MISSING  facet F07  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1940-2000` — Assessment URL invalid help Must be a valid URL starting with http:// or https://.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx:45-50` — Only search control, no URL validation.
- Fix: Add field-level assessment URL validation text.

## G2-9-014-041  [P2] MISSING  facet F08  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1594-1613` — Copy success Assessment link copied to clipboard; failure Failed to copy.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx:40-66` — No copy control or feedback.
- Fix: Use exact link copy toasts.

## G2-9-014-043  [P2] MISSING  facet F08  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1023-1026` — Cap warning Only the first 3000 matching applications were selected.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx:45-66` — No cap warning or selection.
- Fix: Add bounded bulk selection copy.

## G2-9-014-044  [P2] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:2025-2040` — Unfiltered empty No applications yet; filtered empty No applications match these filters.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx:57-59` — No shortlisted students and No shortlisted students match these filters.
- Fix: Use legacy empty wording depending on filter and status tab.
