# Deep verification packet (round 2, Claude agent 5)

Rows still unchecked after the first deep pass. Each row ends OK (vNext file:line + docs/legacy-source file) or FIXED. DEFERRED is not allowed.

- [ ] G2-19-025-050  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_20.md)
- [ ] G2-5-001-065  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_20.md)
- [ ] G2-5-006-069  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_20.md)
- [ ] G2-5-007-045  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_20.md)
- [ ] G2-5-009-046  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_20.md)
- [ ] G2-5-011-047  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_20.md)
- [ ] G2-5-016-047  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_20.md)
- [ ] G2-5-017-007  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_20.md)
- [ ] G2-5-017-008  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_20.md)
- [ ] G2-5-017-014  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_20.md)
- [ ] G2-5-017-030  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_20.md)
- [ ] G2-5-017-046  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_20.md)
- [ ] G2-5-017-047  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_20.md)
- [ ] G2-5-018-010  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_20.md)
- [ ] G2-5-018-024  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_20.md)
- [ ] G2-5-018-040  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_20.md)
- [ ] G2-5-018-046  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_20.md)
- [ ] G2-5-019-008  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_20.md)
- [ ] G2-5-019-011  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_20.md)
- [ ] G2-11-024-051  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_24.md)
- [ ] G2-19-028-022  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_24.md)
- [ ] G2-8-018-012  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_24.md)
- [ ] G2-8-018-045  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_24.md)
- [ ] G2-8-018-058  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_24.md)
- [ ] G2-8-020-072  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_24.md)
- [ ] G2-8-020-074  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_24.md)
- [ ] G2-8-020-076  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_24.md)
- [ ] G2-8-020-078  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_24.md)
- [ ] G2-8-027-007  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_24.md)
- [ ] G2-8-027-014  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_24.md)

## Results

