# Verification packet (P1 sample): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-19-025-003 [P1] GAP facet F01
- Files: src/modules/auth/request-tenant.ts
- Legacy: Legacy GLOBAL dev host and global host entrypoint, college host otherwise; PublicTenantController.java:55-79
- Expected fix: Test exact local/apex/www/tenant host classification and unknown redirects

## G2-15-016-013 [P1] GAP facet F04
- Files: src/db/schema/users.ts
- Legacy: tokenVersion and lastLoginAt. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Recruiter.java:68-73`)
- Expected fix: Prove equivalent session revocation and last-login audit in auth tables.

## G2-15-016-063 [P1] GAP facet F21
- Files: src/db/schema/users.ts
- Legacy: Recruiter separate JPA BaseModel/recruiter table. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Recruiter.java:14-23`)
- Expected fix: Use unified identity mapping with company grants; do not create duplicate users.

## G2-15-001-063 [P1] GAP facet F20
- Files: src/db/schema/courses.ts
- Legacy: Duplicate/invalid mapping IDs shown as disabled cards and warning (courseListingUtils.js:125-159; CoursesContent.jsx:483-485,549-560).
- Expected fix: Surface invalid assignment diagnostics in a stable, non-clickable form rather than silent loss.

## G2-15-005-043 [P1] GAP facet F10
- Files: (none, new feature)
- Legacy: Legacy direct withdraw uses applicationId and learner ID via API (JobDetailContent.jsx:448-460; jobService.js:99-105)
- Expected fix: Specify lifecycle from SUBMITTED→request pending→withdrawn and owner decision vs old direct action

## G2-16-021-003 [P1] GAP facet F02
- Files: src/db/schema/activity.ts
- Legacy: AdminAuditLog.java:25-61 captures actor/scope/IP/UA/payload/time.
- Expected fix: Expose network attribution only with strict admin privacy, retain investigation-critical fields.

## G2-16-024-033 [P1] MISSING facet F10
- Files: src/modules/placements/admin-company-merge-service.ts
- Legacy: CompanyCurationService.java:158-165 moves aliases and source name to canonical.
- Expected fix: Copy aliases and old name before archiving source; preserve company search by old identity.

## G2-17-007-053 [P1] GAP facet F12
- Files: src/db/schema/courses.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Lesson.java:19-39 — Lesson belongs directly to legacy numeric course and has optimistic version.
- Expected fix: Map course->offering->path; preserve version-fence semantics and identify duplicate-name/order import policy.

## G2-17-008-073 [P1] GAP facet F21
- Files: src/db/schema/lesson-content-materials.ts
- Legacy: docs/legacy-source/frontend/src/components/Global/Offcanvas/Syallabus/ResourceComposer.js:91-132 — ResourceComposer calls uploadResourceFile to R2.
- Expected fix: Complete upload/scan attestation/grant workflow.

## G2-17-017-023 [P1] GAP facet F10
- Files: src/db/schema/projects.ts
- Legacy: docs/legacy-source/backend/src/main/resources/db/migration/V119__project_releases.sql:7-24 — project_release table with direct project, key, target date, notes, status, version.
- Expected fix: Extend schema + API safely to preserve legacy fields.

## G2-17-001-043 [P1] GAP facet F22
- Files: src/db/schema/courses.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Course.java:17-43 models integer course with unique slug, active/enabled and allowed_for_display; docs/legacy-source/frontend/src/utils/facultyCourseDetail.js:50-60 canonicalizes to course slug.
- Expected fix: Record deliberate UUID delivery identity versus old course slug and decide old-link compatibility; do not try to reuse old integer IDs without mapping.

## G2-18-007-083 [P1] GAP facet F22
- Files: src/db/schema/courses.ts
- Legacy: Old DB LessonContents has int lesson/course/class/faculty refs, content_data JSON, active/enabled, deleted_with_lesson and version (`LessonContents.java:17-75`).
- Expected fix: Specify lossless migration of each field, optimistic version, deleted-with-lesson marker and tenant scope.

