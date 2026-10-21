# Work packet (wave 2): edit src/components/placements/college-application-pipeline-controls.tsx (part 1 of 2)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-jobs-jobid-applications.md, docs/audit/gap2/lane-10/superadmin-jobs-jobid-shortlisted.md, docs/audit/gap2/lane-2/admin-job-controller.md, docs/audit/gap2/lane-9/college-admin-jobs-applications.md

## G2-10-011-011  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1378-1442 — Each row shows View Details button and always-visible Move to... select; rejected choice colored red.
- vNext now: src/components/placements/college-application-pipeline-controls.tsx:99-114 — Actions nested in Manage disclosure; 'Details' label, move select native, separate Reinstate.
- Fix: Render visible View Details/Move to controls and destructive red option in desktop row.

## G2-10-011-013  [P2] MISSING  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1364-1368 — Partial match Tag with orange color and explanatory Tooltip.
- vNext now: src/components/placements/college-application-pipeline-controls.tsx:97-99; src/components/placements/college-application-detail-drawer.tsx:125-140 — Screening text and score availability reason; no Partial pill or tooltip.
- Fix: Restore partial-score badge with precise legend when actual screening score exists.

## G2-10-011-014  [P2] GAP  facet F04  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1257-1287 — Columns Learner Name, Email, College; '-' placeholder and college fallback College #id.
- vNext now: src/components/placements/college-application-pipeline-controls.tsx:86-90 — Learner Name/Email/College plus Roll/Role; uses 'Unnamed learner', '—', 'Not recorded'.
- Fix: Align name/email/college placeholders, keeping any new fields explicitly differentiated.

## G2-10-011-015  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1289-1317 — Source color Tag, Current Status Tag, Applied Date formatted via formatPlacementDateShort.
- vNext now: src/components/placements/college-application-pipeline-controls.tsx:92-98 — Source raw text, Current Status raw stage string, Applied Date Intl en-IN.
- Fix: Use old status/source pill treatments and legacy date/placeholder conventions.

## G2-10-011-016  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1321-1345 — Age uses last status update or applied timestamp, amber/gray dot, 'today' or Nd.
- vNext now: src/modules/placements/college-drive-applications-service.ts:41-53; src/components/placements/college-application-pipeline-controls.tsx:93-95 — Age derives from submission only and prints N days without dot.
- Fix: Expose last-stage-updated time and calculate legacy age indicator, not only days since submission.

## G2-10-011-024  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1994-2036 — Table fixed left candidate and right actions; horizontal max-content scrolling.
- vNext now: src/components/placements/college-application-pipeline-controls.tsx:80-142; src/components/ui/data-table.tsx:96-140 — Generic responsive table with More details disclosures and no fixed first/last columns.
- Fix: Retain anchor columns and discoverable horizontal overflow at desktop/tablet.

## G2-10-011-027  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:2840-2876 — Reject candidate modal uses optional reason with placeholder 'e.g. Does not meet requirements'.
- vNext now: src/components/placements/college-application-pipeline-controls.tsx:146-162 — Unified required Reason field; no reject-specific placeholder.
- Fix: Make reject form distinct and preserve optional-reason semantics where allowed.

## G2-10-011-040  [P2] GAP  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:2040-2055 — Application Details is a modal opened via View Details, backdrop and close behavior.
- vNext now: src/components/placements/college-application-detail-drawer.tsx:97-105; src/components/placements/college-application-pipeline-controls.tsx:47-56 — Client Dialog opened by Manage > Details; different trigger and section semantics.
- Fix: Use legacy visible trigger and modal title/actions while preserving focus safety.

## G2-10-011-042  [P2] GAP  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1917-1988,2840-2877 — Dedicated assessment and reject modals with unique descriptions/fields.
- vNext now: src/components/placements/college-application-pipeline-controls.tsx:146-175 — One generic Application status update dialog for both.
- Fix: Provide action-specific dialog headings, helper text and button labels.

## G2-10-011-044  [P2] GAP  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1410-1424 — Reinstating rejected row opens confirmation preserving prior rejection reason.
- vNext now: src/components/placements/college-application-pipeline-controls.tsx:103-106,146-162 — Reinstate opens generic dialog with mandatory reason; old reason not previewed.
- Fix: Show stored rejection reason and explicit Reinstate confirmation.

## G2-10-011-060  [P2] GAP  facet F13  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:2023-2033 — Empty list says 'No applications yet' and prompt to share drive; filtered list says 'No applications match these filters' with Clear filters CTA.
- vNext now: src/components/placements/college-application-pipeline-controls.tsx:141-142 — Always 'No matching applications' and 'No applications match these filters.'.
- Fix: Distinguish no applicants from zero filtered results and match CTA wording.

