# Work packet (wave 2): edit src/components/placements/college-interview-appointments.tsx (part 1 of 2)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l12-u030-interview-form.md, docs/audit/gap2/lane-10/superadmin-jobs-jobid-interviews.md, docs/audit/gap2/lane-4/l13-u030-interview-feedback-form.md, docs/audit/gap2/lane-9/college-admin-jobs-interviews.md

## G2-12-030-003  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewForm.js:214-246 — vertical form: closable error alert, grey candidate banner, reschedule/multiple-interview notice, help
- vNext now: src/components/placements/college-interview-appointments.tsx:142-156 — dialog with title, round/candidate dropdown; no candidate banner/help at top
- Fix: Restore matching alert/banner/content order and side effects.

## G2-12-030-004  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewForm.js:249-379 — stacked interview fields then buttons
- vNext now: src/components/placements/college-interview-appointments.tsx:157-173 — two-column date/duration then mode/location/interviewer, footer actions
- Fix: Recreate legacy single-column spacing and field order for parity at desktop, preserve responsive mobile.

## G2-12-030-008  [P2] MISSING  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewForm.js:377-379 — Notes (Optional) textarea max 1000 placeholder Additional notes for the candidate...
- vNext now: src/components/placements/college-interview-appointments.tsx:149-173 — no scheduling notes field
- Fix: Add notes with confirmed intended visibility and length limit.

## G2-12-030-009  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewForm.js:202-212 — defaults SCREENING/ONLINE/60; cancelled-round prefill
- vNext now: src/components/placements/college-interview-appointments.tsx:33-49 — defaults first available round, ON_CAMPUS, duration 30
- Fix: Restore old default mode and duration or document product departure.

## G2-12-030-010  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewForm.js:239-244 — reschedule cancelled shows blue prefill message; existing count shows second-round notice
- vNext now: src/components/placements/college-interview-appointments.tsx:43-50,142-173 — editing prefill but no cancelled-source re-entry or count banner
- Fix: Restore cancelled-round clone flow and multi-round caution if supported.

## G2-12-030-011  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewForm.js:287-289 — user's actual local timezone label best effort
- vNext now: src/components/placements/college-interview-appointments.tsx:22-28,158-159 — hardcoded IST conversion / date-local input
- Fix: Show explicit IST and audit browser timezone behavior for traveling users.

## G2-12-030-012  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewForm.js:291-316 — separate Date picker and HH:mm Time picker, 5-minute steps
- vNext now: src/components/placements/college-interview-appointments.tsx:157-161 — datetime-local combined input, no step attribute
- Fix: Replicate separate pickers and 5-minute increments.

## G2-12-030-013  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewForm.js:328-342 — duration fixed options 15/30/45/60/90/120/180 with formatted labels
- vNext now: src/components/placements/college-interview-appointments.tsx:160-161 — unrestricted numeric 5-480 minutes
- Fix: Match exact seven-item duration list or record approved flexibility.

## G2-12-030-014  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewForm.js:345-375 — ONLINE/ OFFLINE mode, Meeting Link/Venue Address labels and tailored placeholders
- vNext now: src/components/placements/college-interview-appointments.tsx:163-168 — VIRTUAL/ON_CAMPUS enum, Secure meeting URL/Interview location labels no placeholders
- Fix: Map enum, restore exact labels and contextual placeholder text.

## G2-12-030-029  [P2] GAP  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewForm.js:97-99,127-131,177-180 — loadingRef prevents double submit, disables entire form while saving
- vNext now: src/components/placements/college-interview-appointments.tsx:52-65,142-146 — busy boolean guards post, modal busy disabled but input controls not disabled
- Fix: Disable all editing controls during save, ref guard against synchronous double click.

## G2-12-030-043  [P2] GAP  facet F17  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewForm.js:291-316 — DatePicker/TimePicker keyboard accessible with step 5 and empty placeholders
- vNext now: src/components/placements/college-interview-appointments.tsx:158-159 — native datetime-local single field
- Fix: Validate keyboard hour/minute adjustment, locale display, helper label and focus order.

## G2-12-030-045  [P2] MISSING  facet F18  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewForm.js:183-200 — Discard interview setup? / Discard changes / Keep editing
- vNext now: src/components/placements/college-interview-appointments.tsx:142-147 — no discard confirm text
- Fix: Implement explicit legacy discard confirmation vocabulary.

## G2-12-030-055  [P2] GAP  facet F23  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewForm.js:91-95 — clears location when mode changes
- vNext now: src/components/placements/college-interview-appointments.tsx:163-168 — mode switches displayed state but leaves other mode's data stored
- Fix: Clear stale venue/meetingUrl and errors on mode switch.

