# Work packet: edit src/components/placements/college-application-pipeline-controls.tsx (part 2 of 2)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-jobs-jobid-shortlisted.md, docs/audit/gap2/lane-2/admin-job-controller.md, docs/audit/gap2/lane-9/college-admin-jobs-applications.md, docs/audit/gap2/lane-10/superadmin-jobs-jobid-applications.md

## G2-10-015-062  [P1] MISSING  facet F15  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:2840-2877 — Reject modal says 'They will be notified by email.'
- vNext now: src/components/placements/college-application-pipeline-controls.tsx:163-167 — Email checkbox displays currently unavailable and prevents submission if checked.
- Fix: Implement email adapter or change promise with owner signoff.

## G2-10-015-079  [P1] GAP  facet F20  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:718-750 — Busy mutation guard and 409 conflict retry/reload for status changes.
- vNext now: src/components/placements/college-application-pipeline-controls.tsx:64-79 — New transaction stage versions/skip outcomes, generic error.
- Fix: Present stale status conflicts and retry.

## G2-10-015-081  [P1] GAP  facet F21  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1800-1908 — Bulk transition preview and stage-specific CTA set.
- vNext now: src/components/placements/college-application-pipeline-controls.tsx:117-139 — Generic dropdown/confirmation with in-app notifications.
- Fix: Map approved state actions to per-stage buttons.

## G2-10-015-087  [P1] GAP  facet F23  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1859-1908 — Distinct contextual bulk Passed/Failed/Hired actions, special failure states.
- vNext now: src/components/placements/college-application-pipeline-controls.tsx:128-139 — Generic stage bulk controls independent of selected shortlist stage.
- Fix: Scope and render stage-specific actions.

## G2-2-016-087  [P1] GAP  facet F06  effort L
- Legacy: Legacy bulk application status takes applicationIds,newStatus, optional assessmentUrl/saveAssessmentUrlToJob/rejectionReason `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:516-589`
- vNext now: New stage confirmation asks a generic reason and email checkbox, not assessment URL save-to-job policy `src/components/placements/college-application-pipeline-controls.tsx:128-167`
- Fix: Expose assessment-link and job-default preference when moving to ASSESSMENT

## G2-9-010-010  [P1] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1378-1406` — Each row has Details and Move to... status selector, Interview choice opens scheduling form
- vNext now: `src/components/placements/college-application-pipeline-controls.tsx:99-114` — Manage disclosure contains Details plus selector; Interview invokes stage move dialog
- Fix: Provide Schedule Interview route/modal rather than generic stage transition

## G2-9-010-014  [P1] MISSING  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1330-1378` — Legacy screening/match score and Partial badge with tooltip
- vNext now: `src/components/placements/college-application-pipeline-controls.tsx:96-99` — Screening status only; score/partial badge absent from table
- Fix: Add match score and Partial tooltip cell

## G2-9-010-025  [P1] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1994-2020` — Ant Table selectedRowKeys and current-page keys persist with reconciliation
- vNext now: `src/components/placements/college-application-pipeline-controls.tsx:29-46` — Selected IDs component state resets on query/key change and allPage toggles eligible only
- Fix: Keep selected IDs across page/filter and reconcile against current eligible rows

## G2-9-010-027  [P1] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1385-1425` — Per-row status selector validates transitions and prompts reinstate/Interview workflow
- vNext now: `src/components/placements/college-application-pipeline-controls.tsx:103-114` — Reinstate separate CTA and Move selector; dialog always asks reason min3
- Fix: Restore status-specific prompts and optional reason semantics

## G2-9-010-028  [P1] MISSING  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1081-1088` — Assessment URL must start http or https, prefilled job URL and option Save to job
- vNext now: `src/components/placements/college-application-pipeline-controls.tsx:151-162` — Move to Assessment generic reason field; no URL or save-to-job option
- Fix: Add assessment URL modal and proper optional job-level persistence

## G2-9-010-029  [P1] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:2840-2875` — Reject candidate modal optional Reason text area and Cancel or Reject
- vNext now: `src/components/placements/college-application-pipeline-controls.tsx:146-162` — Unified status dialog requires 3-1000 reason for every stage
- Fix: Make rejection reason optional with legacy limit, separate dialog label/actions

## G2-9-010-035  [P1] MISSING  facet F07  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1081-1088` — Invalid Assessment URL message Must be a valid URL starting with http:// or https://
- vNext now: `src/components/placements/college-application-pipeline-controls.tsx:151-162` — No assessment URL entry, therefore no matching error
- Fix: Implement Assessment URL field and validation/error copy

## G2-10-011-036  [P2] GAP  facet F08  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:738-748 — Move success toast 'Application status updated successfully'; error 'Failed to update application status'.
- vNext now: src/components/placements/college-application-pipeline-controls.tsx:64-79,170-174 — Result area says 'N updated, N skipped' with per-row reasons; no toast.
- Fix: Display parity toast and keep detailed outcomes for partial batch execution.

## G2-10-015-034  [P2] GAP  facet F08  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:738-748 — Single update toast Application status updated successfully or failure.
- vNext now: src/components/placements/college-application-pipeline-controls.tsx:64-79 — New bulk results block N updated/N skipped without toast.
- Fix: Add toast for successful individual move.

## G2-10-015-037  [P2] GAP  facet F08  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1859-1908 — Named bulk transition result uses legacy confirmation, failed rows modal.
- vNext now: src/components/placements/college-application-pipeline-controls.tsx:170-174 — Generic outcomes in dialog, user must inspect skipped list.
- Fix: Restore failed-row modal, count/actor context.

## G2-9-010-034  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:714-747` — Status mutation errors show response message and Failed to update application status
- vNext now: `src/components/placements/college-application-pipeline-controls.tsx:64-78` — Dialog API generic catch string shown inline and per-row skip reasons
- Fix: Map errors to exact legacy status-specific messages without exposing codes

## G2-9-010-038  [P2] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:738-747` — Status success toast Application status updated successfully
- vNext now: `src/components/placements/college-application-pipeline-controls.tsx:170-174` — Dialog result N updated N skipped, no toast
- Fix: Add exact single-update success toast

## G2-9-010-039  [P2] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1101-1123` — Assessment success Application moved to Assessment or N applications moved
- vNext now: `src/components/placements/college-application-pipeline-controls.tsx:151-174` — General moved/skipped report
- Fix: Restore assessment-specific confirmation/toast copy

## G2-9-010-040  [P2] GAP  facet F08  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1165-1195` — Bulk progress and success counts, failed modal with per-row details, 5/8-sec warnings
- vNext now: `src/components/placements/college-application-pipeline-controls.tsx:168-174` — Inline updated/skipped counts and brief outcome list in dialog
- Fix: Render separate failure details and retain timing for notification banners

## G2-2-016-100  [P3] GAP  facet F08  effort S
- Legacy: Bulk applications success `Bulk status update completed` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:590-592`
- vNext now: New confirmation displays `X updated, Y skipped` `src/components/placements/college-application-pipeline-controls.tsx:169-174`
- Fix: Include old completion label alongside useful per-row summary
