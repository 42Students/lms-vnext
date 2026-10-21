# Work packet: edit src/modules/placements/college-round-slot-action-service.ts

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l12-u030-interview-form.md, docs/audit/gap2/lane-10/superadmin-jobs-jobid-interviews.md, docs/audit/gap2/lane-9/college-admin-jobs-interviews.md

## G2-12-030-032  [P1] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java:184-190,234-257 — locks application/learner; cross-checks job/learner and application
- vNext now: src/modules/placements/college-round-slot-action-service.ts:92-114 — checks application/job/shortlist but locks round, not learner
- Fix: Verify cross-drive candidate conflict and concurrency locking across same learner.

## G2-12-030-035  [P1] GAP  facet F12  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java:332-340 — cannot create new round while previous same-application round active
- vNext now: src/modules/placements/college-round-slot-action-service.ts:82-116 — allows multiple candidate slots across distinct INTERVIEW rounds if no exact overlap
- Fix: Add active-round succession rule or document deliberate multiple concurrent interviews.

## G2-12-030-036  [P1] GAP  facet F12  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java:367-408 — schedule auto-advances application SHORTLISTED/ASSESSMENT to INTERVIEW with status notifications
- vNext now: src/modules/placements/college-round-slot-action-service.ts:110-118,170-183 — inserts slot and emits event/notification but no application status transition
- Fix: Restore learner pipeline auto-advance or confirm vNext stage projection renders equivalent.

## G2-12-030-041  [P1] GAP  facet F15  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java:363-408 — sends status/round notices after commit, specific stage cases
- vNext now: src/modules/placements/college-round-slot-action-service.ts:170-181 — inAppNotifications Interview update action to learner
- Fix: Match round-specific context and validate email/push/reminder channel parity.

## G2-12-030-046  [P1] GAP  facet F19  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewForm.js:56-71 — get full organization interviews per open form
- vNext now: src/modules/placements/college-round-slot-action-service.ts:31-50 — candidate list capped 1000; bookings capped 2000; scoped to job
- Fix: Avoid truncated candidate/overlap scan; paginate or query overlap server-side.

## G2-12-030-048  [P1] GAP  facet F20  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java:184-190,234-257 — pessimistic locks for applicant and learner to serialize parallel bookings
- vNext now: src/modules/placements/college-round-slot-action-service.ts:82-116 — job shared + round row locks; overlap query same job
- Fix: Lock candidate across jobs and enforce conflict at database/concurrency boundary.

## G2-12-030-050  [P1] GAP  facet F21  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java:259-266,285-298 — round description and location sanitized before interpolation into candidate notifications
- vNext now: src/modules/placements/college-round-slot-action-service.ts:82-118,170-181 — stores location in slots and interpolates title/time only
- Fix: Document safe template rendering and secure meeting URL disclosure.

## G2-12-030-051  [P1] GAP  facet F21  effort M
- Legacy: docs/legacy-source/frontend/src/api/Services/interviewService.js:25-39 — fetch organization interviews for conflict list with auth scope
- vNext now: src/modules/placements/college-round-slot-action-service.ts:31-50 — fetch job-specific slot appointments
- Fix: Provide authorized cross-drive conflict read needed for creation preview.

## G2-12-030-054  [P1] GAP  facet F23  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewForm.js:76-89 — client warning for same learner or company interviewer with 15 min buffer
- vNext now: src/modules/placements/college-round-slot-action-service.ts:102-109 — same job candidate or room only; no interviewer and buffer
- Fix: Implement full conflict semantics in server and client, or explicitly designate reduced scope.

## G2-10-013-040  [P1] GAP  facet F10  effort L
- Legacy: docs/legacy-source/frontend/src/api/Services/interviewService.js:20-37 — GET /api/v1/interviews scoped by college; UI filters scheduled interview objects by route jobId.
- vNext now: src/modules/placements/college-drive-interviews-service.ts:13-49; src/modules/placements/college-round-slot-action-service.ts:31-67 — SQL query of placement_job_rounds plus separate candidate-slot appointment joins.
- Fix: Map legacy interview entity fields to round-slot appointments and preserve candidate list.

