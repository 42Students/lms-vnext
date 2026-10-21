# Work packet: edit src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx (part 1 of 2)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-jobs-shortlisted.md

## G2-9-014-004  [P1] GAP  facet F01  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/shortlisted.js:20-31` — No-college assignment warning describes how to contact administrator.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx:22-25` — Missing COLLEGE_ADMIN membership redirects /dashboard.
- Fix: Display explicit unassigned college recovery message.

## G2-9-014-009  [P1] MISSING  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1780-1930` — Selection-info banners and stage-sensitive action bar above applications table.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx:51-57` — Count/export only, no selection/action block.
- Fix: Add stage-sensitive bulk toolbar and clear selection.

## G2-9-014-010  [P1] GAP  facet F02  effort L
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1992-2040` — Table skeleton, data grid and multiple dialogs/detail overlays.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx:57-66` — DataTable and pagination only; no detail overlays.
- Fix: Restore application detail and stage-action components.

## G2-9-014-016  [P1] MISSING  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1394-1446` — Per-row View Details and Move to... select, destructive rejection styled danger.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx:35-39` — Only Student Roll Role columns, no row action.
- Fix: Restore row action controls and keyboard navigable details.

## G2-9-014-017  [P1] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1256-1310` — Learner Name, Email, College, Source, Current Status, Applied Date, Age, Match Score and Actions.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx:35-39` — Only Student, Roll, Role.
- Fix: Add legacy columns in order, relegate extra Roll/Role to configurable columns.

## G2-9-014-018  [P1] MISSING  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1350-1378` — Match score rendered rounded percentage, Purple/Cyan/neutral thresholds; Partial tooltip.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx:35-39` — No screening score or partial-state indicator.
- Fix: Join screening results and render score/Partial badge.

## G2-9-014-023  [P1] GAP  facet F05  effort L
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:112-117` — Shortlist defaults ASSESSMENT status tab, with tabs for ASSESSMENT, INTERVIEW, OFFERED and other statuses.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx:27-31` — Hardcodes application status SUBMITTED, screening SHORTLISTED; no stage tabs.
- Fix: Filter by placement *stage*, default ASSESSMENT; preserve stage switches.

## G2-9-014-026  [P1] MISSING  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:2025-2040` — Table rowCheckbox with disabled EXTERNAL and cross-page selected IDs.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx:57-66` — No checkbox selection.
- Fix: Restore selection and disabled rules.

## G2-9-014-027  [P1] MISSING  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1778-1815` — Select current page/all N matching, with contextual filter banner and clear.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx:45-66` — No selection, hence no select-all matching controls.
- Fix: Add bounded select-all with filter context and clear.

## G2-9-014-030  [P1] MISSING  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1020-1026` — First 3,000 matching can be bulk selected; warnings if more.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx:45-66` — No bulk actions or selection cap UI.
- Fix: Add cap/warning and robust page-spanning selection.

## G2-9-014-032  [P1] MISSING  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1077-1125` — Assessment modal URL optional http(s), maxLength2048; Save to Job checkbox defaults true.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx:40-69` — No assessment form or modal.
- Fix: Restore assessment URL form, default checkbox and conditional warning.

## G2-9-014-034  [P1] MISSING  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:215-219` — Reject modals retain optional rejection reason and batch confirmation.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx:35-66` — No Reject form.
- Fix: Expose per-row/bulk rejection reason/confirmation.

## G2-9-014-036  [P1] MISSING  facet F07  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1379-1420` — Invalid stage transition warns Cannot move from X to Y.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx:28-29` — Only Invalid applicant filters is shown; no transition control.
- Fix: Surface guarded transition warning at action row.

## G2-9-014-037  [P1] MISSING  facet F07  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1130-1162` — Bulk preflight rejects invalid status targets before mutation with counts.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx:40-69` — No mutation validation or preflight.
- Fix: Expose stage-aware preflight, skipped IDs and no-op warning.

## G2-9-014-039  [P1] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1531-1548` — API fetch failure warning with Retry and Close while keeping existing job.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx:26-31` — Query errors render Invalid applicant filters; service failures abort server render.
- Fix: Add scoped retry/error boundary and keep last successful results.

## G2-9-014-042  [P1] MISSING  facet F08  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1100-1124` — Assessment bulk success n application(s) moved to Assessment; failure Failed to move to Assessment.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx:40-66` — No mutation success/error messages.
- Fix: Restore stage-specific success/failure notices.

## G2-9-014-045  [P1] MISSING  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1836-1910` — Stage action anchored Popconfirms with Mark Passed, Move and Mark Hired confirmations.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx:40-66` — No confirmation popovers.
- Fix: Restore stage-specific confirmations.

## G2-9-014-046  [P1] MISSING  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1925-1992` — Assessment modal supports optional link and discard-unsaved confirm.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx:40-66` — No modal.
- Fix: Provide legacy Assessment dialog and dirty cancellation safeguard.

## G2-9-014-048  [P1] MISSING  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:215-220` — Separate single/bulk Reject and bulk-failure detail modals.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx:40-66` — No Reject, partial results or failure modal.
- Fix: Build confirmation/reason and per-row failure detail.

## G2-9-014-049  [P1] MISSING  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1394-1446` — Row Move to INTERVIEW triggers interview editor; Rejected->Applied confirm.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx:35-59` — Read-only rows and no row menu.
- Fix: Expose guarded Schedule and Reinstatement dialogs.
