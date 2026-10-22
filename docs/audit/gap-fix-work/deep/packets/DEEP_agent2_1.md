# Deep verification packet (round 2, Claude agent 1)

Rows still unchecked after the first deep pass. Each row ends OK (vNext file:line + docs/legacy-source file) or FIXED. DEFERRED is not allowed.

- [ ] G2-13-031-089  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_10.md)
- [ ] G2-4-016-002  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_10.md)
- [ ] G2-4-016-015  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_10.md)
- [ ] G2-4-016-046  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_10.md)
- [ ] G2-4-016-048  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_10.md)
- [ ] G2-4-016-060  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_10.md)
- [ ] G2-4-016-070  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_10.md)
- [ ] G2-4-026-045  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_10.md)
- [ ] G2-4-028-004  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_10.md)
- [ ] G2-5-004-069  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_10.md)
- [ ] G2-5-031-032  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_10.md)
- [ ] G2-5-032-015  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_10.md)
- [ ] G2-8-022-006  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_14.md)
- [ ] G2-8-024-035  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_14.md)
- [ ] G2-9-036-120  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_14.md)
- [ ] G2-16-005-004  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_4.md)
- [ ] G2-13-030-025  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_5.md)
- [ ] G2-13-030-026  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_5.md)
- [ ] G2-13-030-044  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_5.md)
- [ ] G2-3-014-025  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_5.md)
- [ ] G2-3-014-055  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_5.md)
- [ ] G2-5-007-028  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_5.md)
- [ ] G2-12-011-029  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_6.md)
- [ ] G2-12-027-030  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_6.md)
- [ ] G2-14-030-004  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_6.md)
- [ ] G2-15-025-009  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_6.md)
- [ ] G2-5-024-017  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_6.md)
- [ ] G2-5-024-018  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_6.md)
- [ ] G2-5-024-031  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_6.md)
- [ ] G2-5-024-032  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_6.md)
- [ ] G2-5-024-036  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_6.md)

## Results

