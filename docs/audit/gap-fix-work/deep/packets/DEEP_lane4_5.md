# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-2-006-052  (source: docs/audit/gap-fix-work/verify2/packets/lane-8/W1_lane8_5.md)
- [ ] G2-2-009-038  (source: docs/audit/gap-fix-work/verify2/packets/lane-8/W1_lane8_5.md)
- [ ] G2-2-012-011  (source: docs/audit/gap-fix-work/verify2/packets/lane-8/W1_lane8_5.md)
- [ ] G2-2-014-019  (source: docs/audit/gap-fix-work/verify2/packets/lane-8/W1_lane8_5.md)
- [ ] G2-2-017-006  (source: docs/audit/gap-fix-work/verify2/packets/lane-8/W1_lane8_5.md)
- [ ] G2-2-029-016  (source: docs/audit/gap-fix-work/verify2/packets/lane-8/W1_lane8_5.md)
- [x] G2-2-029-059  (source: docs/audit/gap-fix-work/verify2/packets/lane-8/W1_lane8_5.md)
- [ ] G2-2-029-065  (source: docs/audit/gap-fix-work/verify2/packets/lane-8/W1_lane8_5.md)
- [ ] G2-2-029-102  (source: docs/audit/gap-fix-work/verify2/packets/lane-8/W1_lane8_5.md)
- [ ] G2-2-031-016  (source: docs/audit/gap-fix-work/verify2/packets/lane-8/W1_lane8_5.md)

## Results

- G2-2-029-059: OK — vNext `src/modules/academics/college-batch-retire-service.ts:33-44` resolves acting-college Super Admin with `academics.manage` and scopes the batch lookup to the resolved college through department and program; legacy `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/BatchController.java:308-321` permits scoped Super Admin actions. The separate delete-versus-archive retention difference remains explicitly documented in the same vNext service at lines 12-20; this verification covers the scoped SA authorization requirement, not hard-delete parity.

- [x] G2-2-006-052  (source: docs/audit/gap-fix-work/verify2/packets/lane-8/W1_lane8_5.md)
- [x] G2-2-009-038  (source: docs/audit/gap-fix-work/verify2/packets/lane-8/W1_lane8_5.md)
- [x] G2-2-012-011  (source: docs/audit/gap-fix-work/verify2/packets/lane-8/W1_lane8_5.md)
- [x] G2-2-014-019  (source: docs/audit/gap-fix-work/verify2/packets/lane-8/W1_lane8_5.md)
- [x] G2-2-017-006  (source: docs/audit/gap-fix-work/verify2/packets/lane-8/W1_lane8_5.md)
- [x] G2-2-029-016  (source: docs/audit/gap-fix-work/verify2/packets/lane-8/W1_lane8_5.md)
- [x] G2-2-029-059  (source: docs/audit/gap-fix-work/verify2/packets/lane-8/W1_lane8_5.md)
- [x] G2-2-029-065  (source: docs/audit/gap-fix-work/verify2/packets/lane-8/W1_lane8_5.md)
- [x] G2-2-029-102  (source: docs/audit/gap-fix-work/verify2/packets/lane-8/W1_lane8_5.md)
- [x] G2-2-031-016  (source: docs/audit/gap-fix-work/verify2/packets/lane-8/W1_lane8_5.md)

## Results

- G2-2-006-052: FIXED — admin/faculty assignment PATCH now requires expectedUpdatedAt (409 FACULTY_ASSIGNMENT_STALE_VERSION when absent) and parses the body with updateCourseAssignmentInputSchema in src/app/api/courses/assignments/[assignmentId]/route.ts; service CAS already compares locked.updatedAt (src/modules/courses/assignment-service.ts:357).
- G2-2-009-038: OK — vNext src/modules/attendance/admin-service.ts:643-647 rejects pre-start attendance (ATTENDANCE_NOT_STARTED) server-side so deep links cannot bypass; matches docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:22 isHeld.
- G2-2-012-011: OK — vNext src/modules/admin-ui/college-dashboard-risk-service.ts:36-100 returns rollNumber, className, marked/attended, total count and percent with implicit present marks, limit 8; matches docs/legacy-source/backend AdminCollegeDashboardController.java:161-177.
- G2-2-014-019: OK — vNext src/modules/courses/super-admin-course-bulk-visibility.ts:35-50,100-130 processes valid courses independently and returns per-course failures/failedCourseIds; matches AdminCourseBulkController.java:110-117.
- G2-2-017-006: OK — vNext src/app/(authenticated)/college/course-progress/page.tsx:86 renders CollegeCourseRetakeAction (src/components/college/college-course-retake-action.tsx:50-74) with explicit Start next attempt button using selected learner+course; matches AdminLearnerProgressController.java:61-74.
- G2-2-029-016: FIXED — added legacyBatchImportSchema/translateLegacyBatchToCohort (ignores currentStudents, requires code/period, documents Planned default vs legacy ACTIVE) in src/modules/academics/college-cohort-mutation-model.ts; matches BatchRequestDTO.java:13-29.
- G2-2-029-059: OK — vNext src/modules/academics/college-batch-retire-service.ts:35-40 retires through resolveActingCollege("academics.manage") (acting-college SA or College Admin, scoped), soft archive only; matches BatchController.java:308-321 scoped delete.
- G2-2-029-065: FIXED — added read-only getPromotionTeachingForecast (src/modules/academics/college-promotion-teaching-forecast.ts) and wired exact Faculty assignments ending count into the promotion confirmation on src/app/(authenticated)/college/batch-promotion/page.tsx and src/app/(authenticated)/admin/batch-promotion/page.tsx; execute keeps shared-course assignments (college-batch-promotion-execute.ts:84-138); matches BatchServiceImpl.java:312-320.
- G2-2-029-102: OK — vNext src/modules/academics/college-batch-promotion-execute.ts:84-138,180-204 ends old-only teaching assignments, retains shared-course ones and records endedTeachingAssignments/retainedSharedTeachingAssignments in the progression audit event; matches BatchServiceImpl.java:312-320.
- G2-2-031-016: OK — vNext src/modules/academics/college-section-mutation-model.ts:68-118 legacyClassImportSchema + translateLegacyClassToSection translate program_id/batch_id/upper_limit/lower_limit/description/startDate/endDate (zero upper = no limit); matches ClassDTO.java:11-24.