## G2-18-002-023 [P1] GAP facet F04
- Files: src/db/schema/courses.ts, src/app/(authenticated)/admin/lessons/page.tsx, src/components/courses/college-lesson-visibility-controls.tsx
- Legacy: Legacy active+enabled Boolean controls student visibility. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:56-60`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:397-398`
- Expected fix: Define effective old active&&enabled to new lesson visible flag and archive semantics; avoid exposing unpublished lessons.

## G2-19-018-063 [P1] GAP facet F22
- Files: src/db/schema/lecture-halls.ts, drizzle/0052_db02_lecture_hall_timetable_integrity.sql
- Legacy: Legacy has is_deleted in BaseModel; hard-delete service, no DB name unique index per service comment. `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BaseModel.java:28-37` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LectureHallServiceImpl.java:76-80` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LectureHallServiceImpl.java:143-153`
- Expected fix: Preserve historical deleted status and document uniqueness policy.

## G2-2-007-013 [P1] MISSING facet F05
- Files: (none, new feature)
- Legacy: LL:403-413 course autocomplete then class select disabled until course selected
- Expected fix: Add specific section picker constrained to selected course.

## G2-2-036-013 [P1] GAP facet F05
- Files: src/modules/identity/context-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/access/AccessControlService.java:254-263 learner class+elective membership
- Expected fix: Filter learner content and roster queries by enrolled section/elective classes.

## G2-17-026-063 [P1] GAP facet F22
- Files: src/db/schema/activity.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Notification.java:17-105 legacy notification columns class/course/recipient/type/deep-links/creator/schedule/delivery/delete/read
- Expected fix: Implement explicit author-notification and delivery/recipient projection tables or migration mapping

## G2-2-001-043 [P1] GAP facet F12
- Files: (none, new feature)
- Legacy: LS:139-140 released OR verified allowed from fixed/released
- Expected fix: Align transition graph to legacy (including new-to-fixed and fixed-to-verified) or record intentional gate.

## G2-20-017-043 [P1] GAP facet F22
- Files: src/db/schema/projects.ts
- Legacy: Legacy project_meeting FK int, unique project_id/meeting_key, soft-delete/version `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMeeting.java:15-26,160-176`
- Expected fix: Produce migration crosswalk including deleted row/key/version semantics and corresponding Drizzle indexes

## G2-3-001-083 [P1] GAP facet F22
- Files: src/db/schema/quizzes.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Quiz.java:14-55`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/QuizAttempt.java:18-32`
- Expected fix: Map numeric legacy course/class/faculty IDs and active/enabled flags to new UUID lesson/delivery/author fields and archived enum; document migration not needed but behavioral impact.

## G2-3-032-073 [P1] MISSING facet F23
- Files: src/auth/admin-scope.ts
- Legacy: `docs/legacy-source/frontend/src/contexts/SuperAdminScopeContext.js:272-286`
- Expected fix: Old explicit UI/JWT scope out-of-sync indicator absent as distinct vNext visual; add if stale cookie error can be observed.

## G2-11-025-083 [P1] GAP facet F22
- Files: src/db/schema/profile-verification.ts
- Legacy: `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:69-95`
- Expected fix: Legacy studentId numeric and mixed Education rows/Identity nested fields; vNext UUID learnerMembershipId + profile_verifications snapshots/section/status + document manifest. Plan field/state crosswalk.

## G2-3-018-033 [P1] GAP facet F14
- Files: src/db/schema/projects.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDelivery.java:40-61`
- Expected fix: Legacy stores file name,size,MIME/storageKey and additive attachment map; vNext final submissions have attachment JSON and resource-file references but event records no evidence snapshot. Preserve per-revision file identity and ownership.

## G2-4-032-073 [P1] MISSING facet F22
- Files: src/db/schema/activity.ts
- Legacy: Legacy scheduled_at/delivery_status/delivered_at/failure text (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationSchedulerService.java:86-104`)
- Expected fix: Add schedule release and error columns or separate delivery ledger.

## G2-4-020-033 [P1] GAP facet F09
- Files: src/app/(authenticated)/teacher/profile/details/page.tsx, src/modules/people/faculty-profile-readiness.ts
- Legacy: Legacy profile entity itself defines no drawer/popconfirm controls. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:19-24`)
- Expected fix: Register tested profile storage migration so existing profile editing works.
