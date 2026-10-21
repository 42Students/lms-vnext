# Work packet (wave 2): edit src/components/placements/college-application-detail-drawer.tsx

31 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-jobs-jobid-applications.md, docs/audit/gap2/lane-10/superadmin-jobs-jobid-shortlisted.md, docs/audit/gap2/lane-9/college-admin-jobs-applications.md

## G2-10-011-008  [P2] GAP  facet F02  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:2040-2645 — Application Details modal groups Candidate, Status & decision, Documents & notes, screening, interviews and history.
- vNext now: src/components/placements/college-application-detail-drawer.tsx:106-225 — Detail dialog groups candidate facts, resume/score, assessment, schedule link, offers, notes, history.
- Fix: Match every legacy subsection order and headings inside detail dialog.

## G2-10-011-010  [P2] MISSING  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1583-1610 — Assessment URL banner with visible code text and Copy button.
- vNext now: src/components/placements/college-application-detail-drawer.tsx:150-160 — Assessment links inside candidate dialog; no job-level banner on list.
- Fix: Show job assessment link with copy action on list whenever configured.

## G2-10-011-013  [P2] MISSING  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1364-1368 — Partial match Tag with orange color and explanatory Tooltip.
- vNext now: src/components/placements/college-application-pipeline-controls.tsx:97-99; src/components/placements/college-application-detail-drawer.tsx:125-140 — Screening text and score availability reason; no Partial pill or tooltip.
- Fix: Restore partial-score badge with precise legend when actual screening score exists.

## G2-10-011-018  [P2] MISSING  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:2083-2119 — Detail has rejection feedback, previous-withdrawal status, PAP requested, last updater and last update date.
- vNext now: src/components/placements/college-application-detail-drawer.tsx:107-123 — Detail shows source/eligibility/stage but omits the listed audit metadata.
- Fix: Expose legacy decision and audit fields from correctly permission-scoped details API.

## G2-10-011-028  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:2646-2698 — Edit Internal Notes modal edits single note text with unsaved-change confirmation and version.
- vNext now: src/components/placements/college-application-detail-drawer.tsx:191-213 — Append/Amend notes flow with separate storage; no legacy single notes editor.
- Fix: Map legacy editable notes and optimistic version where product requires parity.

## G2-10-011-029  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:2721-2776 — Offer letter URL input 'https://... link to the offer letter document', actionable for OFFERED/HIRED.
- vNext now: src/components/placements/college-application-detail-drawer.tsx:65-75,170-188 — New offer letter link action tied to modern offer record, secure HTTPS validation.
- Fix: Keep conditional attachment, exact placeholder, and status-specific UI; map modern offer ID.

## G2-10-011-040  [P2] GAP  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:2040-2055 — Application Details is a modal opened via View Details, backdrop and close behavior.
- vNext now: src/components/placements/college-application-detail-drawer.tsx:97-105; src/components/placements/college-application-pipeline-controls.tsx:47-56 — Client Dialog opened by Manage > Details; different trigger and section semantics.
- Fix: Use legacy visible trigger and modal title/actions while preserving focus safety.

## G2-10-011-041  [P2] MISSING  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:2700-2719 — Resume Preview dialog uses iframe with Open in new tab and Close.
- vNext now: src/components/placements/college-application-detail-drawer.tsx:125-134 — Secure resume hyperlink opens externally; no inline preview modal.
- Fix: Implement secured iframe preview with fallback for unsupported file types.

## G2-10-011-046  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:605-635 — GET /api/v1/admin/jobs/{jobId}/applications/{id}?collegeId returns full candidate record.
- vNext now: src/components/placements/college-application-detail-drawer.tsx:45-53 — GET /api/placements/college/jobs/{jobId}/applications/{id} returns normalized detail.
- Fix: Map omitted legacy fields (PAP/rejection/updatedBy/screening) to authorized detail DTO.

## G2-10-011-048  [P2] GAP  facet F10  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:772-855 — PATCH notes or offer-letter on specific JobApplication with version/URL.
- vNext now: src/components/placements/college-application-detail-drawer.tsx:56-75 — Detail notes/letter edits use modern endpoints and entity records; original column not written.
- Fix: Define mapping for notes and offer letter without pretending models are identical.

## G2-10-011-063  [P2] MISSING  facet F14  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:2533-2547 — Interview card provides Download .ics calendar action.
- vNext now: src/components/placements/college-application-detail-drawer.tsx:162-169 — Only schedule/view link; no ICS download in details.
- Fix: Support timezone-correct per-interview calendar download.

## G2-10-011-064  [P2] GAP  facet F14  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:2121-2169 — Resume preview and external open via URL-resolving endpoint; no file upload form on this screen.
- vNext now: src/components/placements/college-application-detail-drawer.tsx:125-134 — Secure resume link with no inline preview; no upload on page.
- Fix: Preserve preview/open semantics using signed URLs; uploads remain N/A on both.

## G2-10-011-071  [P2] GAP  facet F17  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:2040-2055,2700-2719 — Ant modal focus containment and Resume Preview iframe has explicit title.
- vNext now: src/components/placements/college-application-detail-drawer.tsx:97-105,125-134 — New Dialog used, no inline iframe; errors moved to focusable alert.
- Fix: Ensure restore-focus, Escape handling and descriptive resume preview title when reinstated.