## G2-10-011-068  [P2] GAP  facet F16  effort M
- Legacy: docs/legacy-source/frontend/src/styles/pages/_admin-jobs.scss:177-185; docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1994-2020 — Wide applications table scrolls horizontally on mobile; left candidate and right Actions fixed.
- vNext now: src/components/ui/data-table.tsx:96-140; src/components/placements/college-application-pipeline-controls.tsx:80-115 — Responsive DataTable uses scroll cue and collapsed secondary fields; no fixed candidate/actions parity.
- Fix: Match 44px touch controls and visible horizontal-scrolling affordance with anchored candidate.

## G2-10-011-073  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1382-1386 — Exact CTA 'View Details', select placeholder 'Move to...'.
- vNext now: src/components/placements/college-application-pipeline-controls.tsx:99-113 — CTA 'Details' inside 'Manage'; select placeholder same.
- Fix: Rename CTA and render select without intermediate menu.

## G2-10-011-076  [P2] GAP  facet F19  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:503-511 — Re-fetches applications on window focus to reconcile remote admin changes.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:42-45; src/components/placements/college-application-pipeline-controls.tsx:64-79 — Server load and router.refresh after mutations, no visible focus refetch.
- Fix: Add focus revalidation or documented freshness banner without showing stale stages.

## G2-10-011-080  [P2] GAP  facet F20  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1324-1344 — Uses placement UTC parser and elapsed full 24h floor for age.
- vNext now: src/components/placements/college-application-pipeline-controls.tsx:93-95 — Uses database ageDays based on server now and submittedAt; en-IN applied date in IST.
- Fix: Align aging source (statusUpdatedAt fallback) and ensure no timezone/negative days drift.

## G2-10-011-085  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:92-105,114-125 — Rejection reason max500, withdrawal previous status, screeningScore and partialScore stored on application.
- vNext now: src/components/placements/college-application-detail-drawer.tsx:10-20; src/components/placements/college-application-pipeline-controls.tsx:86-99 — DTO shows separate screening/eligibility; no row matchScore/partialScore; stage reason max1000.
- Fix: Map validator lengths and screening/withdrawal data to read model without inventing scores.

## G2-10-015-008  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1994-2040 — Table with fixed candidate/actions, pagination and 20 default page size.
- vNext now: src/components/placements/college-application-pipeline-controls.tsx:80-142 — DataTable with 25 server rows, no fixed bookend columns.
- Fix: Match column anchoring and 20-row default.

## G2-10-015-012  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:938-961,982-988 — Current Status displays icon-bearing tone Badge; Source blue/orange Tag.
- vNext now: src/components/placements/college-application-pipeline-controls.tsx:92-99 — Raw stage/source strings in DataTable.
- Fix: Restore status icons and semantic colors.

## G2-10-015-014  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1257-1370 — Columns Learner Name, Email, College, Source, Current Status, Applied Date, Age, Match Score.
- vNext now: src/components/placements/college-application-pipeline-controls.tsx:86-99 — Adds Roll, Role, Screening; Match Score absent; stage unbadged.
- Fix: Align legacy column set, widths, and output.

## G2-10-015-015  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1321-1345 — Age from last status update, dot and today/Nd formatting.
- vNext now: src/components/placements/college-application-pipeline-controls.tsx:93-95 — Age days since application submission only.
- Fix: Calculate status-age and dot.

## G2-10-015-017  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1378-1442 — Visible View Details and Move to... per row; red reject option.
- vNext now: src/components/placements/college-application-pipeline-controls.tsx:99-114 — Manage disclosure hides Details and Select.
- Fix: Expose direct controls with exact labels.

## G2-10-015-038  [P2] MISSING  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1917-1988 — Assessment modal includes dedicated fields/Save link to job.
- vNext now: src/components/placements/college-application-pipeline-controls.tsx:146-175 — Only generic stage update dialog.
- Fix: Use dedicated assessment modal with exact focus behavior.

## G2-10-015-056  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:2023-2033 — Zero applicants: No applications yet; filtered empty: No applications match these filters.
- vNext now: src/components/placements/college-application-pipeline-controls.tsx:141-142 — Always 'No matching applications'.
- Fix: Differentiate true zero and filtered empty.

## G2-10-015-064  [P2] GAP  facet F16  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1994-2020 — Ant wide table fixed first/last columns, max-content scroll.
- vNext now: src/components/placements/college-application-pipeline-controls.tsx:80-142 — Responsive DataTable with collapsed fields and Manage disclosure.
- Fix: Restore visual table and scrolling affordance.

## G2-10-015-071  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1859-1908 — Mark Passed, Mark Failed, Move to Offered, Mark Hired exact status-dependent labels.
- vNext now: src/components/placements/college-application-pipeline-controls.tsx:128-139 — Generic Act on N selected.
- Fix: Restore exact text.

## G2-2-016-065  [P2] GAP  facet F03  effort M
- Legacy: Legacy applicant detail modal includes interviews, edit and feedback flows `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:77-88`
- vNext now: New applicant detail is drawer from pipeline list `src/components/placements/college-application-pipeline-controls.tsx:141-145`
- Fix: Match trigger labels and actionable detail sections; preserve drawer keyboard close behaviour

