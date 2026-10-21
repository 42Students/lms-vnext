# Work packet: edit src/components/placements/college-application-pipeline-controls.tsx (part 1 of 2)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-jobs-jobid-applications.md, docs/audit/gap2/lane-10/superadmin-jobs-jobid-shortlisted.md

## G2-10-011-020  [P1] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1321-1352 — Age default ascending table sort and Match Score sortable.
- vNext now: src/components/placements/college-application-pipeline-controls.tsx:80-115 — Columns do not configure sort; backend page order differs.
- Fix: Implement age default ascending and match score sorting with consistent paginated order.

## G2-10-011-023  [P1] GAP  facet F05  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1374-1442 — Action menu offers next valid transition per current application state.
- vNext now: src/components/placements/college-application-pipeline-controls.tsx:20-26,103-114 — Available options computed from different forward-only stage map.
- Fix: Match legacy admin transition choices or explicitly document policy changes.

## G2-10-011-025  [P1] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1385-1439 — Move to... has no mandatory freeform reason for ordinary transitions.
- vNext now: src/components/placements/college-application-pipeline-controls.tsx:146-162 — Generic dialog requires Reason length 3–1000 for every change.
- Fix: Limit required reason to approved policy cases or record explicit intentional divergence.

## G2-10-011-032  [P1] MISSING  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1077-1084 — Assessment URL rejects invalid protocol with 'Must be a valid URL starting with http:// or https://'.
- vNext now: src/components/placements/college-application-pipeline-controls.tsx:146-162 — No Assessment URL form; validation unavailable.
- Fix: Restore URL field and exact protocol check, including error location.

## G2-10-011-047  [P1] GAP  facet F10  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:637-703 — PUT /api/v1/admin/jobs/{jobId}/applications/{id}/status writes canonical applicationStatus and history.
- vNext now: src/components/placements/college-application-pipeline-controls.tsx:64-78; src/modules/placements/college-application-stage-service.ts:152-165 — POST /api/placements/college/jobs/{jobId}/pipeline writes separate college stage/history.
- Fix: Preserve effective applicant status/business outcomes and audit semantics in projection.

## G2-10-011-059  [P1] MISSING  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1529-1542 — Refresh error differentiates stale list warning ('Couldn't refresh applications') and first-failure error ('Failed to load data') with Retry.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:35-45; src/components/placements/college-application-pipeline-controls.tsx:64-79 — Invalid-filter ErrorState and mutation error; no scoped stale-list warning/Retry.
- Fix: Render stale-data warning and in-place Retry without dropping last valid rows.

## G2-10-011-078  [P1] GAP  facet F20  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:90-95,319-325,590-610 — Uses AbortController and scope keys to prevent old-college network responses replacing new-college state.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:27-45; src/components/placements/college-application-pipeline-controls.tsx:47-79 — Server context re-evaluation per request; client detail fetch doesn't explicitly abort on scope change.
- Fix: Guard stale detail and mutation responses on selected-college switch; close stale dialogs.

## G2-10-011-079  [P1] GAP  facet F20  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:718-750; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:687-699 — Duplicate UI writes blocked by loading refs; status optimistic lock conflicts return 409.
- vNext now: src/components/placements/college-application-pipeline-controls.tsx:64-79; src/modules/placements/college-application-stage-service.ts:49-70 — Busy flag + transaction row lock; list stages versioned separately.
- Fix: Review edit-version/CAS for repeated stage requests and display conflict reconciliation.

## G2-10-015-007  [P1] GAP  facet F02  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1830-1913 — Status-specific bulk operations + Refresh beside selection summary.
- vNext now: src/components/placements/college-application-pipeline-controls.tsx:116-140 — Generic bulk select/action regardless stage, no Refresh.
- Fix: Use Assessment/Interview/Offered contextual CTA toolbar.

