# Verification packet (P1 sample): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-2-017-053 [P1] GAP facet F20
- Files: src/modules/courses/progress-service.ts
- Legacy: Legacy save resolves highest attempt and recovers exact failed insert attempt `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerContentProgressServiceImpl.java:123-155`
- Expected fix: Guard current attempt, do not touch historical run from stale tab

## G2-2-018-033 [P1] GAP facet F10
- Files: src/modules/courses/super-admin-lesson-bulk-visibility.ts
- Legacy: AdminLessonBulkController.java:113-119 builds LessonDTO with name, course, sequence and flags to retain metadata
- Expected fix: Preserve lesson name, order and identity on each status write.

## G2-2-018-063 [P1] GAP facet F20
- Files: src/modules/courses/super-admin-lesson-bulk-visibility.ts
- Legacy: Lesson.java:32-39 @Version protects concurrent edits; LessonServiceImpl.java:271-275 transactional save
- Expected fix: Use lesson optimistic token for bulk writes and report conflict by lesson.

## G2-2-033-013 [P1] GAP facet F04
- Files: src/modules/courses/discussion-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClassroomController.java:30-47 courseId/classId integers
- Expected fix: Map historic message identity to delivery UUID and sender membership.

## G2-3-008-043 [P1] GAP facet F09
- Files: src/components/courses/admin-course-actions.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:505-514`
- Expected fix: Legacy Delete course Popconfirm with linked lessons precheck and exact warning; new More→Archive confirmation against active offerings, different blocker.

## G2-3-008-053 [P1] GAP facet F12
- Files: src/components/courses/admin-course-actions.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:491-516`
- Expected fix: Legacy delete blocks when lessons linked, vNext archive blocks when offerings active but hidden courses can still have lessons; match dependency guard rationale.

## G2-3-008-073 [P1] MISSING facet F20
- Files: src/components/courses/admin-course-create-panel.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:214-227`
- Expected fix: Old upload seq invalidates stale presign when college switches and deletes stale image; new no media control, need same safety on restore.

## G2-3-001-033 [P1] GAP facet F06
- Files: src/components/courses/college-quiz-create.tsx
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/QuizBuilderModal.jsx:206-223`
- Expected fix: Restore beforeunload/route-change dirty guard while editing; inline vNext only confirms Cancel.

## G2-3-020-023 [P1] GAP facet F10
- Files: src/modules/courses/teaching-assignment-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/FacultyCourseAssociationServiceImpl.java:104-111`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/FacultyCourseAssociationRepository.java:21-23`
- Expected fix: Legacy deactivate sets active=0 on mapping ID and can leave duplicate row history; vNext sets endedAt with audit event and rejects already ended. Preserve historical association state for migration and correct reactivation policy.

## G2-3-007-033 [P1] GAP facet F10
- Files: src/modules/courses/faculty-assessment-report-service.ts
- Legacy: `docs/legacy-source/frontend/src/components/Report/QuizReportContent.jsx:49-71`; `docs/legacy-source/frontend/src/api/Services/quizServices.js:3-52`
- Expected fix: Legacy GET quiz+all submissions, optional class roster; vNext scoped service requires deliveryId for shared offerings and current roster; trace cross-section report semantics.

## G2-3-007-043 [P1] GAP facet F13
- Files: src/modules/courses/faculty-assessment-report-service.ts
- Legacy: `docs/legacy-source/frontend/src/components/Report/QuizReportContent.jsx:59-67`
- Expected fix: Legacy displays partial report if class roster unavailable, vNext failure hides all sections; must preserve completed quiz/submission section.

## G2-17-027-023 [P1] GAP facet F11
- Files: src/modules/courses/discussion-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DiscussionController.java:47-72`
- Expected fix: Legacy access controls class/course and requireTeachingScope even on GET; vNext learner/faculty section delivery chat allows learners when scoped.

## G2-4-004-093 [P1] GAP facet F21
- Files: src/components/courses/college-assignment-review.tsx
- Legacy: Legacy bulk publisher optional AdminAuditLogService event `ASSIGNMENT_GRADES_PUBLISH_ALL`. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAssignmentPublishController.java:118-124`)
- Expected fix: Record one bulk parent audit event with per-learner publish results.