## G2-2-016-103  [P2] GAP  facet F09  effort L
- Legacy: Legacy applicant detail opens Modal and interview forms `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:77-88`
- vNext now: New opens CollegeApplicationDetailDrawer `src/components/placements/college-application-pipeline-controls.tsx:141-145`
- Fix: Match modal content fields including rescreen, offer and history; verify accessible focus

## G2-2-016-146  [P2] GAP  facet F18  effort M
- Legacy: Legacy status update success `Application status updated successfully`, stale conflict wording `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:677-702`
- vNext now: New dialog reports count and reasons; no exact legacy success phrase `src/components/placements/college-application-pipeline-controls.tsx:146-174`
- Fix: Restore exact successful single-action toast and reload-on-409 copy

## G2-9-010-012  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1834-1910` — Context-sensitive bulk buttons Shortlist, Reject, Assessment, Interview pass, Offered and Hired
- vNext now: `src/components/placements/college-application-pipeline-controls.tsx:128-139` — One bulk stage selector and Act on N selected button
- Fix: Restore stage-target-specific actions, confirmations and disabled rules

## G2-9-010-013  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1257-1317` — Table columns Learner, Email, College/department, Source, Current Status, Applied Date
- vNext now: `src/components/placements/college-application-pipeline-controls.tsx:80-99` — Learner Name/Email/College/Roll/Role/Source/Applied Date/Age/Current Status/Screening/Actions
- Fix: Match legacy visible column labels/order and support extra columns through Columns UI

## G2-9-010-015  [P2] GAP  facet F04  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1267-1282` — Legacy student name formatted firstName + lastName, missing emails dash
- vNext now: `src/components/placements/college-application-pipeline-controls.tsx:85-89` — Name displayName or Unnamed learner, email em dash
- Fix: Align fallback punctuation and learner-name formatting

## G2-9-010-024  [P2] GAP  facet F05  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1020-1030` — Select all matching cap3000 with warning toast listing truncation
- vNext now: `src/components/placements/college-application-pipeline-controls.tsx:122-127` — All-matching button disabled above3000, inline Narrow filters message
- Fix: Offer equivalent cap feedback and safe preview before bulk action

## G2-9-010-026  [P2] GAP  facet F05  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:2025-2035` — No applications yet versus No applications match these filters, clear filters CTA
- vNext now: `src/components/placements/college-application-pipeline-controls.tsx:141-142` — Always No matching applications; no first-run variation
- Fix: Restore two empty variants and Clear filters action

## G2-9-010-046  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:2879-2925` — Bulk reject distinct modal and bulk failure modal
- vNext now: `src/components/placements/college-application-pipeline-controls.tsx:146-175` — One generic bulk status dialog with result list
- Fix: Preserve separate reject confirmation and actionable failure details

## G2-9-010-063  [P2] GAP  facet F13  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:2025-2035` — No applications yet versus filtered no-matches text and clear CTA
- vNext now: `src/components/placements/college-application-pipeline-controls.tsx:141-142` — Always No matching applications regardless initial state
- Fix: Preserve empty list versus filtered empty messages

## G2-9-010-071  [P2] GAP  facet F16  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1992-2036` — Ant Table horizontal scroll, small buttons and page-size dropdown
- vNext now: `src/components/placements/college-application-pipeline-controls.tsx:80-142` — Responsive DataTable mobile priorities and disclosure Manage actions
- Fix: Match column visibility and toolbar widths at 1280/768/375

## G2-9-010-075  [P2] GAP  facet F17  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1994-2013` — Table selection checkbox column with Ant aria selection, pagination keyboard controls
- vNext now: `src/components/placements/college-application-pipeline-controls.tsx:80-85` — Row labelled Select checkbox, separate allPage checkbox; no selectable row click
- Fix: Align selection semantics and keyboard count announcements

## G2-9-010-078  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1378-1386` — Row CTA View Details and Move to...
- vNext now: `src/components/placements/college-application-pipeline-controls.tsx:99-113` — Details inside Manage disclosure and Move to... select
- Fix: Use legacy direct row buttons or owner-approved disclosure

## G2-9-010-081  [P2] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:90-95` — Aborts in-flight application requests and prevents overlapping mutations via refs
- vNext now: `src/components/placements/college-application-pipeline-controls.tsx:64-79` — Busy state disables status action, query navigation remounts component
- Fix: Reconcile selection/state across refresh and cancel stale detail fetches

## G2-10-011-069  [P3] GAP  facet F16  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1498-1526 — Back/toolbar buttons wrap under constrained widths.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:51-104; src/components/placements/college-application-pipeline-controls.tsx:116-139 — New responsive grid and full-width mobile toolbar distinct from Ant wraps.
- Fix: Match legacy toolbar ordering/spacing at 320, 375, 768 and desktop widths.