## G2-10-013-043  [P1] GAP  facet F10  effort L
- Legacy: docs/legacy-source/frontend/src/api/Services/interviewService.js:20-38 — Backend interview statuses/relations from InterviewService route; candidate notification separate.
- vNext now: src/modules/placements/college-round-slot-action-service.ts:68-185 — Modern slot booking mutates round_candidate_slots, activity_events, inAppNotifications.
- Fix: Document status transition and notification mapping between sources.

## G2-10-013-075  [P1] GAP  facet F21  effort L
- Legacy: docs/legacy-source/frontend/src/api/Services/interviewService.js:20-49; docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:148-184 — InterviewService GET responds interview objects including job, learner, status, schedule, mode.
- vNext now: src/modules/placements/college-round-slot-action-service.ts:31-67; src/modules/placements/college-drive-interviews-service.ts:25-49 — Round slot and round list services expose split entities; key/field mapping differs.
- Fix: Map legacy view model to slots+rounds+candidate identities without losing status.

## G2-9-012-020  [P1] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:236-298` — Client applies all filters and sort to all scheduled interviews
- vNext now: `src/modules/placements/college-round-slot-action-service.ts:31-65` — Appointment source limited 2000 and candidate set 1000; no matched filter semantics
- Fix: Add server appointment filters/sorts and count before applying caps

## G2-9-012-036  [P1] GAP  facet F10  effort L
- Legacy: `docs/legacy-source/frontend/src/api/Services/interviewService.js:25-39` — GET /api/v1/interviews scoped organization/college, then job route filters client-side
- vNext now: `src/modules/placements/college-round-slot-action-service.ts:31-65` — Direct SQL reads candidate slots within single scoped job with separate persisted rounds
- Fix: Map legacy single per-interview read to new candidate slot view, including statuses

## G2-9-012-037  [P1] GAP  facet F10  effort L
- Legacy: `docs/legacy-source/frontend/src/api/Services/interviewService.js:93-104` — Legacy PUT interview edit and POST cancel routes
- vNext now: `src/modules/placements/college-round-slot-action-service.ts:68-185` — New POST /api/placements/college/jobs/{jobId}/interviews action switch saves slot and event
- Fix: Check full update/cancel/status side effects match original interview record

## G2-9-012-042  [P1] GAP  facet F12  effort L
- Legacy: `docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:255-276` — Active statuses interpreted SCHEDULED/CONFIRMED/RESCHEDULE_REQUESTED, Completed/Cancelled groups
- vNext now: `src/modules/placements/college-round-slot-action-service.ts:21-29` — Booking state BOOKED projected to SCHEDULED or audit COMPLETED/NO_SHOW
- Fix: Map legacy status transitions, especially reschedule requested and confirmed states

## G2-9-012-043  [P1] GAP  facet F12  effort L
- Legacy: `docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:226-232` — Double-booking conflicts computed across entire unfiltered list of active interviews
- vNext now: `src/modules/placements/college-round-slot-action-service.ts:103-109` — Only mutation-time overlap for job and candidate/room; no display of other jobs conflict
- Fix: Detect cross-job interviewer/room/candidate conflicts and show counts on schedule

## G2-9-012-059  [P1] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:133-159` — All college interviews fetched client-side then filtered, response drives counts
- vNext now: `src/modules/placements/college-round-slot-action-service.ts:34-50` — Bookings limited to 2000 and candidates 1000, round list paginates25
- Fix: Provide accurate counts/full paging beyond caps and stable sort

## G2-9-012-066  [P1] GAP  facet F22  effort L
- Legacy: `docs/legacy-source/frontend/src/api/Services/interviewService.js:17-23` — Legacy persisted Interview entity supports learner/job/application IDs and organisation
- vNext now: `src/modules/placements/college-round-slot-action-service.ts:21-29` — Appointments projected from placementRoundCandidateSlots booked rows with room/panel and version
- Fix: Map legacy Interview ID/state/time/interviewer/meetingLink to vNext booking schema and migrations

## G2-12-030-022  [P3] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewForm.js:113-116 — The selected date and time is in the past
- vNext now: src/modules/placements/college-round-slot-action-service.ts:85 — Schedule an upcoming interview.
- Fix: Align past-time inline error wording.