## G2-10-015-011  [P1] MISSING  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1860-1907 — Buttons 'Mark Passed','Mark Failed','Move to Offered','Mark Hired', and red Reject, varying by tab.
- vNext now: src/components/placements/college-application-pipeline-controls.tsx:128-139 — Generic bulk stage dropdown and 'Act on N selected'.
- Fix: Reintroduce role-specific distinct buttons, count suffix, red actions.

## G2-10-015-016  [P1] MISSING  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1348-1368 — Match Score rounded percentage with purple/cyan bands and Partial tooltip.
- vNext now: src/components/placements/college-application-pipeline-controls.tsx:96-99 — Numeric score column absent; Screening strings.
- Fix: Return actual saved screening score and partial provenance.

## G2-10-015-025  [P1] MISSING  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1859-1874 — On ASSESSMENT: Mark Passed moves to INTERVIEW; Mark Failed rejects.
- vNext now: src/components/placements/college-application-pipeline-controls.tsx:128-139 — Generic stage list; cannot invoke named Passed/Failed.
- Fix: Add precise actions and confirmation.

## G2-10-015-026  [P1] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1876-1890 — On INTERVIEW: Move to Offered or Reject.
- vNext now: src/components/placements/college-application-pipeline-controls.tsx:128-139 — Generic bulk dropdown, offered option even if inappropriate.
- Fix: Restrict offered CTA to valid stage and prerequisites.

## G2-10-015-027  [P1] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1893-1908 — On OFFERED: Mark Hired or Reject; Hired has distinct irreversible consequences.
- vNext now: src/components/placements/college-application-pipeline-controls.tsx:128-139 — Generic Mark Hired choice, service guards actual offers.
- Fix: Show consequences and explicit hire confirmation.

## G2-10-015-030  [P1] MISSING  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1917-1988 — Moving to Assessment modal optional URL http(s), save-to-job checkbox checked.
- vNext now: src/components/placements/college-application-pipeline-controls.tsx:146-162 — Generic mandatory Reason; no assessment URL.
- Fix: Restore URL validation and save-to-job checkbox.

## G2-10-015-031  [P1] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:2840-2877 — Reject reason optional, max500, placeholder 'e.g. Does not meet requirements'.
- vNext now: src/components/placements/college-application-pipeline-controls.tsx:146-167 — Every action requires reason min3/max1000.
- Fix: Use optional reason for rejection or document strengthened rule.

## G2-10-015-033  [P1] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1378-1442; docs/legacy-source/frontend/src/utils/placementApplicationTransitions.js:5-14 — Admin transitions allow INTERVIEW→ASSESSMENT, OFFERED→INTERVIEW, HIRED→OFFERED.
- vNext now: src/modules/placements/college-stage-action-model.ts:24-32; src/components/placements/college-application-pipeline-controls.tsx:20-26 — Forward-only vNext disallows these reversals.
- Fix: Keep reversal semantics or record deliberate retirement.

## G2-10-015-039  [P1] GAP  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:2840-2930 — Single/bulk reject modals with discard confirmation for unsaved reason.
- vNext now: src/components/placements/college-application-pipeline-controls.tsx:146-175 — Generic dialog Close drops typed reason without discard prompt.
- Fix: Guard unsaved rejection reason.

## G2-10-015-044  [P1] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:516-603 — Bulk POST validates per-application transition and returns failures/notification outcomes.
- vNext now: src/modules/placements/college-application-stage-service.ts:70-98; src/components/placements/college-application-pipeline-controls.tsx:64-78 — New POST pipeline with reason and confirmed flag, different state writes.
- Fix: Reconcile side effects, partial errors and stage history.

## G2-10-015-061  [P1] GAP  facet F15  effort M
- Legacy: docs/legacy-source/frontend/src/utils/placementApplicationTransitions.js:73-111 — Bulk preview explicitly states students told and hired cascades.
- vNext now: src/components/placements/college-application-pipeline-controls.tsx:139-165 — New dialog states in-app notifications; email option currently unavailable.
- Fix: Align recipient and delivery outcomes without false email promise.
