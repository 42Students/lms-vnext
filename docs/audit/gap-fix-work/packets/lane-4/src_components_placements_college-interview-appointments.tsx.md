# Work packet: edit src/components/placements/college-interview-appointments.tsx

19 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l12-u030-interview-form.md, docs/audit/gap2/lane-10/superadmin-jobs-jobid-interviews.md, docs/audit/gap2/lane-4/l13-u030-interview-feedback-form.md, docs/audit/gap2/lane-9/college-admin-jobs-interviews.md

## G2-12-030-001  [P1] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewForm.js:35-50 — reusable Superadmin InterviewForm receives fixed application/job/organization
- vNext now: src/components/placements/college-interview-appointments.tsx:29-50,149-156 — college job modal selects round and candidate interactively
- Fix: Decide whether superadmin selected-college job/application action must open the same preselected form and whether selection may be changed.

## G2-12-030-005  [P1] MISSING  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewForm.js:249-260 — Interview Type five labels Screening Technical HR Managerial Final
- vNext now: src/components/placements/college-interview-appointments.tsx:149-155 — Round select instead of distinct interview type
- Fix: Represent interview type separately or define explicit mapping from round kind and sequence.

## G2-12-030-006  [P1] MISSING  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewForm.js:263-277 — What this round is about, 3 rows, example placeholder, max 500 with count
- vNext now: src/components/placements/college-interview-appointments.tsx:149-172 — no description textarea in scheduling dialog
- Fix: Store/show required round description and candidate reminder context.

## G2-12-030-015  [P1] MISSING  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewForm.js:318-326 — warning Possible scheduling conflict with overlap count before saving
- vNext now: src/components/placements/college-interview-appointments.tsx:142-173 — no prospective conflict alert in scheduling modal
- Fix: Add nonblocking candidate/interviewer overlap preview scoped to full college and company.

## G2-12-030-024  [P1] MISSING  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewForm.js:265-269 — Please describe what this round is about; min 10 characters
- vNext now: src/components/placements/college-interview-appointments.tsx:149-173 — no description field or validation error
- Fix: Show exact required/min-length validation.

## G2-12-030-028  [P1] GAP  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewForm.js:183-200 — unsaved fields trigger Discard interview setup? confirmation (danger Discard changes / Keep editing)
- vNext now: src/components/placements/college-interview-appointments.tsx:142-147 — dialog may close without dirty-state confirmation if !busy
- Fix: Add before-close dirty guard for all modified fields and keyboard escape/backdrop.

## G2-10-013-010  [P1] MISSING  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:536-564 — Conflict WarningOutlined red tag accompanies time if collision identified.
- vNext now: src/components/placements/college-interview-appointments.tsx:104-117; src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx:47-54 — No clash warning pill on appointment row.
- Fix: Project collision types and red badges for conflicting schedule.

## G2-10-013-030  [P1] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:148-184 — GET failures show 'Unable to load interviews. Please try again.' and recover with Refresh.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx:42-45; src/components/placements/college-interview-appointments.tsx:52-63 — Server Promise.all may throw and replace entire schedule route; no interview-list retry.
- Fix: Catch candidate/round read failures per panel with explicit Refresh.

## G2-10-013-078  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:406-649; docs/legacy-source/frontend/src/api/Services/interviewService.js:20-49 — Legacy interview record individual ID, learner, jobApplication, organization, interviewType, status, scheduledDate.
- vNext now: src/components/placements/college-interview-appointments.tsx:17-20; src/modules/placements/college-drive-interviews-service.ts:25-39 — UUID slot+round model with start/duration/room and immutable outcome events; round distinct from candidate interview.
- Fix: Create field-level migration/read mapping and document statuses/timezone.

## G2-13-030-001  [P1] MISSING  facet F01  effort M
- Legacy: Legacy Super Admin placements JobApplications opens InterviewFeedbackForm for selected interview `docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewFeedbackForm.js:8-16`
- vNext now: New college interview workspace only schedules/edits/completes; result service is separate `src/components/placements/college-interview-appointments.tsx:94-145`; `src/modules/placements/result-service.ts:221-225`
- Fix: Add dedicated Feedback entry on completed round for authorized staff.

## G2-9-012-023  [P1] GAP  facet F06  effort L
- Legacy: `docs/legacy-source/frontend/src/api/Services/interviewService.js:17-23` — Legacy POST schedule requires job/jobApplication/learner IDs on InterviewForm
- vNext now: `src/components/placements/college-interview-appointments.tsx:149-156` — New editor chooses a round and shortlisted candidate by ID
- Fix: Ensure ability to schedule legacy qualified applicants independent of round creation

## G2-9-012-038  [P1] MISSING  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/api/Services/interviewService.js:142-165` — Legacy Complete and Feedback POST for interview record
- vNext now: `src/components/placements/college-interview-appointments.tsx:125-133` — New Completed/No Show decisions, but no feedback form/rating
- Fix: Implement or link interview feedback with rating1-5 and recommend action

## G2-9-012-064  [P1] GAP  facet F21  effort M
- Legacy: `docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:39-44` — Uses interviewService, CSV export, ICS export and conflict calculation utility
- vNext now: `src/components/placements/college-interview-appointments.tsx:16-16` — New ICS generator exists, but no CSV/conflict reporting integrations in page
- Fix: Implement CSV and conflict service adapters

## G2-12-030-025  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewForm.js:154-176 — backend field errors mapped to individual controls, server error preserved
- vNext now: src/components/placements/college-interview-appointments.tsx:55-65,173 — catch Error into one banner
- Fix: Map Zod server issue paths to controls and preserve non-field banner fallback.

## G2-13-030-021  [P2] GAP  facet F08  effort M
- Legacy: Success exact toast 'Feedback submitted successfully' then onSuccess `docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewFeedbackForm.js:31-35`
- vNext now: New scheduling success 'Interview scheduled and candidate notified.' `src/components/placements/college-interview-appointments.tsx:56-62`
- Fix: Use exact feedback toast and refresh result view.

## G2-13-030-022  [P2] GAP  facet F08  effort M
- Legacy: In-flight Cancel shows 'Wait for feedback submission to finish.' `docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewFeedbackForm.js:48-52`
- vNext now: New dialog disallows dismiss while busy `src/components/placements/college-interview-appointments.tsx:142-145`
- Fix: Match informative blocked-dismiss toast.

## G2-9-012-031  [P2] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/interviews.js:44-45` — Initial empty message No interviews scheduled for this drive yet.
- vNext now: `src/components/placements/college-interview-appointments.tsx:138-138` — No candidate interviews have been scheduled for this drive.
- Fix: Restore exact first-run empty message

## G2-12-030-026  [P3] GAP  facet F08  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewForm.js:148-151 — toast Interview scheduled successfully and callback closes/reloads
- vNext now: src/components/placements/college-interview-appointments.tsx:60-65,79-80,140 — inline banner Interview scheduled and candidate notified.
- Fix: Replicate legacy toast wording and visible persistence duration.

## G2-12-030-027  [P3] GAP  facet F08  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewForm.js:223-232 — closable alert Interview was not scheduled
- vNext now: src/components/placements/college-interview-appointments.tsx:173 — error banner inside modal, no closable affordance shown
- Fix: Add closable error alert with exact title and dismissal.
