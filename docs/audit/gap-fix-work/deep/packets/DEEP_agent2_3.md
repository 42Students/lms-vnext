# Deep verification packet (round 2, Claude agent 3)

Rows still unchecked after the first deep pass. Each row ends OK (vNext file:line + docs/legacy-source file) or FIXED. DEFERRED is not allowed.

- [ ] G2-15-021-048  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_11.md)
- [ ] G2-20-006-032  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_11.md)
- [ ] G2-20-009-008  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_11.md)
- [ ] G2-20-009-030  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_11.md)
- [ ] G2-20-009-032  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_11.md)
- [ ] G2-20-009-054  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_11.md)
- [ ] G2-19-023-025  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_12.md)
- [ ] G2-4-033-016  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_12.md)
- [ ] G2-4-033-028  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_12.md)
- [ ] G2-13-031-096  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_13.md)
- [ ] G2-5-019-022  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_13.md)
- [ ] G2-5-019-025  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_13.md)
- [ ] G2-11-020-054  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_14.md)
- [ ] G2-5-019-045  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_14.md)
- [ ] G2-5-019-064  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_14.md)
- [ ] G2-5-027-025  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_14.md)
- [ ] G2-5-027-029  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_14.md)
- [ ] G2-5-027-036  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_14.md)
- [ ] G2-5-027-042  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_14.md)
- [ ] G2-5-027-044  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_14.md)
- [ ] G2-5-027-045  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_14.md)
- [ ] G2-5-027-050  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_14.md)
- [ ] G2-5-027-061  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_14.md)
- [ ] G2-5-027-075  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_14.md)
- [ ] G2-5-027-080  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_14.md)
- [ ] G2-6-001-074  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_14.md)
- [ ] G2-6-015-035  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_14.md)
- [ ] G2-15-009-061  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_7.md)
- [ ] G2-15-009-085  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_7.md)
- [ ] G2-15-009-092  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_7.md)

## Results