## G2-10-013-007  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:1020-1056 — Desktop Ant Table with interview rows; mobile cards from renderMobileCard.
- vNext now: src/components/placements/college-interview-appointments.tsx:92-140; src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx:78-84 — Candidate appointments DataTable plus separate rounds DataTable; substantially different information architecture.
- Fix: Restore single candidate-interview list before optional round summary.

## G2-10-013-008  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:652-734 — Phone-size interview cards show company, learner, type/status, conflicts, schedule, mode, action buttons.
- vNext now: src/components/placements/college-interview-appointments.tsx:104-138 — Generic DataTable mobile disclosure, no dedicated interview card.
- Fix: Clone card fields, badge positions, and action ordering.

## G2-10-013-009  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:51-103 — Color-coded interview type (HR, technical, group discussion, default) and status configured as Ant Tag.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx:47-54; src/components/placements/college-interview-appointments.tsx:105-117 — Round kind raw text, appointment status badge; original type color mapping absent.
- Fix: Map old interview type labels/colors to new semantic status badges.

## G2-10-013-015  [P2] MISSING  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:468-480 — Candidate name with learner department and link to application.
- vNext now: src/components/placements/college-interview-appointments.tsx:104-138 — Candidate row selected by application id and name; department absent.
- Fix: Join authorized department and render beneath learner.

## G2-10-013-016  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:541-567 — Date is parsePlacementUtcDateTime, conflict tag, role-specific presentation.
- vNext now: src/components/placements/college-interview-appointments.tsx:109-116; src/modules/placements/college-drive-interviews-model.ts:32-35 — Formatted en-IN IST 'date · duration min', no conflict status.
- Fix: Restore conflict indicator and legacy date/time formatting.

## G2-10-013-017  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:614-639 — Per interview Download .ics and View application actions in row.
- vNext now: src/components/placements/college-interview-appointments.tsx:117-135 — ICS and Edit/Complete/No Show/Cancel inside Actions disclosure; no direct View application.
- Fix: Expose direct View application and ICS in same locations.

## G2-10-013-018  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:684-732 — Mobile card displays interview company badge and candidate context.
- vNext now: src/components/placements/college-interview-appointments.tsx:104-138 — Generic appointment table mobile card has fewer company/job descriptors.
- Fix: Restore company and job identity to small viewport.

## G2-10-013-025  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:395-405 — Download .ics for a specific interview with job, company, event date.
- vNext now: src/components/placements/college-interview-appointments.tsx:117-126 — Generates collegeInterviewIcs with generic title 'College interview'.
- Fix: Populate event title with interview type, drive, company and candidate; retain TZ.

## G2-10-013-026  [P2] MISSING  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:614-641 — View application action calls onViewApplications(jobId,job,applicationId).
- vNext now: src/components/placements/college-interview-appointments.tsx:117-135 — No direct View application link/scroll from appointments list.
- Fix: Add scoped application link with applicationId deep link.

## G2-10-013-039  [P2] MISSING  facet F09  effort S
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:663-681 — Phone card opens candidate application via button click.
- vNext now: src/components/placements/college-interview-appointments.tsx:117-135 — Appointment actions in disclosure, no candidate-detail navigation.
- Fix: Add View application action with accessible link destination.

## G2-10-013-052  [P2] GAP  facet F13  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/interviews.js:40-43; docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:1018-1045 — No results exact 'No interviews scheduled for this drive yet.' when genuinely empty.
- vNext now: src/components/placements/college-interview-appointments.tsx:138-139; src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx:82-83 — 'No candidate interviews have been scheduled for this drive.' and 'No matching interview rounds'.
- Fix: Match exact empty message, distinguish no matching filters.

## G2-10-013-055  [P2] GAP  facet F14  effort S
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:395-405,614-624 — Per-interview .ics button with DownloadOutlined and title Download .ics.
- vNext now: src/components/placements/college-interview-appointments.tsx:117-126 — ICS available through Actions disclosure with generic title.
- Fix: Use visible button/icon/text and event title.

## G2-10-013-058  [P2] GAP  facet F15  effort S
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:614-640 — View Applications navigation no candidate notification.
- vNext now: src/components/placements/college-interview-appointments.tsx:117-135 — No equivalent direct navigation; new booking actions can notify candidates.
- Fix: Restore pure View Applications command independent of scheduling notifications.

## G2-10-013-060  [P2] GAP  facet F16  effort M
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:651-734 — Legacy has distinct 768px desktop-table/mobile-card presentation with wrapped touch buttons.
- vNext now: src/components/ui/data-table.tsx:40-146; src/components/placements/college-interview-appointments.tsx:104-140 — Responsive DataTable with collapsed fields; lacks card badge/group hierarchy.
- Fix: Clone mobile card geometry/icons and 44px targets.

