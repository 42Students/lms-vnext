# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-13-008-065 [P1] GAP facet F17
- Files: src/components/courses/faculty-assignment-review.tsx
- Legacy: Old selectable list rows are buttons disabled while gradeSubmitting (`docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/viewSubmissionsModal.jsx:312-330`)
- Expected fix: Disable row switching during grade/publish mutation.

## G2-13-008-075 [P1] GAP facet F20
- Files: src/components/courses/faculty-assignment-review.tsx
- Legacy: Legacy gradeSubmittingRef rejects double submit and prevents panel close (`docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/viewSubmissionsModal.jsx:507-508`)
- Expected fix: Extend pending guard to Drawer onOpenChange and selection changes.

## G2-13-008-080 [P1] GAP facet F22
- Files: src/modules/courses/assignment-submission-service.ts
- Legacy: Legacy studentAssignment numeric id, pointsObtained, graded and gradePublished (`docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/viewSubmissionsModal.jsx:43-93`)
- Expected fix: Map persisted graded flags/grades and preserve historical submissions and publication visibility.

## G2-13-008-081 [P1] GAP facet F22
- Files: src/components/courses/faculty-assignment-review.tsx
- Legacy: Old lessonContentId is submission scope, assignment metadata max points (`docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/viewSubmissionsModal.jsx:80-83`)
- Expected fix: Map lesson content -> course assignment/section; ensure exact cohort filtering.

## G2-17-23-038 [P1] GAP facet F07 Alternative response API
- Files: (none, new feature)
- Legacy: JC:717–720 explicitly rejects nonboolean accept with HTTP 400 "accept (boolean) is required"
- Expected fix: Canonicalize on strict schema so old controller and alternative controller cannot produce opposite outcome for malformed body

## G2-17-028-018 [P1] GAP facet F06 Override values
- Files: (none, new feature)
- Legacy: Legacy linked override form POST at LA:470-471 sends legacy Boolean override + note (LC:688-705)
- Expected fix: Crosswalk nullable Boolean true/false/null to enum, and preserve clear semantics and active override display

## G2-18-019-025 [P1] GAP facet F10 Save side effects
- Files: (none, new feature)
- Legacy: LS:109-122 writes one raw OTP faculty_acct_verification row AFTER LC:443 SMS send
- Expected fix: Check delivery failure cannot leave a usable challenge or imply success; document record retention and phone costs

## G2-18-030-037 [P1] GAP facet F10 Mutations API
- Files: (none, new feature)
- Legacy: L:105-110 create with snake `college_id`, L:145-151 update and L:167-176 delete
- Expected fix: Document snakeCase→server tenant mapping and DELETE→ARCHIVE migration; old API clients must use new safe endpoints

## G2-19-029-061 [P1] GAP facet F21 Domain verification configuration
- Files: (none, new feature)
- Legacy: LB:198-205 tenantResolutionService.isVerifiedDomainRequired central policy
- Expected fix: Pass actual deployment verification policy into readiness evaluation; avoid hard-coded assumption about verification requirement