- G2-19-025-050: OK — vNext src/app/api/v1/public/tenant-bootstrap/route.ts:80-90 returns idFormat "uuid", tenantKey from college.legacyUniqueId and UUID collegeId/organizationId (public-safe mapping; legacy int ids never exposed), matching docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicTenantController.java:81-87; host/tenant resolution in src/modules/auth/request-tenant.ts:83-94.
- G2-5-001-065: OK — vNext src/db/schema/attendance.ts:69-73 (attendance_sessions legacyClassScheduleId/legacyAttendanceMarkedAt/legacyClassId/legacyCourseId/legacyFacultyId) keeps every ClassSchedule field from docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ClassSchedule.java:15-35.
- G2-5-006-069: OK — vNext src/db/schema/attendance.ts:125-131 (attendance_records legacyAttendId/legacyClassScheduleId/legacyStudentId/status/reason/markedBy/wasDeleted) plus session legacy columns :69-73 map Attend/ClassSchedule rows of docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAttendanceController.java:136-153.
- G2-5-007-045: OK — vNext src/app/(authenticated)/admin/placements/calendar/appointments/page.tsx:45-56 lists all appointments with no date window, paginated 20 per page, matching docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:148-161; the TPO round view stays a bounded lookahead by design (unit tests assert the 1-90 day cap).
- G2-5-009-046: FIXED — legacyAttendanceSessionState now treats a session with absence rows as marked even when the source attendanceMarkedAt flag is missing (new absenceCount/earliestAbsenceMarkedAt inputs), matching docs/legacy-source/frontend/src/utils/adminAttendanceGrid.js:6-18, in src/db/schema/attendance.ts.
- G2-5-011-047: OK — vNext src/app/(authenticated)/teacher/calendar/error.tsx:12-24 shows an error alert with "Retry class schedule" (reset reloads only the schedule segment, nothing saved is changed); the secondary upcoming-classes read already degrades inline in teacher/calendar/page.tsx:57-80; matches docs/legacy-source/frontend/src/components/CalendarComp/CalendarEvents/CalendarEvents.js:233-253.
- G2-5-016-047: OK — vNext src/db/schema/db10-skills-catalog.draft.ts:71-93 skill_synonyms keeps legacySynonymId/legacySkillId, varchar(100) synonym, non-unique lower(synonym) and skill indexes, matching docs/legacy-source/backend/src/main/java/com/_42students/lms/model/SkillSynonym.java:12-29.
- G2-5-017-007: OK — vNext src/db/schema/projects.ts:128-160 project_template_legacy_events keeps legacyTemplateVersion/actionType/lifecycleStatus/snapshot/sourceActorName/changedByUserId/changedAt/notes, matching docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTemplateVersion.java:14-35.
- G2-5-017-008: OK — vNext src/db/schema/projects.ts snapshot jsonb is audit-only; src/modules/projects/legacy-template-import-model.ts:131-140 sets requiresManualPublicationReview and never trusts the snapshot as live rules (rollback/publish policy), matching ProjectTemplateVersion.java:31-35.
- G2-5-017-014: OK — vNext src/db/schema/projects.ts:128-160 stores each legacy action as its own append-only event row (unique only on legacyEventId), so repeated numeric versions are preserved; matches docs/legacy-source/backend/src/main/resources/db/migration/V160__project_template_version_sort_index.sql:1-7.
- G2-5-017-030: OK — vNext src/db/schema/projects.ts actionType varchar(40) and lifecycleStatus varchar(20) kept as source text, lifecycle interpreted via legacy-template-import-model.ts:20,114-126, matching ProjectTemplateVersion.java:19-24.
- G2-5-017-046: OK — vNext src/db/schema/projects.ts project_template_legacy_events (legacyEventId int, template uuid FK, actor/time/snapshot) and import crosswalk legacy-template-import-model.ts:60-140, matching ProjectTemplateVersion.java:12-35.
- G2-5-017-047: OK — vNext src/db/schema/projects.ts:125-160 immutable per-event ledger preserves duplicate actions on the same numeric version, matching V160__project_template_version_sort_index.sql:1-7.
- G2-5-018-010: OK — vNext src/db/schema/activity.ts:54-55 actorRoleSnapshot/actorNameSnapshot plus nullable actorUserId :33 preserve historical actor display, matching docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectActivityEvent.java:39-46.
- G2-5-018-024: OK — vNext src/db/schema/activity.ts:56-58 legacyProjectEventKey/legacyProjectEventCode/legacyProjectId stored as stable historical codes, matching ProjectActivityEvent.java:20-31.
- G2-5-018-040: OK — vNext src/db/schema/activity.ts:94-96 index activity_events_project_event_idx on (legacyProjectId, occurredAt) replaces the legacy composite index of docs/legacy-source/backend/src/main/resources/db/migration/V97__project_performance_indexes.sql:58-71; project key is a real column so no JSON predicate scan.
- G2-5-018-046: OK — vNext src/db/schema/activity.ts:44-59,79 maps legacy id/project id/event key/code/actor snapshot/metadata jsonb with college/subject columns, matching ProjectActivityEvent.java:10-48.
- G2-5-019-008: OK — vNext src/db/schema/legacy-id-map.ts:19-60 (legacy_id_map old numeric id to uuid, per-college unique) plus src/db/schema/users.ts:25-33 and memberships.ts:33 legacy id columns, matching docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Learner.java:49-59 and BaseModel.java:22-37.
- G2-5-019-011: OK — vNext replaces JWT tokenVersion with DB sessions revoked via revokeAllSessionsForUser (src/auth/session.ts:78-88, src/modules/auth/session-service.ts:73-93) and optimistic concurrency via users.version (users.ts:35,45) and college_memberships.version (memberships.ts:38,63), matching docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Learner.java:64-74 semantics.
- G2-11-024-051: FIXED — added the legacy "Approve each drive a recruiter requests" policy switch (stored in placement_tpo_college_settings.recruiter_drive_needs_approval, default on, wording from docs/legacy-source/frontend/src/pages/tpo/settings.js:616-640) via new RECRUITER_APPROVAL section in src/modules/placements/tpo-communication-change-model.ts, tpo-communication-settings-service.ts, TpoRecruiterApprovalEditor in src/components/tpo/tpo-communication-settings-editors.tsx and src/app/(authenticated)/tpo/settings/recruiters/page.tsx; access months already persisted, trusted domains already at tpo/settings/trusted. Applicant visibility (DIRECT/AFTER_REVIEW) has no column and stays governed by per-drive shares (judgement call).
- G2-19-028-022: OK — vNext src/db/schema/projects.ts:1331-1390 project_meetings keeps meetingKey, linkedSprintId/linkedTaskId, legacyMeetingId, local start/end/timezone, organizer and sync-status fields, matching docs/legacy-source/frontend/src/pages/college-admin/projects/workspaces/[workspaceId]/meetings.js:55-80.
- G2-8-018-012: FIXED — admin notification delivery history now shows "Scheduled for" and "Delivery error" from event metadata next to the status, matching docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/response/NotificationResponseDTO.java:40-50, in src/app/(authenticated)/admin/notification-delivery/page.tsx.
- G2-8-018-045: OK — vNext src/db/schema/activity.ts:259-300 notification_delivery_outbox (SCHEDULED/PROCESSING/SENT/FAILED, attempts, nextRetryAt, error) and in_app_notifications schedule columns :203-206, released only when due by src/modules/operations/notification-scheduled-job-service.ts:123-229, matching docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Notification.java:88-105.
- G2-8-018-058: OK — vNext src/modules/operations/notification-scheduled-job-service.ts:123-137 selects due rows (SCHEDULED or FAILED) via the authenticated scheduler src/app/api/internal/operations/notification-scheduler/route.ts, failures stored in delivery_error (:229) and shown in admin delivery history; matches docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/NotificationRepository.java:164-170.
- G2-8-020-072: OK — vNext src/db/schema/courses.ts:63-79 legacyMetadata jsonb plus explicit columns (imageUrl, introduction html, start/end text, category, type, price, popularity) cover the contents JSON of docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Course.java:55-57.
- G2-8-020-074: OK — vNext src/db/schema/courses.ts:71-72 legacyCourseStartDateText/EndDateText keep the source text verbatim (docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/MetaData.java:28-29); real teaching dates are date columns at :307-308.
- G2-8-020-076: OK — vNext src/db/schema/courses.ts:66-79 retains amount (legacyPriceInr), imageUrl/imageUrlLearningPath and rich introduction as separate fields, matching docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/MetaData.java:20-34.
- G2-8-020-078: OK — vNext src/db/schema/courses.ts:60-61,74,121 keeps enabled, status and legacyAllowedForDisplay as independent flags, matching docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Course.java:36-41.
- G2-8-027-007: OK — vNext src/db/schema/placement-round-candidate-slots.ts:18,62-63 legacyInterviewType constrained to SCREENING/TECHNICAL/HR/MANAGERIAL/FINAL, matching docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java:53-56.
- G2-8-027-014: OK — vNext src/db/schema/placement-round-candidate-slots.ts:27,68-69 legacyDurationMinutes nullable with 15..480 check, matching docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:78-82.