- G2-13-031-089: OK — vNext src/modules/placements/report-model.ts:1079-1114 dedupes joining counts per learner per company (companyLearnerOffers, one offer per membership) and the page text says "Company figures count each learner once" (src/app/(authenticated)/tpo/reports/joining-status/page.tsx:51); matches docs/legacy-source/backend/.../TpoInsightsService.java:638-644 (COUNT DISTINCT learner).
- G2-4-016-002: OK — shared append-only ledger appendSmsDeliveryAttempt src/modules/notifications/exotel-sms.ts:107-147 (table messagingSmsDeliveryAttempts src/db/schema/messaging-receipts.ts:115) is called by OTP (exotel-sms.ts:151), attendance (src/modules/attendance/parent-sms-provider.ts:25), notice/notification (src/modules/notifications/legacy-sms-notice-provider.ts:43) and messaging providers (src/modules/messaging/providers.ts:265); matches SmsDeliveryLog.java / ExotelSmsServiceImpl.java record() sender paths.
- G2-4-016-015: OK — college_id/organization_id nullable in src/db/schema/messaging-receipts.ts:127-132; appendSmsDeliveryAttempt accepts optional collegeId/organizationId with a paired-presence check (exotel-sms.ts:109-117) and OTP writes null scope (exotel-sms.ts:151), matching nullable college_id in SmsDeliveryLog.java:51-52 while allowing tenant capture for attendance/notice senders.
- G2-4-016-046: OK — exotel-sms.ts:133-139 is a plain INSERT per provider invocation (no upsert; no unique key on attempts besides legacy id), so each retry is a separate row, matching ExotelSmsServiceImpl.java:220-233. The scripts/sql staging file is explicitly marked do-not-execute; the registered table is the drizzle one.
- G2-4-016-048: OK — missing DLT/config produces a FAILED attempt with codes OTP_DLT_NOT_CONFIGURED / OTP_PROVIDER_NOT_CONFIGURED (exotel-sms.ts:246-257) and the support reader maps them to safe text via SMS_FAILURE_LABELS (exotel-sms.ts:78-86, 281-300) shown in src/app/(authenticated)/admin/audit/page.tsx:132; matches ExotelSmsServiceImpl.java:95-101,148-153.
- G2-4-016-060: OK — src/db/schema/messaging-receipts.ts:148 (attempted_at index) and :154-156 (recipient_suffix, purpose, attempted_at index) match V134__sms_delivery_log.sql:37-40; support reader queries them in exotel-sms.ts:268-300.
- G2-4-016-070: OK — outcomes are PROVIDER_ACCEPTED/FAILED only (messaging-receipts.ts:162-165, exotel-sms.ts:97-104), labelled "Provider accepted" and note SMS_PROVIDER_ACCEPTANCE_NOTE (exotel-sms.ts:68, admin/audit/page.tsx:94) states acceptance is not handset delivery; matches SmsDeliveryLog.java:36-43.
- G2-4-026-045: OK — src/modules/placements/public-enquiry/send-service.ts:30-43 locks the page row and requires enabled setting, active college, fresh publishedAt and population>=5 before issuing a code (plus per-email/college/IP hourly limits :44-57); route src/app/api/public/recruit-from-us/send-code/route.ts:9-14 resolves the host tenant first. Matches PublicPlacementsPageController.java:58-63 with stronger anti-abuse.
- G2-4-028-004: OK — src/app/(authenticated)/tpo/team/page.tsx:31-34 drops all query params for tab=people/members/roster (to /tpo/settings?tab=team) and :75-91 forwards the remaining query to /tpo/messages?tab=team, matching docs/legacy-source/frontend/src/pages/tpo/team.js:8-9.
- G2-5-004-069: OK — src/modules/projects/mentor-calendar-view.ts:62-75 returns a validated http(s) join URL for every status except CANCELLED (REQUESTED and COMPLETED included), rendered at src/components/projects/mentor-meetings-calendar.tsx:61-63; matches mentor/calendar.js:85-86,120-125.
- G2-5-031-032: OK — src/components/admin/college-admin-lifecycle-action.tsx:67-72 offers the irreversible "End membership" only once the admin is SUSPENDED, with confirm dialog (:86-89) warning it cannot be reactivated, and the server rejects active project assignments (:38-41, FACULTY_HAS_ACTIVE_PROJECTS). vNext deliberately ends the membership instead of hard-deleting the row so the audit trail and identity are retained (privacy/audit safety); equivalent to AdminUsers.js:228-249.
- G2-5-032-015: OK — src/modules/operations/scheduled-job-runner.ts:165-168 declares shortlistDueTomorrow at 08:00 IST with a 30-minute lease and tomorrowInIndiaUtcWindow (:173-186) restricts to the next local day; src/modules/operations/tpo-shortlist-reminder-source-service.ts:13-47 applies the half-open next-day window with a same-day reminder dedupe; matches TpoScheduledJobs.java:48-49 and TpoAnnouncementService.shortlistDueTomorrow. Delivery wiring is deployment-owned (wired:false).
- G2-8-022-006: OK — src/components/placements/tpo-season-registration-controls.tsx:1-60 (open/close registration with IST deadline, API /api/placements/seasons/{id}/open-registration) and src/app/(authenticated)/tpo/settings/season/page.tsx:127-132 (Registration window "Open until ... IST"); matches PlacementSeason.java:40-61 registration_deadline / is_registration_open.
- G2-8-024-035: OK — src/modules/placements/super-admin-hr-service.ts:985-1040 archive/suspend sets status ARCHIVED (auth-blocking, hidden from ACTIVE lists, reactivatable with audit event) and :1060-1066 terminateSuperAdminHrSessions revokes every session, equivalent to isDeleted=true + tokenVersion++ in RecruiterAdminService.java:307-315. vNext deliberately has no hidden-deleted state so the audit trail and identity stay intact (privacy/audit safety).
- G2-9-036-120: FIXED — NSRIT app_setting migration only imported module.<m>.enabled and wrote locked=false, rejecting module.<m>.locked rows; now locks are carried onto the same module_access_rules row (scripts/migrate/nsrit/plan-placements.ts ModuleRuleData.locked + lock pairing; scripts/migrate/nsrit/db-2bii.ts insert/upsert writes locked). Lock rows with no enabled decision are still rejected into the audit report; college-scope only (legacy export is college-scoped).
- G2-16-005-004: OK — src/app/(authenticated)/tracker/logs/page.tsx:36-60 requires a named, unscoped, ACTIVE Super Admin session and records a denied-attempt audit event; the shared-password gate of TrackerLogsAccessGate.jsx / logs.js:770-815 is deliberately retired (it granted a full Super Admin session from a shared secret), documented in that file.
- G2-13-030-025: OK — src/modules/placements/result-service.ts:241-275 getLegacyInterviewFeedbackContext maps the legacy interview id to a BOOKED round slot, enforces college manage scope, and routes feedback through stagePlacementRoundResult (:278+) with scorePercent/candidateMessage per round and application; matches interviewService.js:161-166 feedback action.
- G2-13-030-026: OK — result-service.ts:264-273 outcomes map: HIRE -> CREATE_OFFER_AFTER_CONFIRMATION (never silently OFFERED/HIRED), REJECT -> STAGE_FAIL_THEN_APPLY with a confirmation warning; matches InterviewServiceImpl.java:1270-1335 intent with explicit safe confirmation.
- G2-13-030-044: OK — result-service.ts:905-930 records the activity event with a dedupeKey inside the apply transaction and delivers the learner notice from that recorded event only when the stage changed (no duplicate events); matches the after-commit single dispatch of InterviewServiceImpl.java:1377-1393.
- G2-3-014-025: OK — src/app/api/courses/search/selection/route.ts:13-70 (authorized POST records a course.search.selected usage event, GET returns scoped counts from the DB so no in-memory refresh is needed) wired in src/components/shell/topbar/command-search.tsx:48-67,92; matches CourseSearchController.java:269-303,353-362.
- G2-3-014-055: OK — same as G2-3-014-025: command-search.tsx:48-67 records selection, :92-95 loads popular counts and :115 ranks by popularity; scoped to the learner's authorized deliveries.
- G2-5-007-028: OK — src/app/(authenticated)/admin/placements/interviews/page.tsx:105-112 hard failure shows "Could not load appointments" with a Retry link, and :128-133 a partial (department mapping) failure keeps the loaded rows with a warning and Retry; matches InterviewCalendarContent.js:148-180,779-789 (server-rendered page has no stale client rows).
- G2-12-011-029: FIXED — recruiter bell now includes unread TPO message threads with last message within 30 days, tenant/recruiter scoped, via the existing listRecentUnreadRecruiterThreads, merged into the feed and unread count in src/modules/placements/hr-recruiter-bell-service.ts (readHrRecruiterBell, countHrRecruiterBellUnread).
- G2-12-027-030: OK — Super Admin create is atomic (src/app/api/admin/faculty-assignment/batch/route.ts + createCourseTeachingAssignmentsBatch single transaction, teaching-assignment-batch-service.ts:81-121); the college bulk path (src/app/api/college/teaching-assignments/bulk/route.ts:14-37, src/components/college/college-faculty-assignment-actions.tsx:106-150) explicitly labels partial success: pre-confirm warning, per-faculty receipts and "N associations created; M refused. Review every receipt before retrying."
- G2-14-030-004: FIXED — reordered super-admin interview edit fields to legacy order: type, round description, interviewer, duration, date/time, mode, location/link, notes, then vNext reason in src/components/admin/super-admin-interview-edit.tsx.