## G2-10-011-085  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:92-105,114-125 — Rejection reason max500, withdrawal previous status, screeningScore and partialScore stored on application.
- vNext now: src/components/placements/college-application-detail-drawer.tsx:10-20; src/components/placements/college-application-pipeline-controls.tsx:86-99 — DTO shows separate screening/eligibility; no row matchScore/partialScore; stage reason max1000.
- Fix: Map validator lengths and screening/withdrawal data to read model without inventing scores.

## G2-10-015-040  [P2] GAP  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:2040-2053 — Application Details Ant Modal width800, destroyOnClose.
- vNext now: src/components/placements/college-application-detail-drawer.tsx:97-106 — New generic Dialog reached via Manage, size differs.
- Fix: Match modal width/trigger/focus.

## G2-10-015-041  [P2] MISSING  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:2700-2719 — Resume Preview iframe modal Open new tab, Close.
- vNext now: src/components/placements/college-application-detail-drawer.tsx:125-135 — New secure link only.
- Fix: Add signed URL preview and fallback.

## G2-10-015-042  [P2] GAP  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:2646-2698 — Edit Internal Notes with dirty guard/version and specific modal.
- vNext now: src/components/placements/college-application-detail-drawer.tsx:190-215 — New note append/amend flow.
- Fix: Map edit/history semantics and conflict feedback.

## G2-10-015-059  [P2] MISSING  facet F14  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:2121-2169 — Resume preview iframe and Open in new tab.
- vNext now: src/components/placements/college-application-detail-drawer.tsx:125-135 — Only signed external resume link.
- Fix: Add secure embedded preview.

## G2-10-015-060  [P2] GAP  facet F14  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:2533-2547 — Interview details can download ICS for booked candidate.
- vNext now: src/components/placements/college-application-detail-drawer.tsx:162-169 — Only schedule route link; ICS may be on schedule page.
- Fix: Expose candidate ICS action.

## G2-10-015-063  [P2] GAP  facet F15  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:849-850 — Interview scheduled and candidate notified toast.
- vNext now: src/components/placements/college-application-detail-drawer.tsx:162-169 — Candidate details navigate to scheduling; feedback separate.
- Fix: Surface actual delivery acknowledgment.

## G2-10-015-068  [P2] GAP  facet F17  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:2040-2053 — Application Details modal width800 and aria-label status history.
- vNext now: src/components/placements/college-application-detail-drawer.tsx:97-106 — New Dialog has separate semantics/keyboard handling.
- Fix: Match focus trap and restore trigger.

## G2-9-010-009  [P2] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1593-1602` — Assessment Link banner includes Copy button with success/failure toast
- vNext now: `src/components/placements/college-application-detail-drawer.tsx:151-160` — Link copy exists only inside application detail for a round URL
- Fix: Show job assessment link alert and Copy action above list

## G2-9-010-017  [P2] MISSING  facet F04  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:2103-2116` — Detail modal Applied Date and Last Updated with local timestamp
- vNext now: `src/components/placements/college-application-detail-drawer.tsx:107-119` — Detail shows submitted/withdrawn fields but no status-updated timestamp
- Fix: Include status last-update and localized date fallback

## G2-9-010-018  [P2] MISSING  facet F04  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:2099-2101` — PAP requested Yes/No flag in details
- vNext now: `src/components/placements/college-application-detail-drawer.tsx:107-120` — Eligibility status displayed; PAP requested flag omitted
- Fix: Restore PAP requested indicator from source model if retained

## G2-9-010-030  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:2646-2695` — Edit Internal Notes modal textarea and Save; tracks optimistic version
- vNext now: `src/components/placements/college-application-detail-drawer.tsx:191-213` — Inline append-only note correction UI, no equivalent modal and no version input
- Fix: Restore notes modal semantics or explicitly explain append-only versioned correction

## G2-9-010-043  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:2040-2055` — Application Details modal opens with interviews fetch, tabs and close resets history state
- vNext now: `src/components/placements/college-application-detail-drawer.tsx:97-105` — Dialog Application Details with refresh; fetch detail GET before open
- Fix: Match opening/loading and drawer/modal geometry with history reset

## G2-9-010-052  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:1087-1135` — GET screening and POST rescreen on application
- vNext now: `src/components/placements/college-application-detail-drawer.tsx:78-90` — POST details/rescreen with confirmed:true and scoring checks
- Fix: Align rescreen history/error and score refresh UI

## G2-9-010-064  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:2602-2610` — History load failure Status history unavailable and Retry
- vNext now: `src/components/placements/college-application-detail-drawer.tsx:92-105` — History included in detail GET, error renders generic detail error
- Fix: Allow retry for individual history sections and label unavailable state

## G2-9-010-072  [P2] GAP  facet F16  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:2040-2055` — Large application details modal column-oriented Descriptions
- vNext now: `src/components/placements/college-application-detail-drawer.tsx:97-124` — Responsive Dialog with grid detail list
- Fix: Align dialog max width, spacing and mobile viewport gutters

## G2-9-010-074  [P2] GAP  facet F17  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:2600-2610` — History fetch error has Retry accessible button
- vNext now: `src/components/placements/college-application-detail-drawer.tsx:92-105` — No subsection-specific Retry for history
- Fix: Provide Retry action and live-region error per history section

## G2-10-011-077  [P3] GAP  facet F19  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:795-825 — Screening details fetched lazily on-demand inside modal.
- vNext now: src/components/placements/college-application-detail-drawer.tsx:45-53,119-148 — Detail endpoint returns screening fields with candidate details; rescreen only on click.
- Fix: Confirm payload performance and lazy-load expensive screening diagnostics.
