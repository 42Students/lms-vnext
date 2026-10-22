# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-8-020-021  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_19.md)
- [ ] G2-8-020-022  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_19.md)
- [ ] G2-8-020-026  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_19.md)
- [ ] G2-8-020-028  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_19.md)
- [ ] G2-8-020-036  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_19.md)
- [ ] G2-8-020-061  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_19.md)
- [ ] G2-8-021-012  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_19.md)
- [ ] G2-8-022-039  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_19.md)
- [ ] G2-8-023-038  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_19.md)
- [ ] G2-8-024-007  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_19.md)

## Results

- G2-8-020-021: OK — vNext src/modules/courses/validation.ts:93 updateCourseInputSchema.parentCourseId is `uuid | null | optional`: omitted = unchanged, explicit null = cleared (create at :61); matches docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/CourseDTO.java:22-26.
- G2-8-020-022: OK — vNext validation.ts:89-110 update fields enabled, visibleToStudents (persisted as legacyAllowedForDisplay, src/modules/courses/course-service.ts:495-504), description/takeaways/introductionHeading/shortTitle/officialCode/cardColor/thumbnailUrl each validated field by field; active is the ACTIVE/ARCHIVED lifecycle (validation.ts:608-618); matches CourseDTO.java:27-31.
- G2-8-020-026: OK — vNext src/modules/courses/course-service.ts:132-150 assertCourseShortTitleUnique (case-insensitive per active department, used on create :384 and update :489-490) plus the active name unique constraint mapped to COURSE_NAME_CONFLICT (:155-160); matches CourseServiceImpl.java:264-267.
- G2-8-020-028: OK — vNext course-service.ts:464-465 throws COURSE_STALE_VERSION on a stale expectedUpdatedAt and src/components/courses/admin-course-actions.tsx:88-90,190-192 shows "This course was modified by someone else. Refresh and reapply your changes."; matches CourseController.java:384-390.
- G2-8-020-036: OK — vNext src/app/api/courses/[courseId]/department/route.ts (moveCourseDepartmentInputSchema, validation.ts:80-85 with expectedUpdatedAt) and src/components/courses/course-department-move-action.tsx implement the in-college department transfer, with metadata/enabled/visibility edits in the update path; matches CourseController.java:322-403.
- G2-8-020-061: OK — vNext validation.ts:90 requires expectedUpdatedAt on every course edit, course-service.ts:464-465,527,808-844 compare-and-set it, and the edit forms send it and show the stale notice (admin-course-actions.tsx:190); equivalent of the JPA @Version in Course.java:44-53.
- G2-8-021-012: FIXED — src/db/schema/attendance.ts legacyAttendanceAbsence now takes the legacy attendance_status (sourceStatus): EXCUSED/MEDICAL/LATE are preserved, NULL/anything else becomes ABSENT (previously every row was forced to ABSENT); status column check already allows PRESENT/ABSENT/EXCUSED/MEDICAL/LATE (:185). Matches Attend.java:36-44.
- G2-8-022-039: OK — vNext keeps the registration deadline an independent field: src/modules/placements/tpo-season-write-service.ts:36-38,54-61 (future-only, RangeError -> INVALID_REGISTRATION_DEADLINE in src/app/api/placements/seasons/[seasonId]/open-registration/route.ts:22-23) and src/components/placements/tpo-season-registration-controls.tsx:30-37 interprets the picker in IST (+05:30); matches TpoSeasonService.java:44-49 openRegistration(season, deadline).
- G2-8-023-038: OK — vNext src/modules/placements/bulk-drive-service.ts:312-345 records staff-added applications with source TPO_BULK_ADD, submittedByUserId = staff, audit event and an in-app notice "You were added to a placement drive"; the 48h opt-out is derived in src/modules/placements/learner-staff-application-optout-model.ts:2-11, shown in learner-journey-service.ts:262-298 and enforced in application-service.ts:1471-1493; matches TpoDriveAddService.java:121-133.
- G2-8-024-007: OK — vNext shows per-college grant capabilities (src/app/(authenticated)/tpo/settings/recruiters/page.tsx:309, super-admin-recruiter-grant-audit-service.ts:68-69, CSV export tpo-recruiter-grant-export-model.ts:7-14) and grants the full default set deliberately (src/modules/placements/tpo-recruiter-grant-write-service.ts:112), equivalent to RecruiterCapability.INVITE_DEFAULT = all KNOWN in the old LMS; per-grant capability editing is deliberately retired because every vNext check reads the single DRIVES capability; matches SuperAdminRecruiterController.java:56-61,136-146.