## G2-10-013-063  [P2] MISSING  facet F17  effort S
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:671-679 — Mobile View application button aria-label includes candidate and job.
- vNext now: src/components/placements/college-interview-appointments.tsx:117-135 — No direct View application aria-label.
- Fix: Add per-row descriptive aria-label and correct destination.

## G2-10-013-065  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/interviews.js:40-43 — Exact no-results message 'No interviews scheduled for this drive yet.'
- vNext now: src/components/placements/college-interview-appointments.tsx:138-139 — 'No candidate interviews have been scheduled for this drive.'
- Fix: Copy original string.

## G2-10-013-070  [P2] GAP  facet F19  effort M
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:215-220 — Focus triggers refresh with throttle to avoid stale interview outcomes.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx:42-45; src/components/placements/college-interview-appointments.tsx:52-63 — Router refresh after mutation only.
- Fix: Add focus-based revalidation when returning to tab.

## G2-10-013-076  [P2] GAP  facet F21  effort M
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:40-45,395-405 — csvExport and calendar export utilities integrated with table.
- vNext now: src/components/placements/college-interview-appointments.tsx:117-126; src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx:55-93 — ICS util exists, CSV missing.
- Fix: Implement safe CSV with actual filtered candidate rows.

## G2-10-013-082  [P2] MISSING  facet F23  effort M
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:614-649,873-918 — Legacy .ics and CSV exports and conflict-only triage available.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx:55-93; src/components/placements/college-interview-appointments.tsx:117-135 — ICS via disclosure only; no CSV or conflicts-only.
- Fix: Implement export/triage actions with correct data and status.

## G2-13-030-003  [P2] GAP  facet F02  effort M
- Legacy: Candidate/job/round banner precedes rating, recommendation, comments, submit/cancel `docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewFeedbackForm.js:113-193`
- vNext now: New appointment table and Schedule/Edit dialog, not feedback form `src/components/placements/college-interview-appointments.tsx:94-145`
- Fix: Build same form order and banner.

## G2-13-030-007  [P2] GAP  facet F03  effort M
- Legacy: Submit feedback and Cancel controls, both disabled in flight `docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewFeedbackForm.js:183-192`
- vNext now: New schedule modal Save/Cancel actions and guard `src/components/placements/college-interview-appointments.tsx:142-145`
- Fix: Restore exact feedback CTA and pending guards.

## G2-13-030-009  [P2] GAP  facet F04  effort M
- Legacy: Job title optional and interviewType formatted Title-case + round `docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewFeedbackForm.js:114-121`
- vNext now: New appointment table shows round.name and status `src/components/placements/college-interview-appointments.tsx:105-115`
- Fix: Render job title and legacy round-type metadata.

## G2-13-030-015  [P2] MISSING  facet F06  effort M
- Legacy: Comments textarea 4 rows, character count shown, placeholder fixed `docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewFeedbackForm.js:171-177`
- vNext now: No equivalent feedback textarea in new appointment modal `src/components/placements/college-interview-appointments.tsx:142-169`
- Fix: Add 4-row counted editor with correct placeholder and max.

## G2-13-030-023  [P2] MISSING  facet F09  effort M
- Legacy: Dirty Cancel opens 'Discard unsaved feedback?' confirm, Discard danger/Keep editing `docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewFeedbackForm.js:53-64`
- vNext now: New scheduling Dialog only dismissible=!busy `src/components/placements/college-interview-appointments.tsx:142-145`
- Fix: Add unsaved-changes confirm with exact copy/actions.

## G2-13-030-034  [P2] MISSING  facet F13  effort M
- Legacy: Already submitted displays blue info panel with timestamp and Close `docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewFeedbackForm.js:69-97`
- vNext now: No equivalent feedback summary in appointment workspace `src/components/placements/college-interview-appointments.tsx:94-145`
- Fix: Restore read-only state with date/feedback.

## G2-9-012-003  [P2] MISSING  facet F01  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/interviews.js:21-24` — Open application clicks navigate /college-admin/jobs/{jobId}/applications
- vNext now: `src/components/placements/college-interview-appointments.tsx:100-138` — Appointment row has action menu but no View Applications link
- Fix: Add application deep link on every interview row

## G2-9-012-008  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:925-1050` — Mobile cards and desktop middle-size table with x1100 scroll
- vNext now: `src/components/placements/college-interview-appointments.tsx:100-140` — DataTable responsive table plus Disclosure actions
- Fix: Recreate responsive interview cards at mobile and compact table on desktop
