# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-10-009-114 [P1] GAP facet F21
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/modules/placements/recruiter-message-email-inbound-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:109-121` posts authorized replies into TpoMessagesService; unknown thread/sender recorded
- Expected fix: Link recruiter posting outcome to inbox read model without duplicate notifications

## G2-10-016-046 [P1] MISSING facet F10
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/app/(authenticated)/admin/placements/drives/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:399-477 — Legacy deletion-impact GET and delete mutation available from row.
- Expected fix: Add navigable impact preview with API mapping.

## G2-10-011-020 [P1] GAP facet F05
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/components/placements/college-application-pipeline-controls.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1321-1352 — Age default ascending table sort and Match Score sortable.
- Expected fix: Implement age default ascending and match score sorting with consistent paginated order.

## G2-10-011-025 [P1] GAP facet F06
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/components/placements/college-application-pipeline-controls.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1385-1439 — Move to... has no mandatory freeform reason for ordinary transitions.
- Expected fix: Limit required reason to approved policy cases or record explicit intentional divergence.

## G2-10-011-032 [P1] MISSING facet F07
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/components/placements/college-application-pipeline-controls.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1077-1084 — Assessment URL rejects invalid protocol with 'Must be a valid URL starting with http:// or https://'.
- Expected fix: Restore URL field and exact protocol check, including error location.

## G2-10-011-045 [P1] GAP facet F10
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/modules/placements/college-application-stage-service.ts, src/modules/placements/college-drive-applications-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:445-514 — GET /api/v1/admin/jobs/{jobId}/applications, 0-based page+size max100, status/source/academic filters and user names.
- Expected fix: Create exact field mapping/status projection, especially actor names, for page parity.

## G2-10-011-047 [P1] GAP facet F10
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/components/placements/college-application-pipeline-controls.tsx, src/modules/placements/college-application-stage-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:637-703 — PUT /api/v1/admin/jobs/{jobId}/applications/{id}/status writes canonical applicationStatus and history.
- Expected fix: Preserve effective applicant status/business outcomes and audit semantics in projection.

## G2-10-011-059 [P1] MISSING facet F13
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx, src/components/placements/college-application-pipeline-controls.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1529-1542 — Refresh error differentiates stale list warning ('Couldn't refresh applications') and first-failure error ('Failed to load data') with Retry.
- Expected fix: Render stale-data warning and in-place Retry without dropping last valid rows.

## G2-10-011-067 [P1] GAP facet F15
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/modules/placements/college-application-stage-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:637-703 — Status-update service publishes ApplicationStatusChangedEvent; downstream email templates depend on event.
- Expected fix: Map event→email template recipients/timing and avoid sending before DB commit.

## G2-10-011-078 [P1] GAP facet F20
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx, src/components/placements/college-application-pipeline-controls.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:90-95,319-325,590-610 — Uses AbortController and scope keys to prevent old-college network responses replacing new-college state.
- Expected fix: Guard stale detail and mutation responses on selected-college switch; close stale dialogs.

## G2-10-011-079 [P1] GAP facet F20
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/components/placements/college-application-pipeline-controls.tsx, src/modules/placements/college-application-stage-service.ts
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:718-750; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:687-699 — Duplicate UI writes blocked by loading refs; status optimistic lock conflicts return 409.
- Expected fix: Review edit-version/CAS for repeated stage requests and display conflict reconciliation.

## G2-10-012-039 [P1] GAP facet F10
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/app/(authenticated)/admin/placements/jobs/[jobId]/page.tsx, src/modules/placements/job-service.ts, src/modules/placements/super-admin-drive-pipeline-service.ts
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:49-68; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:167-197 — GET /api/v1/admin/jobs/{jobId}?collegeId, independent GET /metrics?collegeId&jobId; errors separately settled.
- Expected fix: Use Promise.allSettled for independent drive and metrics; show hero on metrics failure.

## G2-10-012-077 [P1] GAP facet F21
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/modules/placements/job-service.ts, src/modules/placements/super-admin-drive-pipeline-service.ts
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:12,49-51,76-78 — AdminService calls GET job, metrics, needs-attention (all college-scoped).
- Expected fix: Implement selected-job attention service and consistent pipeline event projection.

## G2-10-015-007 [P1] GAP facet F02
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/components/placements/college-application-pipeline-controls.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1830-1913 — Status-specific bulk operations + Refresh beside selection summary.
- Expected fix: Use Assessment/Interview/Offered contextual CTA toolbar.

## G2-10-015-011 [P1] MISSING facet F03
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/components/placements/college-application-pipeline-controls.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1860-1907 — Buttons 'Mark Passed','Mark Failed','Move to Offered','Mark Hired', and red Reject, varying by tab.
- Expected fix: Reintroduce role-specific distinct buttons, count suffix, red actions.

## G2-10-015-016 [P1] MISSING facet F04
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/components/placements/college-application-pipeline-controls.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1348-1368 — Match Score rounded percentage with purple/cyan bands and Partial tooltip.
- Expected fix: Return actual saved screening score and partial provenance.

## G2-10-015-025 [P1] MISSING facet F06
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/components/placements/college-application-pipeline-controls.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1859-1874 — On ASSESSMENT: Mark Passed moves to INTERVIEW; Mark Failed rejects.
- Expected fix: Add precise actions and confirmation.

## G2-10-015-026 [P1] GAP facet F06
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/components/placements/college-application-pipeline-controls.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1876-1890 — On INTERVIEW: Move to Offered or Reject.
- Expected fix: Restrict offered CTA to valid stage and prerequisites.

## G2-10-015-027 [P1] GAP facet F06
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/components/placements/college-application-pipeline-controls.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1893-1908 — On OFFERED: Mark Hired or Reject; Hired has distinct irreversible consequences.
- Expected fix: Show consequences and explicit hire confirmation.

## G2-10-015-030 [P1] MISSING facet F07
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/components/placements/college-application-pipeline-controls.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1917-1988 — Moving to Assessment modal optional URL http(s), save-to-job checkbox checked.
- Expected fix: Restore URL validation and save-to-job checkbox.

## G2-10-015-031 [P1] GAP facet F07
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/components/placements/college-application-pipeline-controls.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:2840-2877 — Reject reason optional, max500, placeholder 'e.g. Does not meet requirements'.
- Expected fix: Use optional reason for rejection or document strengthened rule.

## G2-10-015-039 [P1] GAP facet F09
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/components/placements/college-application-pipeline-controls.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:2840-2930 — Single/bulk reject modals with discard confirmation for unsaved reason.
- Expected fix: Guard unsaved rejection reason.

## G2-10-015-044 [P1] GAP facet F10
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/modules/placements/college-application-stage-service.ts, src/components/placements/college-application-pipeline-controls.tsx
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:516-603 — Bulk POST validates per-application transition and returns failures/notification outcomes.
- Expected fix: Reconcile side effects, partial errors and stage history.

## G2-10-015-061 [P1] GAP facet F15
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/components/placements/college-application-pipeline-controls.tsx
- Legacy: docs/legacy-source/frontend/src/utils/placementApplicationTransitions.js:73-111 — Bulk preview explicitly states students told and hired cascades.
- Expected fix: Align recipient and delivery outcomes without false email promise.

## G2-10-015-062 [P1] MISSING facet F15
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/components/placements/college-application-pipeline-controls.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:2840-2877 — Reject modal says 'They will be notified by email.'
- Expected fix: Implement email adapter or change promise with owner signoff.
