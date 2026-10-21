# Work packet: edit src/components/placements/college-application-detail-drawer.tsx

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-jobs-jobid-applications.md, docs/audit/gap2/lane-10/superadmin-jobs-jobid-shortlisted.md, docs/audit/gap2/lane-9/college-admin-jobs-applications.md

## G2-10-011-034  [P1] GAP  facet F07  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:772-825 — Notes invalid version returns 400 and concurrent edit 409 with 'These notes were updated by someone else. Please refresh and try again.'
- vNext now: src/components/placements/college-application-detail-drawer.tsx:56-64 — Note mutation catches generic API message, no legacy version form.
- Fix: Provide stable version preconditions and exact conflict recovery.

## G2-10-011-081  [P1] GAP  facet F21  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:7-12,755-935 — Integrated interview GET/schedule/update/cancel/completed/no-show/feedback APIs in detail.
- vNext now: src/components/placements/college-application-detail-drawer.tsx:162-169 — Delegates interview management to another route instead of inline integration.
- Fix: Map all interview actions, notifications and calendar export to coherent Super Admin workflow.

## G2-10-011-082  [P1] GAP  facet F21  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:795-825; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:1087-1135 — Screening fetch/rescreen integrates legacy ScreeningService and assessment score.
- vNext now: src/components/placements/college-application-detail-drawer.tsx:135-148 — Re-screen checks current academic eligibility; does not produce legacy numeric match score.
- Fix: Provide supported scoring or explicitly document retired scoring strategy for legacy parity.

## G2-10-015-029  [P1] MISSING  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:2790-2837 — Candidate actions open interview schedule/edit/feedback modals.
- vNext now: src/components/placements/college-application-detail-drawer.tsx:162-169 — Details link out to schedule, no same modals.
- Fix: Integrate appointment actions in shortlist detail.

## G2-10-015-046  [P1] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:605-703 — GET detail and PUT status within same JobApplication model.
- vNext now: src/components/placements/college-application-detail-drawer.tsx:45-53 — New normalized detail and separate stage table.
- Fix: Join audit detail fields and ensure consistency.

## G2-10-015-082  [P1] GAP  facet F21  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:755-935 — Interview scheduling and results in application details.
- vNext now: src/components/placements/college-application-detail-drawer.tsx:162-169 — Delegated to separate schedule route.
- Fix: Restore in-context route/actions.

## G2-9-010-031  [P1] GAP  facet F06  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:2721-2774` — Offer Letter editor accepts http or https URL, confirms attach
- vNext now: `src/components/placements/college-application-detail-drawer.tsx:66-75` — HTTPS-only URL validation, offers-specific selector
- Fix: Document HTTPS tightening; supply clear browser field help and legacy outcome

## G2-9-010-041  [P1] MISSING  facet F08  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:849-851` — Interview scheduled and candidate notified. toast
- vNext now: `src/components/placements/college-application-detail-drawer.tsx:163-170` — Read-only interview detail, cannot trigger scheduling notification
- Fix: Restore schedule completion notification and toast

## G2-9-010-044  [P1] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:2700-2718` — Resume Preview modal with iframe/new-tab and Close
- vNext now: `src/components/placements/college-application-detail-drawer.tsx:126-133` — Secure Resume Preview Open link, no embedded iframe modal
- Fix: Implement accessible resume preview dialog with safe content origin

## G2-9-010-067  [P1] MISSING  facet F14  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:2533-2547` — Scheduled interview supports Download ICS calendar file
- vNext now: `src/components/placements/college-application-detail-drawer.tsx:163-170` — No ICS download in detail
- Fix: Add accessible ICS export with normalized IST/UTC times

## G2-9-010-069  [P1] MISSING  facet F15  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:826-850` — Schedule interview notifies candidate on completion
- vNext now: `src/components/placements/college-application-detail-drawer.tsx:163-170` — No scheduling workflow exposed here
- Fix: Wire to real interview scheduling and recipient event path

## G2-9-010-084  [P1] GAP  facet F21  effort L
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:6-44` — Legacy integrates interviewService, CSV, ICS, resume preview, notes, screening, status history
- vNext now: `src/components/placements/college-application-detail-drawer.tsx:92-220` — Detail covers histories/notes/offer URL/screening, but interview scheduling and ICS not implemented here
- Fix: Map and build missing interview integration rather than dropping it

## G2-9-010-087  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:83-109` — One internalNotes text and application offerLetterUrl in legacy row
- vNext now: `src/components/placements/college-application-detail-drawer.tsx:17-20` — Versioned note list and offer-specific letter URLs on separate rows
- Fix: Document migration and audit-history presentation of notes/offer letters

## G2-10-011-035  [P2] MISSING  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:755-774 — Interview fetch shows 'Failed to load interviews' and keeps modal open.
- vNext now: src/components/placements/college-application-detail-drawer.tsx:162-169 — No in-dialog interview fetch/retry.
- Fix: Add interview subsection-specific error and Retry without closing details.

## G2-10-011-037  [P2] MISSING  facet F08  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:849-850 — After scheduling, toast 'Interview scheduled and candidate notified.'.
- vNext now: src/components/placements/college-application-detail-drawer.tsx:162-169 — Delegated to another page; no in-dialog success feedback.
- Fix: Surface scheduling acknowledgement in candidate workflow with actual notification outcome.

## G2-9-010-036  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:2653-2689` — Failed notes save banner Notes were not saved, keeps draft with retry
- vNext now: `src/components/placements/college-application-detail-drawer.tsx:56-64` — Inline error note could not be saved, no distinct modal save banner
- Fix: Preserve unsaved draft and show legacy notes-specific error

## G2-9-010-037  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:2729-2769` — Invalid offer letter Enter a valid http:// or https:// link.
- vNext now: `src/components/placements/college-application-detail-drawer.tsx:66-75` — Enter a secure HTTPS offer-letter URL.
- Fix: Align security policy and visible error wording

## G2-9-010-042  [P2] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:2661-2663` — Notes updated toast
- vNext now: `src/components/placements/college-application-detail-drawer.tsx:60-64` — Inline Notes updated/Internal note saved to application history status
- Fix: Align success message placement and duration

## G2-10-011-038  [P3] GAP  facet F08  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1593-1605 — Copy success 'Assessment link copied to clipboard' or error 'Failed to copy'.
- vNext now: src/components/placements/college-application-detail-drawer.tsx:153-161 — Copy reports 'Assessment link copied.' or longer fallback text.
- Fix: Use exact success/error copy if clone scope includes toasts.

## G2-10-011-039  [P3] GAP  facet F08  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:2661-2673 — Notes success toast 'Notes updated' and error in modal.
- vNext now: src/components/placements/college-application-detail-drawer.tsx:56-64 — Inline success 'Notes updated' or 'Internal note saved to application history.'.
- Fix: Align toast/inline timing and messages to legacy.
