# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-12-027-002  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_9.md)
- [ ] G2-13-023-026  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_9.md)
- [ ] G2-14-030-038  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_9.md)
- [ ] G2-15-024-011  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_9.md)
- [ ] G2-17-030-077  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_9.md)
- [ ] G2-17-031-011  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_9.md)
- [ ] G2-19-027-066  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_9.md)
- [ ] G2-5-002-064  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_9.md)
- [ ] G2-5-002-067  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_9.md)
- [ ] G2-5-006-066  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_9.md)

## Results

- G2-12-027-002: OK — vNext src/app/api/college/teaching-assignments/[assignmentId]/edit/route.ts:19-30 (PATCH with membership, delivery, role, isActive, academicYear, semester, expectedUpdatedAt CAS) and src/app/api/college/teaching-assignments/bulk/route.ts + src/components/college/college-faculty-reassign-action.tsx cover create/update of docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyTeachingAssignmentController.java:98-113,134-157.
- G2-13-023-026: OK — vNext src/components/placements/learner-schedule-reschedule.tsx:56-60 POSTs requestType ROUND_RESCHEDULE with reason, preferredTimes and proposed time to /api/placements/requests; the booking is unchanged until approved (:65-66 copy) and a pending request blocks duplicates (src/app/(authenticated)/learn/my-placements/page.tsx:196-198); matches TpoScheduleService.java:317-337.
- G2-14-030-038: OK — vNext src/components/admin/super-admin-interview-edit.tsx:54,118-119 accepts RESCHEDULE_REQUESTED rows and shows "Reschedule requested. Review the candidate's request before saving."; learner request records carry reason/preferredTimes (learner-schedule-reschedule.tsx:56-58); matches docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewEditForm.js:85-88,173-186.
- G2-15-024-011: OK — vNext scripts/seed-test-tenants.ts:146-326 seeds inside one BEGIN/COMMIT transaction, looks up existing rows by stable keys (host, phone/email :206-209) and uses ON CONFLICT DO NOTHING (:229,251,259,271,294); matches E2eSeedService.java:82-89 idempotent-ish seeding.
- G2-17-030-077: OK — vNext src/modules/placements/admin-drive-directory-model.ts:69-80 adminDriveIstLocalToInstant converts the legacy timezone-less local timestamp using IST (-330 min) rather than server timezone, and src/components/placements/super-admin-drive-deadline.tsx:8-27,63 sends the picker value as +05:30 and labels it IST; matches DrivesLanding.js:74.
- G2-17-031-011: OK — vNext src/modules/projects/project-legacy-delivery-history-service.ts:19-60 returns submission/draft/submitted/review timeline with version, revision count, actor, feedback and attachment count, exposed via src/app/api/projects/[projectId]/submission/history, /submission/review and /delivery/history; matches docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProjectWorkspaceController.java:341-415.
- G2-19-027-066: OK — vNext src/db/schema/courses.ts:60-74 keeps `enabled`, `legacyAllowedForDisplay`, `deletedAt` as separate flags independent of the ACTIVE/ARCHIVED `status` used in src/modules/courses/course-service.ts:220-222,295-296, so hiding is not conflated with archiving; matches Course.java:38-45.
- G2-5-002-064: OK — vNext src/components/placements/placement-calendar-workspace.tsx:262-264 parses ?jobId, :622-624 filters events, :1065 keeps it across filter submits, :1094-1096 shows "Job filter: <title>" with a clear link (calendarHref jobId ""); matches InterviewCalendarContent.js:190-199,356-393 (TPO audience is drive-scoped by route).
- G2-5-002-067: OK — vNext src/db/schema/placement-college-interviews.ts:9-38 (legacyInterviewId, duration, status, version) and src/db/schema/placement-round-candidate-slots.ts:13-28 (legacyInterviewId/Type/Status/Location/InterviewerName/DurationMinutes/ScheduledAt) with the field-by-field map LEGACY_INTERVIEW_FIELD_DISPOSITION at src/db/schema/placements.ts:2587-2598 preserve historic appointments; matches Interview.java:31-93,161-171.
- G2-5-006-066: OK — vNext src/modules/attendance/policy-service.ts:38-66 resolves the college policy row with DEFAULT_ATTENDANCE_POLICY fallback (hasCollegeOverride), College Admin read-only and Super Admin write (:17-24,84-140), edited in src/components/admin/super-admin-attendance-settings-editor.tsx; matches docs/legacy-source/frontend/src/components/admin/PolicySettingField.js:7-12,92-116.