## G2-13-002-077 [P1] GAP facet F22
- Files: src/app/(authenticated)/hr/home/page.tsx
- Legacy: Old task SQL reads job, change requests, rounds, results, offers, share links and tpo audit log (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterTodayService.java:87-176`)
- Expected fix: Create column/status/index crosswalk for every signal and migration.

## G2-14-003-015 [P1] MISSING facet F04
- Files: src/modules/courses/super-admin-student-course-progress.ts, src/app/(authenticated)/admin/course-progress/students/page.tsx, src/app/api/admin/course-progress/students/export/route.ts
- Legacy: Legacy student row Roll number column and CSV roll; vNext student detail omits roll in query, table and export — `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:166-168,212-224`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:199-209`
- Expected fix: Join learnerProfiles.rollNumber and expose in table and CSV between Student and Videos

## G2-14-003-024 [P1] GAP facet F05
- Files: src/modules/courses/super-admin-student-course-progress.ts, src/app/(authenticated)/admin/course-progress/students/page.tsx
- Legacy: Legacy per-student initial ascending percent sort (furthest behind), numeric header clickable; vNext SQL name ASC and no progress sorting — `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:187-193,372-384`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:211-211`
- Expected fix: Sort by computed percent ASC, tie by stable name, enable column sorting

## G2-14-003-039 [P1] GAP facet F10
- Files: src/modules/courses/super-admin-student-course-progress.ts
- Legacy: Legacy GET /api/v1/admin/course-progress?courseId=&classId= with course+class authorization; vNext server SQL offeringId and admin college scope — `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:37-45,83-113`
- Expected fix: Introduce class+course report service honoring legacy taught-in-class check

## G2-14-003-042 [P1] GAP facet F11
- Files: src/modules/courses/super-admin-student-course-progress.ts
- Legacy: Legacy must authorize both class and course and required teaching relation; vNext admin-scope selection + selected college persisted permission — `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:96-113`
- Expected fix: Validate both course and class (or delivery) scope and teaching binding

## G2-14-003-045 [P1] GAP facet F12
- Files: src/modules/courses/super-admin-student-course-progress.ts
- Legacy: Legacy assignments from visible lesson_contents type assignment; vNext standalone course_assignments PUBLISHED — `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:140-144`
- Expected fix: Map assignment units and visibility from legacy content to new assignments with parity fixtures

## G2-14-003-046 [P1] GAP facet F12
- Files: src/modules/courses/super-admin-student-course-progress.ts
- Legacy: Legacy quiz denominator PUBLISHED + active/enabled/not-deleted; vNext PUBLISHED or CLOSED, not requiring same enabled rules — `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:68-72,145-149`
- Expected fix: Apply equivalent visibility/active and published-only counting, specify CLOSED decision

## G2-14-003-047 [P1] GAP facet F12
- Files: src/modules/courses/super-admin-student-course-progress.ts
- Legacy: Legacy quiz numerator submitted_at IS NOT NULL and not deleted; vNext counts DISTINCT quiz_attempts without submittedAt filter — `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:179-183`
- Expected fix: Count only submitted and nondeleted attempts; exclude drafts

## G2-14-003-071 [P1] GAP facet F19
- Files: src/modules/courses/super-admin-student-course-progress.ts, src/app/(authenticated)/admin/course-progress/students/page.tsx
- Legacy: Legacy backend returns all active class learners and AG table paginates20; vNext SQL hard-limit501, trims to500 and no pages — `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:132-138,185-216`
- Expected fix: Paginate DB scoped learner data beyond500, preserve stable percent sorting

## G2-14-003-075 [P1] GAP facet F20
- Files: src/modules/courses/super-admin-student-course-progress.ts
- Legacy: Legacy quiz requires submitted timestamp; vNext current attempts may count draft/in-progress state — `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:179-183`
- Expected fix: Ensure submittedAt IS NOT NULL on attempts before counting

## G2-14-003-078 [P1] GAP facet F22
- Files: src/modules/courses/super-admin-student-course-progress.ts, src/db/schema/courses.ts
- Legacy: Legacy lesson_contents classId/video/youtube/assignment and quizzes table, student_assignment & learner_content_progress; vNext course_offerings/course_section_deliveries/course_assignments/quiz_attempts — `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:68-72,115-149,167-183`
- Expected fix: Document table/column mapping for legacy lesson-content assignment vs new course assignment and class scope

## G2-14-003-079 [P1] GAP facet F22
- Files: src/modules/courses/super-admin-student-course-progress.ts
- Legacy: Legacy learner roster classId and roll, vNext membership/enrollment/user but omits learnerProfiles in student detail query — `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:132-138,199-209`
- Expected fix: Join learnerProfiles and current class/section assignment; filter active enrollment/retake correctly

## G2-18-018-002 [P1] GAP facet F01
- Files: src/modules/courses/lesson-service.ts
- Legacy: `GET /api/v1/lesson/fetch?courseSlug/courseId` supports both and slug precedence (`LessonController.java:174-184`).
- Expected fix: Map old course slug + numeric id deep links into vNext course-offering-path resolution; document intentional URL compatibility policy.

## G2-18-018-014 [P1] GAP facet F06
- Files: src/modules/courses/validation.ts
- Legacy: Create DTO fields `lessonName`, courseId/courseSlug, optional active/enabled, sequence, contentsDTOs (`LessonDTO.java:13-22`).
- Expected fix: Compare legacy create form and contents-in-same-request workflow; offer equivalent authoring actions or explicitly document deliberate split.

## G2-18-018-021 [P1] MISSING facet F07
- Files: src/modules/courses/validation.ts
- Legacy: Move with class-specific contents blocked with exact long warning (`LessonServiceImpl.java:316-326`).
- Expected fix: Before implementing move, require same-college and curricular ancestry checks and show class-specific warning.

## G2-18-018-025 [P1] GAP facet F10
- Files: src/modules/courses/lesson-service.ts, src/modules/courses/lesson-content-service.ts
- Legacy: POST create persists lesson and optional multiple child contents in one DB transaction (`LessonServiceImpl.java:110-170`).
- Expected fix: Support atomic multi-content create when legacy form sends contents, or explicitly split with recovery path and no orphaned lesson.