## G2-14-027-013 [P1] GAP facet F06
- Files: src/modules/courses/validation.ts
- Legacy: Bulk request is non-null array of association DTOs, no explicit size max `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/BulkFacultyCourseAssociationCreateRequestDTO.java:6-15`
- Expected fix: Provide multi-faculty batch bridge or explicitly reject unsupported old payload.

## G2-4-019-003 [P1] GAP facet F01
- Files: src/modules/courses/progress-service.ts
- Legacy: Admin start-attempt checks learner AND course scope. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminLearnerProgressController.java:81-90`)
- Expected fix: Revalidate learner and course in any new administrator retake route.

## G2-4-007-033 [P1] GAP facet F09
- Files: src/components/courses/college-assignment-review.tsx
- Legacy: Publish all grades Popconfirm with skip-unmarked wording. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:365-370`)
- Expected fix: Use styled confirmation and server-grade publish-all across all deliveries.

## G2-4-010-093 [P1] GAP facet F21
- Files: src/components/courses/college-assignment-review.tsx
- Legacy: Legacy bulk publisher optional AdminAuditLogService event `ASSIGNMENT_GRADES_PUBLISH_ALL`. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAssignmentPublishController.java:118-124`)
- Expected fix: Record one bulk parent audit event with per-learner publish results.

## G2-4-010-113 [P1] GAP facet F06
- Files: src/components/courses/college-assignment-create.tsx
- Legacy: Legacy title max255 with example placeholder `e.g., Module 1 Project`. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:355-357`)
- Expected fix: Allow 255, apply same backend Zod constraint and placeholder.

## G2-4-012-053 [P1] GAP facet F11
- Files: src/components/courses/faculty-lesson-authoring.tsx, src/components/courses/faculty-assessment-overview.tsx
- Legacy: Legacy permits teacher CLASS/SHARED creation, but locks visibility on edit. (`docs/legacy-source/frontend/src/components/Global/Offcanvas/Assignment/newAssignment.js:86-97`; `docs/legacy-source/frontend/src/components/Global/Offcanvas/Assignment/newAssignment.js:579-593`)
- Expected fix: Restore authorized creation scope and edit immutability.

## G2-4-028-003 [P1] GAP facet F01
- Files: src/app/(authenticated)/tpo/team/page.tsx
- Legacy: tab=people or members redirects to /tpo/settings?tab=team (`docs/legacy-source/frontend/src/pages/tpo/team.js:7-9`)
- Expected fix: Redirect both aliases to Settings People.

## G2-12-027-053 [P1] GAP facet F20
- Files: (none, new feature)
- Legacy: LBE/service/impl/FacultyTeachingAssignmentServiceImpl.java:87-114: bulk @Transactional creates all requested course IDs or rolls back.
- Expected fix: Unify batch semantics across SA and college callers or explicitly distinguish atomic vs partial.

## G2-7-010-053 [P1] GAP facet F22
- Files: (none, new feature)
- Legacy: LBE/dto/projects/ProjectWorkspaceUpdateDTO.java:meeting fields; LFE/pages/college-admin/projects/workspaces/[workspaceId]/meetings.js:75-79 submits meetingsList + meetingsToken.
- Expected fix: Map legacy JSON meeting keys/date/status/notes to relational rows, including edit/import path.

## G2-8-021-013 [P1] GAP facet F04
- Files: (none, new feature)
- Legacy: Legacy marked_by nullable for pre-migration entries (docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Attend.java:29-36; docs/legacy-source/backend/src/main/resources/db/migration/V128__attendance_marked_by_and_status.sql:10-21).
- Expected fix: Allow an explicit historical unknown/system marker path during migration rather than inventing a faculty ID.

## G2-8-020-023 [P1] GAP facet F06
- Files: src/modules/courses/course-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/CourseServiceImpl.java:271-352 absent JSON child fields preserved reflectively on update
- Expected fix: When metadata restored, merge missing properties rather than overwriting whole object.

## G2-8-020-063 [P1] GAP facet F20
- Files: src/modules/courses/validation.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/CourseServiceImpl.java:303-352 merge absent metadata fields to avoid concurrent erasure
- Expected fix: Carry generic JSON preservation when metadata reintroduced.