- G2-15-021-048: OK — vNext src/modules/announcements/service.ts:91-92,573 resolves audiences via UUID college/program/cohort/section/enrollment joins (no numeric ReceiverValue/AnnouncementType); matches intent of docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Announcement.java:23-29 with tenant-safe scoping.
- G2-20-006-032: OK — vNext deliberately has no roll-number sign-in (identity is verified phone/email OTP; a roll number is not an authenticator): src/components/auth/login-form.tsx:296-302 validates empty contact ("Enter your mobile number"/"Enter your email") and src/components/auth/dgipuc-sign-in.tsx keeps the Student/Teacher switch of docs/legacy-source/frontend/src/loginPages/DgipucLogin.js:105-121; roll number is captured only in the learner profile (src/modules/people/college-student-registration-service.ts:87-96).
- G2-20-009-008: OK — vNext never builds public URLs: src/modules/storage/r2-config.ts:61-71 and src/modules/storage/private-object-storage.ts:312-337 issue only 1-15 min signed GETs; legacy public-URL concat (docs/legacy-source/backend/.../utils/R2StorageUtils.java:269-282) is retired and the rehost crosswalk is documented at private-object-storage.ts:30-50.
- G2-20-009-030: OK — every createPrivateReadGrant caller authorizes first (contract at private-object-storage.ts:305-311; callers src/modules/courses/lesson-resource-materials-service.ts:237, assignment-file-service.ts:436, learner-assignment-materials-service.ts:184, src/app/api/courses/deliveries/[deliveryId]/contents/[contentId]/file/route.ts) matching ResourceFileController.java:51-115.
- G2-20-009-032: OK — src/modules/storage/r2-config.ts:61-71 refuses the legacy public bucket (R2_BUCKET_NAME/R2_PUBLIC_URL) outside dev-with-prefix, so URL possession never bypasses revocation (cf. R2StorageUtils.java:276-282).
- G2-20-009-054: OK — src/modules/storage/r2-config.ts:44-71 requires a dedicated R2_PRIVATE_BUCKET and throws PRIVATE_STORAGE_BUCKET_UNSAFE if it equals the legacy shared public bucket; production provisioning is an operator step documented at private-object-storage.ts:30-50 (R2StorageUtils.java:36-40).
- G2-19-023-025: OK — deliberate safe difference: GET stays read-only and marking read is an explicit write (src/components/placements/learner-notice-read-on-view.tsx, learner-notice-read-action.tsx) instead of write-on-GET in LearnerAnnouncementController.java:23-31 (avoids prefetch/crawler side effects).
- G2-4-033-016: OK — src/modules/storage/private-object-storage.ts:14-23,38-50,78-110 maps legacy folder/type to validated namespaces (LEGACY_STORAGE_FOLDER_CROSSWALK) and rejects unknown namespaces; docs/architecture/file-and-video-storage.md:13-17.
- G2-4-033-028: OK — each signed-GET route authorizes parent scope before the grant (src/app/api/courses/deliveries/[deliveryId]/contents/[contentId]/file/route.ts, loadCourseSectionDeliveryScope) matching LessonContentController.java:88-146; the grant itself requires scoped attestation (private-object-storage.ts:312-322).
- G2-13-031-096: OK — deliberate safe difference: src/app/(authenticated)/tpo/reports/page.tsx:167-176,210-218 shows an explicit error with "Retry headline numbers" and states previously loaded figures cannot be verified, keeping all report links; no cross-request cache of tenant placement figures (legacy tpo/reports/[name].js:170-171 stale view not reproduced, for accuracy/privacy).
- G2-5-019-022: OK — src/modules/people/learner-profile-document-edit-service.ts:38-39,100 rejects raw Aadhaar/PAN in profile JSON (PRIVATE_IDENTITY_STORAGE_NOT_READY); format validation at src/modules/people/profile-validation.ts:246-277; deliberately differs from Learner.java:163-166.
- G2-5-019-025: OK — src/modules/people/profile-validation.ts:118,329-390 qualifications carry stable UUID ids, 20-entry cap and one-most-recent rule matching Learner.java:178-181.
- G2-11-020-054: FIXED — skip reasons already cover joined/unsubscribed/missing email; aligned wording to "No email on file" (was "Work email missing") in src/modules/placements/tpo-bulk-invite-preview-model.ts to match docs/legacy-source/frontend/src/pages/tpo/recruiters/index.js:308-321.
- G2-5-019-045: OK — src/modules/people/college-student-csv-service.ts:60-100 replays a prior receipt for the same upload (no duplicate identities) and :228-260 records per-row batch lineage; per-row PARTIAL/FAILED statuses are retryable, matching LearnerServiceImpl.java:74-82 per-row semantics.
- G2-5-019-064: OK — same file: prior-receipt replay (lines 64-95) and ON CONFLICT lineage (250-254) give deterministic recovery without duplicate identities; STUDENT_IDENTITY_ALREADY_REGISTERED guard at college-student-registration-service.ts:86.
- G2-5-027-025: OK — src/modules/people/college-student-registration-service.ts:52-72 verifies program/cohort/section are active and same-college before any person is created (LearnerController.java:338-391).
- G2-5-027-029: OK — college-student-registration-service.ts:72-75 throws the exact "Learner class must belong to the selected program" (LearnerController.java:355) before provisioning.
- G2-5-027-036: OK — deliberate safe difference: undo disabled (college-student-csv-service.ts:318-319,330 undoPolicy DISABLED_UNTIL_REFERENTIAL_DEPENDENCY_REVIEW, reversible:false) because identity creation cannot be reversed atomically; lineage ledger exists for operator review (LearnerController.java:455-461 not reproduced).
- G2-5-027-042: OK — college-student-registration-service.ts:52-96 preflights academic scope, identity and roll conflicts before the identity write; staged partial failures are reported (lines 98-112).
- G2-5-027-044: OK — college-student-csv-service.ts:215-260,310-330 durable batch id (learner_import_batches) and per-row compensation reporting; undo deliberately disabled as above (LearnerController.java:408-434).
- G2-5-027-045: OK — src/modules/attendance/faculty-service.ts:558 single transaction plus recordActivityEventInTransaction at :721 (legacy ATTENDANCE_MARK_BULK alias :735) matches LearnerController.java:801-896.
- G2-5-027-050: OK — roster comes from listActiveDeliveryLearners behind requireFacultyDelivery (src/modules/attendance/faculty-service.ts:145-230, active courseTeachingAssignments check) matching LearnerController.java:630-655.
- G2-5-027-061: OK — batch ids and per-batch ledger exist: college-student-csv-service.ts:223-254 (learner_import_batches/learner_import_batch_members) with history listing after :333; rollback intentionally disabled (see 027-036).
- G2-5-027-075: OK — same ledger (college-student-csv-service.ts:223-254, ON CONFLICT DO NOTHING per membership) and receipt replay :64-95; selective undo deliberately disabled for safety (LearnerController.java:408-468).
- G2-5-027-080: OK — src/modules/attendance/learner-service.ts:279-292 documents classScheduleId->scheduleEventId/delivery mapping and attendanceTaken->MARKED; migration mapping in docs/migration/nsrit-migration-plan.md:219.
- G2-6-001-074: OK — src/db/schema/profiles.ts:66,205-224 requires primaryDepartmentId to belong to the membership college, and src/modules/people/college-role-directory-service.ts:232-256 joins departments on collegeId (Faculty.java:44-49).
- G2-6-015-035: OK — stage is derived from persisted application status + screening status in reads/exports: src/modules/placements/applicant-export-model.ts:20-21,107-108; application-service.ts:1523-1524 (JobApplication.java:29-30).
- G2-15-009-061: FIXED — attendance page error state now reads "Class schedules unavailable" with a Retry link, distinct from empty states, in src/app/(authenticated)/teacher/courses/[deliveryId]/attendanceDetail/page.tsx (legacy TakeAttendanceHeaderFilters.js:102-138).
- G2-15-009-085: OK — docs/migration/nsrit-migration-plan.md:219 maps class_schedule to section_schedule_events/attendance_sessions with naive-IST to timestamptz and nullable marked_at; reads at src/modules/attendance/learner-service.ts:279-292 (ClassSchedule.java:15-35).
- G2-15-009-092: OK — intentional documented policy: src/modules/attendance/faculty-marking-window.ts:3-9,46-52 and badge src/components/attendance/faculty-attendance-workspace.tsx:983 differ from TakeAttendance.js:294-305 unconditional "Ready to mark" (bounded correction window; admin fixes historical marks).

